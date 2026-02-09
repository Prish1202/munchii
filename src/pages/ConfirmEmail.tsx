import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, MailCheck } from 'lucide-react';

export default function ConfirmEmailPage() {
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
                <MailCheck className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription className="text-base mt-2">
              We've sent a confirmation link to your email address. Please click the link to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or try signing up again.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
