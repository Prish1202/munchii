import logoAsset from '@/assets/munchii-blue-logo.png.asset.json';

/** Clean blue full-screen loader shown while the saved session is being checked. */
export function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 gradient-primary" role="status" aria-label="Loading">
      <img src={logoAsset.url} alt="Munchii" className="h-20 w-20 rounded-2xl object-cover shadow-soft" />
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-foreground/30 border-t-primary-foreground" />
    </div>
  );
}
