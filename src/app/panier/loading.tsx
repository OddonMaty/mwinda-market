export default function PanierLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 bg-white border-b border-slate-100 animate-pulse" />
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 flex gap-4 animate-pulse">
              <div className="w-24 h-24 bg-slate-200 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-5 bg-slate-200 rounded w-1/4 mt-2" />
              </div>
            </div>
          ))}
        </div>
        {/* Summary */}
        <div className="bg-white rounded-2xl p-6 h-64 animate-pulse">
          <div className="h-5 bg-slate-200 rounded w-1/2 mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-slate-200 rounded" />
            ))}
          </div>
          <div className="h-12 bg-slate-200 rounded-xl mt-8" />
        </div>
      </div>
    </div>
  );
}

