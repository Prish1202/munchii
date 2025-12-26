import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeSync } from './useRealtimeSync';
import type { Database } from '@/integrations/supabase/types';

type DeliveryStatus = Database['public']['Enums']['delivery_status'];
type OrderStatus = Database['public']['Enums']['order_status'];

export interface DeliveryOrder {
  id: string;
  order_id: string;
  status: DeliveryStatus;
  current_lat: number | null;
  current_lng: number | null;
  created_at: string;
  updated_at: string;
  order: {
    id: string;
    total_amount: number;
    status: OrderStatus;
    created_at: string;
    restaurant: {
      id: string;
      name: string;
      address: string;
    } | null;
  } | null;
}

export function useDeliveryOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deliveries, isLoading, error } = useQuery({
    queryKey: ['delivery-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          order:orders!inner(
            id,
            total_amount,
            status,
            created_at,
            restaurant:restaurants(id, name, address)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DeliveryOrder[];
    },
    enabled: !!user?.id,
  });

  const handleDeliveryUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['delivery-orders', user?.id] });
  }, [queryClient, user?.id]);

  const handleOrderUpdate = useCallback((payload: any) => {
    queryClient.invalidateQueries({ queryKey: ['delivery-orders', user?.id] });
    if (payload.new?.status === 'ready') {
      toast({
        title: 'Order Ready!',
        description: 'An order is ready for pickup.',
      });
    }
  }, [queryClient, user?.id, toast]);

  // Real-time subscription for deliveries
  const { isConnected: deliveriesConnected } = useRealtimeSync({
    channelName: `delivery-updates-${user?.id}`,
    table: 'deliveries',
    onAny: handleDeliveryUpdate,
    enabled: !!user?.id,
  });

  // Real-time subscription for order status changes
  const { isConnected: ordersConnected } = useRealtimeSync({
    channelName: `delivery-order-updates-${user?.id}`,
    table: 'orders',
    onUpdate: handleOrderUpdate,
    enabled: !!user?.id,
  });

  return { 
    deliveries: deliveries || [], 
    isLoading, 
    error, 
    isConnected: deliveriesConnected && ordersConnected 
  };
}

export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      deliveryId, 
      status,
      orderStatus 
    }: { 
      deliveryId: string; 
      status: DeliveryStatus;
      orderStatus?: OrderStatus;
    }) => {
      // Update delivery status
      const { error: deliveryError } = await supabase
        .from('deliveries')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', deliveryId);

      if (deliveryError) throw deliveryError;

      // Update order status if provided
      if (orderStatus) {
        const { data: delivery } = await supabase
          .from('deliveries')
          .select('order_id')
          .eq('id', deliveryId)
          .single();

        if (delivery) {
          const { error: orderError } = await supabase
            .from('orders')
            .update({ status: orderStatus, updated_at: new Date().toISOString() })
            .eq('id', delivery.order_id);

          if (orderError) throw orderError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders', user?.id] });
      toast({
        title: 'Status Updated',
        description: 'Delivery status has been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      deliveryId, 
      lat, 
      lng 
    }: { 
      deliveryId: string; 
      lat: number; 
      lng: number;
    }) => {
      const { error } = await supabase
        .from('deliveries')
        .update({ 
          current_lat: lat, 
          current_lng: lng,
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders', user?.id] });
    },
  });
}
