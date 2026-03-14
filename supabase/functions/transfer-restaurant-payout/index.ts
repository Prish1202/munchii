import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function is called internally when order is completed
    // It can be triggered by a database webhook or called from admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { orderId } = await req.json();
    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("id, total_amount, status, payment_method, restaurant_id")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.status !== "completed") {
      return new Response(JSON.stringify({ error: "Order not completed yet" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if payout already exists
    const { data: existingPayout } = await supabaseAdmin
      .from("payouts")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle();

    if (existingPayout) {
      return new Response(JSON.stringify({ success: true, message: "Payout already processed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const platformFee = 4;
    const itemTotal = Math.max(order.total_amount - platformFee, 0);
    const commission = Math.round(itemTotal * 0.10 * 100) / 100;
    const restaurantAmount = itemTotal - commission;

    let razorpayTransferId: string | null = null;

    // Only do Razorpay Route transfer for online payments
    if (order.payment_method !== "cod") {
      const { data: payment } = await supabaseAdmin
        .from("payments")
        .select("razorpay_payment_id")
        .eq("order_id", orderId)
        .eq("status", "paid")
        .single();

      if (payment?.razorpay_payment_id) {
        const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
        const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

        if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
          // Fetch restaurant's linked Razorpay account (if using Route)
          // For now, we log the transfer details. 
          // In production, you'd create a Razorpay Route transfer here:
          // POST /v1/payments/{payment_id}/transfers
          
          const { data: bankDetails } = await supabaseAdmin
            .from("restaurant_bank_details")
            .select("*")
            .eq("restaurant_id", order.restaurant_id)
            .single();

          console.log("Restaurant payout details:", {
            orderId,
            restaurantAmount,
            commission,
            platformFee,
            paymentId: payment.razorpay_payment_id,
            bankDetails: bankDetails ? "found" : "not found",
          });

          // TODO: When restaurant has Razorpay linked account, uncomment:
          // const transferRes = await fetch(
          //   `https://api.razorpay.com/v1/payments/${payment.razorpay_payment_id}/transfers`,
          //   {
          //     method: "POST",
          //     headers: {
          //       "Content-Type": "application/json",
          //       Authorization: "Basic " + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
          //     },
          //     body: JSON.stringify({
          //       transfers: [{
          //         account: restaurantLinkedAccountId,
          //         amount: Math.round(restaurantAmount * 100),
          //         currency: "INR",
          //         notes: { order_id: orderId },
          //       }],
          //     }),
          //   }
          // );
          // const transferData = await transferRes.json();
          // razorpayTransferId = transferData.items?.[0]?.id;
        }
      }
    }

    // Record payout
    const { error: payoutErr } = await supabaseAdmin.from("payouts").insert({
      order_id: orderId,
      restaurant_amount: restaurantAmount,
      platform_fee: commission + platformFee,
      razorpay_transfer_id: razorpayTransferId,
    });

    if (payoutErr) {
      console.error("Payout insert error:", payoutErr);
      throw new Error("Failed to record payout");
    }

    return new Response(
      JSON.stringify({
        success: true,
        restaurantAmount,
        commission,
        platformFee,
        razorpayTransferId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
