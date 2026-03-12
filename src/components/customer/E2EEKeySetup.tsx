import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePublicKey } from '@/hooks/useChat';
import {
  backupPrivateKeyToAccount,
  exportPublicKeyFromPrivateKey,
  generateKeyPair,
  hasPrivateKey,
  isLocalPrivateKeyMatchingPublicKey,
  restorePrivateKeyFromAccount,
} from '@/lib/e2ee';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface E2EEKeySetupProps {
  children: React.ReactNode;
}

/**
 * Wraps chat pages. Ensures the user has an account-level E2EE keypair.
 * Renders children immediately — only blocks on missing_private (needs user action).
 */
export function E2EEKeySetup({ children }: E2EEKeySetupProps) {
  const { user } = useAuth();
  const { data: existingPublicKey, isLoading: loadingKey, upsertKey } = usePublicKey();
  const [status, setStatus] = useState<'checking' | 'ready' | 'generating' | 'restoring' | 'missing_private'>('checking');
  const upsertKeyRef = useRef(upsertKey);
  upsertKeyRef.current = upsertKey;
  const ranRef = useRef(false);

  useEffect(() => {
    if (loadingKey || !user) return;
    if (ranRef.current) return;
    ranRef.current = true;

    async function check() {
      const hasLocal = await hasPrivateKey(user!.id);

      if (existingPublicKey && hasLocal) {
        const isMatch = await isLocalPrivateKeyMatchingPublicKey(user!.id, existingPublicKey);
        if (!isMatch) {
          setStatus('restoring');
          const restored = await restorePrivateKeyFromAccount(user!.id);
          if (!restored) {
            const localPublicKey = await exportPublicKeyFromPrivateKey(user!.id);
            if (localPublicKey) {
              await upsertKeyRef.current.mutateAsync(localPublicKey);
            }
          }
        }
        await backupPrivateKeyToAccount(user!.id);
        setStatus('ready');
        return;
      }

      if (existingPublicKey && !hasLocal) {
        setStatus('restoring');
        const restored = await restorePrivateKeyFromAccount(user!.id);
        if (restored) {
          setStatus('ready');
          return;
        }
        setStatus('missing_private');
        return;
      }

      setStatus('generating');
      try {
        const pubKey = await generateKeyPair(user!.id);
        await upsertKeyRef.current.mutateAsync(pubKey);
        await backupPrivateKeyToAccount(user!.id);
        setStatus('ready');
      } catch (err) {
        console.error('Key generation failed:', err);
      }
    }

    check();
  }, [existingPublicKey, loadingKey, user]);

  // Only block for missing_private which requires user action
  if (status === 'missing_private') {
    const handleRegenerate = async () => {
      if (!user) return;
      setStatus('generating');
      try {
        const pubKey = await generateKeyPair(user.id);
        await upsertKey.mutateAsync(pubKey);
        await backupPrivateKeyToAccount(user.id);
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
          We couldn&apos;t recover your account encryption key on this device.
        </p>
        <p className="text-xs text-muted-foreground">
          Generating a new key will let you continue chatting, but older encrypted messages may not be readable.
        </p>
        <Button onClick={handleRegenerate}>Generate New Keys</Button>
      </div>
    );
  }

  // Render children immediately for checking/generating/restoring — no loading screen
  return <>{children}</>;
}
