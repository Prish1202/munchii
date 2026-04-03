const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { orderId } = await req.json()

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch order with restaurant details
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*, restaurant:restaurants(name, address)')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch customer profile and email
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('name')
      .eq('id', order.customer_id)
      .single()

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(order.customer_id)
    const customerEmail = authUser?.user?.email

    if (!customerEmail) {
      return new Response(JSON.stringify({ error: 'No customer email found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch order items
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('*, menu_item:menu_items(name)')
      .eq('order_id', orderId)

    // Calculate coins earned
    const platformFee = 4
    const itemTotal = Math.max(Number(order.total_amount) - platformFee, 0)
    const coinsEarned = Math.round(itemTotal * 0.03)

    const customerName = profile?.name || 'Valued Customer'
    const restaurantName = order.restaurant?.name || 'Restaurant'
    const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    const orderId6 = orderId.slice(-6).toUpperCase()

    // Build order items HTML
    const itemsHtml = (orderItems || []).map((item: any) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #333;">
          ${item.menu_item?.name || 'Item'} × ${item.quantity}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #333; text-align: right;">
          ₹${(Number(item.price_at_time) * item.quantity).toFixed(0)}
        </td>
      </tr>
    `).join('')

    const paymentLabel = order.payment_method === 'cod' ? 'Cash on Pickup'
      : order.payment_method === 'upi' ? 'UPI'
      : order.payment_method === 'card' ? 'Card'
      : order.payment_method === 'razorpay' ? 'Paid Online'
      : order.payment_method

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
    <body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f7f7; padding: 30px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
            
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #FF6A1A 0%, #FF8A4C 100%); padding: 32px 40px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">🎉 Order Complete!</h1>
                <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Thank you for ordering with Munchii</p>
              </td>
            </tr>

            <!-- Greeting -->
            <tr>
              <td style="padding: 32px 40px 16px;">
                <p style="margin: 0; font-size: 16px; color: #333;">Hi <strong>${customerName}</strong>,</p>
                <p style="margin: 12px 0 0; font-size: 14px; color: #666; line-height: 1.6;">
                  Your order has been completed successfully! Here's a summary of your order.
                </p>
              </td>
            </tr>

            <!-- Order Info Card -->
            <tr>
              <td style="padding: 0 40px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background: #FFF7F0; border-radius: 12px; border: 1px solid #FFE8D6;">
                  <tr>
                    <td style="padding: 20px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px;">Order ID</td>
                          <td style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">Date</td>
                        </tr>
                        <tr>
                          <td style="font-size: 16px; color: #FF6A1A; font-weight: 700; padding-top: 4px;">#${orderId6}</td>
                          <td style="font-size: 13px; color: #333; text-align: right; padding-top: 4px;">${orderDate}</td>
                        </tr>
                        <tr><td colspan="2" style="padding-top: 12px; border-top: 1px solid #FFE8D6;"></td></tr>
                        <tr>
                          <td style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px;">Restaurant</td>
                          <td style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">Payment</td>
                        </tr>
                        <tr>
                          <td style="font-size: 14px; color: #333; font-weight: 600; padding-top: 4px;">${restaurantName}</td>
                          <td style="font-size: 14px; color: #333; text-align: right; padding-top: 4px;">${paymentLabel}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Order Items -->
            <tr>
              <td style="padding: 0 40px 24px;">
                <h3 style="margin: 0 0 12px; font-size: 14px; color: #333; text-transform: uppercase; letter-spacing: 0.5px;">Order Items</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${itemsHtml}
                  <tr>
                    <td style="padding: 16px 0 0; font-size: 12px; color: #999;">Platform fee</td>
                    <td style="padding: 16px 0 0; font-size: 12px; color: #999; text-align: right;">₹${platformFee}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0; font-size: 18px; color: #333; font-weight: 700; border-top: 2px solid #FF6A1A;">Total</td>
                    <td style="padding: 12px 0 0; font-size: 18px; color: #FF6A1A; font-weight: 700; text-align: right; border-top: 2px solid #FF6A1A;">₹${Number(order.total_amount).toFixed(0)}</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Coins Earned -->
            ${coinsEarned > 0 ? `
            <tr>
              <td style="padding: 0 40px 32px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #FFF9E6 0%, #FFFBF0 100%); border-radius: 12px; border: 1px solid #FFE566;">
                  <tr>
                    <td style="padding: 20px; text-align: center;">
                      <p style="margin: 0; font-size: 32px;">🪙</p>
                      <p style="margin: 8px 0 4px; font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Coins Earned</p>
                      <p style="margin: 0; font-size: 28px; color: #D4A017; font-weight: 800;">+${coinsEarned}</p>
                      <p style="margin: 8px 0 0; font-size: 12px; color: #888;">Added to your wallet! Redeem on future orders.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ` : ''}

            <!-- Footer -->
            <tr>
              <td style="padding: 24px 40px 32px; border-top: 1px solid #f0f0f0; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #999;">
                  This is an automated email from <strong>Munchii</strong>. Please do not reply.
                </p>
                <p style="margin: 8px 0 0; font-size: 11px; color: #bbb;">
                  © ${new Date().getFullYear()} Munchii. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
    `

    // Send email via Resend
    const emailResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Munchii <orders@munchii.in>',
        to: [customerEmail],
        subject: `✅ Order #${orderId6} Complete — ${coinsEarned > 0 ? `You earned ${coinsEarned} coins!` : 'Thank you!'}`,
        html: emailHtml,
      }),
    })

    const emailResult = await emailResp.json()

    if (!emailResp.ok) {
      console.error('Resend error:', emailResult)
      return new Response(JSON.stringify({ error: 'Failed to send email', detail: emailResult }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, emailId: emailResult.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Order email error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
