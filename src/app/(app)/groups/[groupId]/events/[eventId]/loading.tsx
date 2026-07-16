export default function EventLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Breadcrumb skeleton */}
        <div className="mb-4 h-4 w-48 rounded bg-muted animate-pulse" />

        {/* Event header skeleton */}
        <div className="mb-6 rounded-xl border bg-card p-5 animate-pulse">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-8 w-48 rounded bg-muted" />
            </div>
            <div className="h-8 w-24 rounded-lg bg-muted" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-muted" />
            ))}
          </div>
        </div>

        {/* RSVP buttons skeleton */}
        <div className="mb-6 flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 flex-1 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>

        {/* Players list skeleton */}
        <div className="rounded-xl border bg-card p-4 animate-pulse">
          <div className="h-5 w-40 rounded bg-muted mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-muted" />
                <div className="h-3 w-32 rounded bg-muted" />
                <div className="h-5 w-14 rounded-full bg-muted ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
