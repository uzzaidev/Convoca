export default function ChampionshipLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Breadcrumb skeleton */}
        <div className="mb-4 h-4 w-56 rounded bg-muted animate-pulse" />

        {/* Championship header skeleton */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            <div className="h-9 w-56 rounded bg-muted animate-pulse" />
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
              <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
            </div>
          </div>
          <div className="h-9 w-28 rounded-lg bg-muted animate-pulse" />
        </div>

        {/* Tabs skeleton */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>

        {/* Rounds / matches skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((round) => (
            <div key={round} className="rounded-xl border bg-card p-4 animate-pulse">
              <div className="h-4 w-20 rounded bg-muted mb-3" />
              <div className="space-y-2">
                {[1, 2].map((match) => (
                  <div key={match} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                    <div className="h-4 w-4 rounded-full bg-muted" />
                    <div className="h-3 w-24 rounded bg-muted" />
                    <div className="h-6 w-12 rounded bg-muted mx-auto" />
                    <div className="h-3 w-24 rounded bg-muted" />
                    <div className="h-4 w-4 rounded-full bg-muted" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
