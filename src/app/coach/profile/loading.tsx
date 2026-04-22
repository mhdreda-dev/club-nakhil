function SkeletonBlock({ className }: { className: string }) {
  return <div className={`cn-skeleton ${className}`} />;
}

export default function CoachProfileLoading() {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-club-surface p-5">
        <div className="flex items-center gap-4">
          <SkeletonBlock className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-7 w-56" />
            <SkeletonBlock className="h-4 w-40" />
            <SkeletonBlock className="h-4 w-full max-w-xl" />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="rounded-xl border border-white/10 bg-club-surface p-4">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="mt-3 h-8 w-16" />
            <SkeletonBlock className="mt-2 h-3 w-28" />
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {[0, 1].map((item) => (
          <div key={item} className="rounded-2xl border border-white/10 bg-club-surface p-5">
            <SkeletonBlock className="h-6 w-36" />
            <SkeletonBlock className="mt-2 h-4 w-56" />
            <div className="mt-4 space-y-3">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-5/6" />
              <SkeletonBlock className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
