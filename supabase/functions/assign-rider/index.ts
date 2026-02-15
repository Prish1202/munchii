import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371 // km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { order_id, restaurant_id } = await req.json()

    if (!order_id || !restaurant_id) {
      return new Response(JSON.stringify({ error: 'Missing order_id or restaurant_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Check if delivery already exists for this order
    const { data: existingDelivery } = await supabase
      .from('deliveries')
      .select('id')
      .eq('order_id', order_id)
      .maybeSingle()

    if (existingDelivery) {
      return new Response(JSON.stringify({ message: 'Delivery already assigned' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get restaurant location (city + address for now)
    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .select('id, city, address')
      .eq('id', restaurant_id)
      .single()

    if (restError || !restaurant) {
      return new Response(JSON.stringify({ error: 'Restaurant not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Find online delivery partners in the same city with GPS coordinates
    const { data: onlineRiders, error: ridersError } = await supabase
      .from('delivery_partner_locations')
      .select('user_id, current_lat, current_lng, city')
      .eq('is_online', true)
      .not('current_lat', 'is', null)
      .not('current_lng', 'is', null)

    if (ridersError || !onlineRiders || onlineRiders.length === 0) {
      console.log('No online riders found')
      return new Response(JSON.stringify({ message: 'No riders available' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Filter by same city (case-insensitive)
    const restaurantCity = restaurant.city?.toLowerCase().trim()
    const sameCityRiders = restaurantCity
      ? onlineRiders.filter(r => r.city?.toLowerCase().trim() === restaurantCity)
      : onlineRiders

    if (sameCityRiders.length === 0) {
      console.log('No riders in the same city')
      return new Response(JSON.stringify({ message: 'No riders in city' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check which riders are already on active deliveries
    const riderIds = sameCityRiders.map(r => r.user_id)

    const { data: busyOrders } = await supabase
      .from('orders')
      .select('delivery_partner_id')
      .in('delivery_partner_id', riderIds)
      .in('status', ['accepted', 'preparing', 'ready', 'picked_up'])

    const busyRiderIds = new Set((busyOrders || []).map(o => o.delivery_partner_id))
    const availableRiders = sameCityRiders.filter(r => !busyRiderIds.has(r.user_id))

    if (availableRiders.length === 0) {
      console.log('All riders are busy')
      return new Response(JSON.stringify({ message: 'All riders busy' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use a simple geocode approach: we'll use the first available rider's reference
    // For proper distance, we'd need restaurant lat/lng. For now, pick the rider 
    // who was last seen most recently (proxy for being active/nearby)
    // If we have restaurant coordinates in the future, we can use haversine.
    
    // Sort by last_seen_at desc as a proximity proxy, or if we want to use 
    // any rider coords as a baseline, we just pick the first available one.
    // Actually, let's just pick the first available rider for now since
    // all are in the same city. A more sophisticated system would need 
    // restaurant lat/lng.
    
    const selectedRider = availableRiders[0]

    // Assign the delivery partner to the order
    const { error: updateError } = await supabase
      .from('orders')
      .update({ delivery_partner_id: selectedRider.user_id })
      .eq('id', order_id)

    if (updateError) {
      console.error('Failed to assign rider to order:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to assign rider' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create delivery record
    const { error: deliveryError } = await supabase
      .from('deliveries')
      .insert({
        order_id,
        status: 'assigned',
        current_lat: selectedRider.current_lat,
        current_lng: selectedRider.current_lng,
      })

    if (deliveryError) {
      console.error('Failed to create delivery:', deliveryError)
      return new Response(JSON.stringify({ error: 'Failed to create delivery' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Assigned rider ${selectedRider.user_id} to order ${order_id}`)

    return new Response(JSON.stringify({ 
      success: true, 
      rider_id: selectedRider.user_id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('assign-rider error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
