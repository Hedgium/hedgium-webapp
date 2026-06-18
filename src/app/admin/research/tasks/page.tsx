"use client";

import dynamic from "next/dynamic";

const ResearchTasksContent = dynamic(
  () => import("@/components/research/ResearchTasksContent"),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    ),
  }
);

export default function AdminResearchTasksPage() {
  return <ResearchTasksContent />;
}
