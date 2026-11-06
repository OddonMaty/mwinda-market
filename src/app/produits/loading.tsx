export default function ProduitsLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Skeleton Header */}
      <div className="h-16 bg-white border-b border-slate-100 animate-pulse" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Skeleton filtres */}
        <div className="flex gap-3 mb-6 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-24 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
          ))}
        </div>

        {/* Grid produits skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
              <div className="aspect-square bg-slate-200" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-5 bg-slate-200 rounded w-1/3 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

