export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Hero Section Skeleton */}
      <div className="bg-gradient-to-br from-navy via-navy-light to-green-dark">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="space-y-4">
            <div className="h-10 w-64 bg-white/20 rounded animate-pulse"></div>
            <div className="h-6 w-96 bg-white/10 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Stats Section Skeleton */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-lg bg-gray-100 border border-gray-200">
                <div className="h-8 w-16 bg-gray-300 rounded animate-pulse mx-auto mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg border p-6">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-20 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
