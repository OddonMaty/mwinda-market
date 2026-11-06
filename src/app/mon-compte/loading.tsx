export default function MonCompteLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
      <div className="w-20 h-20 rounded-full bg-slate-200 animate-pulse" />
      <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
      <div className="h-3 w-56 bg-slate-200 rounded animate-pulse" />
    </div>
  );
}

