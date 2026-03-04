import { useState } from 'react';
import { Rocket, Bell, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CitySelector } from '@/components/customer/CitySelector';
import { useLocation } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export function ComingSoon() {
  const { city } = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [cityOpen, setCityOpen] = useState(false);
  const [notifying, setNotifying] = useState(false);

  const handleNotify = async () => {
    if (!user || !city) return;
    setNotifying(true);
    try {
      const { error } = await supabase.from('city_interests').insert({
        user_id: user.id,
        city,
      } as any);

      if (error && error.code === '23505') {
        toast({ title: "You're already on the list!", description: `We'll notify you when we launch in ${city}.` });
      } else if (error) {
        throw error;
      } else {
        toast({ title: "You're on the list! 🎉", description: `We'll notify you when we launch in ${city}.` });
      }
    } catch {
      toast({ title: 'Something went wrong', variant: 'destructive' });
    } finally {
      setNotifying(false);
    }
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="w-20 h-20 rounded-3xl gradient-social flex items-center justify-center mb-6 shadow-lg animate-float">
        <Rocket className="w-10 h-10 text-primary-foreground" />
      </div>

      <h1 className="font-display font-bold text-2xl text-foreground">
        We're coming to {city} soon!
      </h1>
      <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
        We are working hard to expand our services to your location.
        <br />
        Stay tuned ❤️
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full">
        <Button
          className="flex-1 gap-2 gradient-primary border-0 rounded-xl font-semibold"
          onClick={handleNotify}
          disabled={notifying}
        >
          <Bell className="w-4 h-4" />
          {notifying ? 'Saving...' : 'Notify me'}
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2 rounded-xl font-semibold"
          onClick={() => setCityOpen(true)}
        >
          <MapPin className="w-4 h-4" />
          Change city
        </Button>
      </div>

      <CitySelector open={cityOpen} onOpenChange={setCityOpen} />
    </motion.div>
  );
}
