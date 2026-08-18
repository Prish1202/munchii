import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, CheckCircle, AlertTriangle, Smartphone } from 'lucide-react';
import { APP_SCHEME, PLAY_STORE_URL, isMobileDevice } from '@/lib/appLinks';

export default function EmailVerifiedPage() {
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const search = new URLSearchParams(window.location.search);
    const desc = hash.get('error_description') || search.get('error_description');
    if (desc) setError(desc.replace(/\+/g, ' '));
  }, []);

  const openInApp = () => {
    const start = Date.now();
    window.location.href = `${APP_SCHEME}://login`;
    window.setTimeout(() => {
      if (Date.now() - start < 2200 && !document.hidden) {
        window.location.href = PLAY_STORE_URL;
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm text-center">
          <CardHeader className="pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                {error ? (
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-primary" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl">{error ? 'Link expired' : 'Email Verified!'}</CardTitle>
            <CardDescription className="text-base mt-2">
              {error
                ? 'This confirmation link is invalid or has already expired. Sign up again or request a new link, then open the newest email.'
                : 'Your email has been successfully verified. You can now log in to your Munchii account.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5">
            {isMobile && (
              <Button className="w-full" onClick={openInApp}>
                <Smartphone className="w-4 h-4 mr-2" /> Open in App
              </Button>
            )}
            <Button asChild variant={isMobile ? 'outline' : 'default'} className="w-full">
              <Link to="/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
