export default function ResearchReportSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading research report">
      <div className="space-y-2">
        <div className="h-8 w-64 rounded-md bg-base-300/70" />
        <div className="h-4 w-48 rounded-md bg-base-300/45" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-52 rounded-2xl border border-base-300/50 bg-base-100/80" />
        <div className="h-52 rounded-2xl border border-base-300/50 bg-base-100/80" />
      </div>
      <div className="h-40 rounded-2xl border border-base-300/50 bg-base-100/80" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-48 rounded-2xl border border-base-300/50 bg-base-100/80" />
        <div className="h-48 rounded-2xl border border-base-300/50 bg-base-100/80" />
      </div>
      <div className="h-64 rounded-2xl border border-base-300/50 bg-base-100/80" />
    </div>
  );
}
