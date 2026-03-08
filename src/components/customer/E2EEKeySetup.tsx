import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePublicKey } from '@/hooks/useChat';
import { generateKeyPair, hasPrivateKey } from '@/lib/e2ee';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface E2EEKeySetupProps {
  children: React.ReactNode;
}

/**
 * Wraps chat pages. Ensures the user has an E2EE keypair before proceeding.
 * If no public key in DB or no private key on device, generates a new pair.
 */
export function E2EEKeySetup({ children }: E2EEKeySetupProps) {
  const { user } = useAuth();
  const { data: existingPublicKey, isLoading: loadingKey, upsertKey } = usePublicKey();
  const [status, setStatus] = useState<'checking' | 'ready' | 'generating' | 'missing_private'>('checking');

  useEffect(() => {
    async function check() {
      if (loadingKey || !user) return;

      const hasLocal = await hasPrivateKey(user.id);

      if (existingPublicKey && hasLocal) {
        setStatus('ready');
      } else if (existingPublicKey && !hasLocal) {
        // Public key exists but private key is missing on this device
        setStatus('missing_private');
      } else {
        // No key pair exists, generate one
        setStatus('generating');
        try {
          const pubKey = await generateKeyPair(user.id);
          await upsertKey.mutateAsync(pubKey);
          setStatus('ready');
        } catch (err) {
          console.error('Key generation failed:', err);
        }
      }
    }
    check();
  }, [existingPublicKey, loadingKey, user]);

  if (status === 'checking' || status === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {status === 'generating' ? 'Setting up end-to-end encryption...' : 'Checking encryption keys...'}
        </p>
      </div>
    );
  }

  if (status === 'missing_private') {
    const handleRegenerate = async () => {
      setStatus('generating');
      try {
        const pubKey = await generateKeyPair();
        await upsertKey.mutateAsync(pubKey);
        setStatus('ready');
      } catch (err) {
        console.error('Key regeneration failed:', err);
      }
    };

    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 max-w-sm mx-auto text-center">
        <ShieldCheck className="w-12 h-12 text-muted-foreground/50" />
        <h2 className="font-display font-semibold text-lg">Encryption Key Missing</h2>
        <p className="text-sm text-muted-foreground">
          Your private key is not available on this device. This can happen if you switched devices or cleared browser data.
        </p>
        <p className="text-xs text-muted-foreground">
          Generating new keys will mean you cannot read previous messages. New messages will work fine.
        </p>
        <Button onClick={handleRegenerate}>Generate New Keys</Button>
      </div>
    );
  }

  return <>{children}</>;
}
