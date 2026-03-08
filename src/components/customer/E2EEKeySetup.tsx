import { useEffect, useState } from 'react';
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
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface E2EEKeySetupProps {
  children: React.ReactNode;
}

/**
 * Wraps chat pages. Ensures the user has an account-level E2EE keypair.
 * - Keeps one keypair per account (restored across devices)
 * - Avoids silent key mismatches that cause "Cannot decrypt"
 */
export function E2EEKeySetup({ children }: E2EEKeySetupProps) {
  const { user } = useAuth();
  const { data: existingPublicKey, isLoading: loadingKey, upsertKey } = usePublicKey();
  const [status, setStatus] = useState<'checking' | 'ready' | 'generating' | 'restoring' | 'missing_private'>('checking');

  useEffect(() => {
    async function check() {
      if (loadingKey || !user) return;

      const hasLocal = await hasPrivateKey(user.id);

      // Existing account key + local key: validate key consistency
      if (existingPublicKey && hasLocal) {
        const isMatch = await isLocalPrivateKeyMatchingPublicKey(user.id, existingPublicKey);

        if (!isMatch) {
          setStatus('restoring');
          const restored = await restorePrivateKeyFromAccount(user.id);

          if (!restored) {
            // No cloud backup yet; promote this device key as account source of truth
            const localPublicKey = await exportPublicKeyFromPrivateKey(user.id);
            if (localPublicKey) {
              await upsertKey.mutateAsync(localPublicKey);
            }
          }
        }

        await backupPrivateKeyToAccount(user.id);
        setStatus('ready');
        return;
      }

      // Public key exists but local key missing: restore from account backup
      if (existingPublicKey && !hasLocal) {
        setStatus('restoring');
        const restored = await restorePrivateKeyFromAccount(user.id);

        if (restored) {
          setStatus('ready');
          return;
        }

        setStatus('missing_private');
        return;
      }

      // No key pair exists for account yet: generate once and store both public and backup
      setStatus('generating');
      try {
        const pubKey = await generateKeyPair(user.id);
        await upsertKey.mutateAsync(pubKey);
        await backupPrivateKeyToAccount(user.id);
        setStatus('ready');
      } catch (err) {
        console.error('Key generation failed:', err);
      }
    }

    check();
  }, [existingPublicKey, loadingKey, upsertKey, user]);

  if (status === 'checking' || status === 'generating' || status === 'restoring') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {status === 'generating'
            ? 'Setting up end-to-end encryption...'
            : status === 'restoring'
              ? 'Restoring your encryption key...'
              : 'Checking encryption keys...'}
        </p>
      </div>
    );
  }

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

  return <>{children}</>;
}

