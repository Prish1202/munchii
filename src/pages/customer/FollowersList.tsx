import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useFollowersList } from '@/hooks/useFollowers';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft } from 'lucide-react';

export default function FollowersList() {
  const { type } = useParams<{ type: 'followers' | 'following' }>();
  const { user } = useAuth();
  const { data: list, isLoading } = useFollowersList(user?.id || '', type || 'followers');

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto pb-28 md:pb-6 space-y-4">
        <Link to="/customer/profile" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to profile
        </Link>
        <h1 className="font-display font-bold text-2xl capitalize">{type}</h1>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !list || list.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No {type} yet.</p>
        ) : (
          <div className="space-y-2">
            {list.map((p: any) => (
              <Link key={p.id} to={`/customer/user/${p.id}`} className="flex items-center gap-3 bg-card rounded-xl border border-border p-3 hover:border-primary/30 transition-colors">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {p.name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  {p.username && <p className="text-xs text-muted-foreground">@{p.username}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
