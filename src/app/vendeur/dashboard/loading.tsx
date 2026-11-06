export default function VendeurDashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="h-16 bg-[#0B1B3D] animate-pulse" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-4" />
              <div className="h-8 bg-slate-200 rounded w-3/4" />
            </div>
          ))}
        </div>

        {/* Tableau articles */}
        <div className="bg-white rounded-2xl p-6 animate-pulse">
          <div className="h-5 bg-slate-200 rounded w-1/4 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 items-center border-b border-slate-100 pb-4">
                <div className="w-16 h-16 bg-slate-200 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-1/4" />
                </div>
                <div className="h-8 w-24 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

