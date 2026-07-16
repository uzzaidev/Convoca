export default function GroupLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        {/* Breadcrumb skeleton */}
        <div className="mb-4 h-4 w-32 rounded bg-muted animate-pulse" />

        {/* Header skeleton */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="h-3 w-24 rounded bg-muted animate-pulse" />
          <div className="h-10 w-64 rounded bg-muted animate-pulse" />
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
            <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
          </div>
        </div>

        {/* Next event hero skeleton */}
        <div className="mb-6 rounded-xl border bg-card p-5 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="space-y-1.5">
              <div className="h-4 w-40 rounded bg-muted" />
              <div className="h-3 w-24 rounded bg-muted" />
            </div>
          </div>
          <div className="h-9 w-full rounded-lg bg-muted" />
        </div>

        {/* Stats grid skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-4 animate-pulse">
              <div className="h-4 w-28 rounded bg-muted mb-3" />
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-muted" />
                    <div className="h-3 w-24 rounded bg-muted" />
                    <div className="h-3 w-8 rounded bg-muted ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Rankings skeleton */}
        <div className="rounded-xl border bg-card p-4 animate-pulse">
          <div className="h-5 w-32 rounded bg-muted mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-4 rounded bg-muted" />
                <div className="h-6 w-6 rounded-full bg-muted" />
                <div className="h-3 w-32 rounded bg-muted" />
                <div className="h-3 w-10 rounded bg-muted ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
