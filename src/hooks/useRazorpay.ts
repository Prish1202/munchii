import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { Checkout as RazorpayNative } from 'capacitor-razorpay';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function checkOrderPaid(orderId: string, token?: string): Promise<boolean> {
  try {
    const t = token ?? (await supabase.auth.getSession()).data.session?.access_token;
    if (!t) return false;
    const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-razorpay-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${t}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ orderId }),
    });
    const d = await res.json();
    return res.ok && d.success === true;
  } catch {
    return false;
  }
}

export function useRazorpay() {
  const [isProcessing, setIsProcessing] = useState(false);

  const initiatePayment = async ({
    orderId,
    userName,
    userEmail,
    userPhone,
    onSuccess,
    onFailure,
  }: {
    orderId: string;
    userName?: string;
    userEmail?: string;
    userPhone?: string;
    onSuccess: (orderId: string) => void;
    onFailure: (error: string) => void;
  }) => {
    setIsProcessing(true);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      // Create Razorpay order via edge function
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create payment');

      // Inside the Android/iOS app, use Razorpay's native checkout so UPI apps
      // (GPay, PhonePe, Paytm) are shown and open correctly.
      if (Capacitor.isNativePlatform()) {
        let ok = false;
        try {
          const result: any = await RazorpayNative.open({
            key: data.keyId,
            amount: String(data.amount),
            currency: data.currency,
            name: 'Munchii',
            description: 'Food Order Payment',
            order_id: data.razorpayOrderId,
            prefill: { name: userName || '', email: userEmail || '', contact: userPhone || '' },
            theme: { color: '#1E3A8A' },
          } as any);
          let r: any = result?.response ?? result;
          if (typeof r === 'string') { try { r = JSON.parse(r); } catch { /* ignore */ } }
          if (r?.razorpay_payment_id && r?.razorpay_signature) {
            const vr = await fetch(`${SUPABASE_URL}/functions/v1/verify-razorpay-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
              body: JSON.stringify({
                razorpay_order_id: r.razorpay_order_id || data.razorpayOrderId,
                razorpay_payment_id: r.razorpay_payment_id,
                razorpay_signature: r.razorpay_signature,
              }),
            });
            ok = vr.ok;
          }
        } catch (e) {
          console.warn('Native checkout closed:', e);
        }
        // Fallback: ask the server/Razorpay directly whether money was received.
        if (!ok) {
          for (let i = 0; i < 4 && !ok; i++) {
            ok = await checkOrderPaid(orderId, token);
            if (!ok) await new Promise((r) => setTimeout(r, 2500));
          }
        }
        setIsProcessing(false);
        if (ok) onSuccess(orderId);
        else onFailure('cancelled');
        return;
      }


      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Munchii',
        description: 'Food Order Payment',
        order_id: data.razorpayOrderId,
        handler: async (response: RazorpayResponse) => {
          try {
            // Verify payment
            const verifyRes = await fetch(
              `${SUPABASE_URL}/functions/v1/verify-razorpay-payment`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                  apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              }
            );

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed');

            onSuccess(verifyData.orderId);
          } catch (err: any) {
            console.error('Payment verification error:', err);
            onFailure(err.message);
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: userName || '',
          email: userEmail || '',
          contact: userPhone || '',
        },
        theme: { color: '#f97316' },
        modal: {
          ondismiss: async () => {
            // In the mobile app, returning from a UPI app can close checkout without the
            // success callback. Ask the server whether the payment actually went through.
            const ok = await recheck();
            setIsProcessing(false);
            if (ok) onSuccess(orderId);
            else onFailure('cancelled');
          },
        },
      };

      let settled = false;
      const recheck = async (): Promise<boolean> => {
        for (let i = 0; i < 4; i++) {
          if (await checkOrderPaid(orderId, token)) { settled = true; return true; }
          await new Promise((r) => setTimeout(r, 2500));
        }
        return false;
      };

      // When the app returns to the foreground after a UPI app, re-check payment.
      const onVisible = async () => {
        if (document.visibilityState !== 'visible' || settled) return;
        if (await checkOrderPaid(orderId, token)) {
          settled = true;
          document.removeEventListener('visibilitychange', onVisible);
          setIsProcessing(false);
          try { rzp.close?.(); } catch { /* ignore */ }
          onSuccess(orderId);
        }
      };
      document.addEventListener('visibilitychange', onVisible);
      setTimeout(() => document.removeEventListener('visibilitychange', onVisible), 15 * 60_000);

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        setIsProcessing(false);
        console.error('Payment failed:', response.error);
        onFailure(response.error?.description || 'Payment failed');
      });
      rzp.open();
    } catch (err: any) {
      setIsProcessing(false);
      console.error('Razorpay error:', err);
      toast.error(err.message || 'Payment initiation failed');
      onFailure(err.message);
    }
  };

  return { initiatePayment, isProcessing };
}
