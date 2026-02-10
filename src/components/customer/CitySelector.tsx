import { useState } from 'react';
import { MapPin, Navigation, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from '@/contexts/LocationContext';

const POPULAR_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
  'Chandigarh', 'Kochi',
];

interface CitySelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CitySelector({ open, onOpenChange }: CitySelectorProps) {
  const { setCity, detectCity, isDetecting } = useLocation();
  const [search, setSearch] = useState('');

  const filtered = POPULAR_CITIES.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (city: string) => {
    setCity(city);
    onOpenChange(false);
  };

  const handleDetect = () => {
    detectCity();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Choose your city</DialogTitle>
        </DialogHeader>

        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-primary"
          onClick={handleDetect}
          disabled={isDetecting}
        >
          <Navigation className="w-4 h-4" />
          {isDetecting ? 'Detecting...' : 'Use my current location'}
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
          {filtered.map((city) => (
            <Button
              key={city}
              variant="ghost"
              className="justify-start gap-2 h-auto py-2.5"
              onClick={() => handleSelect(city)}
            >
              <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm">{city}</span>
            </Button>
          ))}
        </div>

        {search && filtered.length === 0 && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => handleSelect(search)}
          >
            Use "{search}" as my city
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
