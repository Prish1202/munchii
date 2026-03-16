import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

            toast.success('Payment successful!');
            onSuccess(verifyData.orderId);
          } catch (err: any) {
            console.error('Payment verification error:', err);
            toast.error(err.message || 'Payment verification failed');
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
          ondismiss: () => {
            setIsProcessing(false);
            toast.info('Payment cancelled');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        setIsProcessing(false);
        console.error('Payment failed:', response.error);
        toast.error(response.error?.description || 'Payment failed');
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
