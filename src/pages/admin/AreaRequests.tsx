import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { MERCHANT_TYPES } from '@/lib/merchantTerms';

interface Req { id: string; city: string; category: string; area_label: string | null; latitude: number | null; longitude: number | null; created_at: string }

export default function AdminAreaRequests() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-area-requests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('city_interests').select('*').order('created_at', { ascending: false }).limit(1000);
      if (error) throw error;
      return data as unknown as Req[];
    },
  });

  const grouped = useMemo(() => {
    const m = new Map<string, { city: string; category: string; count: number }>();
    data.forEach(r => {
      const k = `${r.city.toLowerCase()}|${r.category}`;
      const g = m.get(k) || { city: r.city, category: r.category, count: 0 };
      g.count++; m.set(k, g);
    });
    return [...m.values()].sort((a, b) => b.count - a.count);
  }, [data]);

  const catLabel = (c: string) => MERCHANT_TYPES.find(t => t.value === c)?.short || c;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">User Requested Areas</h1>
          <p className="text-muted-foreground">Places where customers asked for Munchii</p>
        </div>
        <Card>
          <CardHeader><CardTitle>Top requested</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {grouped.length === 0 && <p className="text-sm text-muted-foreground">{isLoading ? 'Loading…' : 'No requests yet'}</p>}
            {grouped.map(g => (
              <Badge key={g.city + g.category} variant="secondary" className="text-sm">{g.city} · {catLabel(g.category)} · {g.count}</Badge>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>All requests</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>City</TableHead><TableHead>Area</TableHead><TableHead>Category</TableHead><TableHead>Map</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{r.city}</TableCell>
                    <TableCell className="max-w-xs truncate">{r.area_label || '—'}</TableCell>
                    <TableCell>{catLabel(r.category)}</TableCell>
                    <TableCell>{r.latitude != null ? <a className="text-primary underline" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}>View</a> : '—'}</TableCell>
                    <TableCell>{format(new Date(r.created_at), 'dd MMM yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
