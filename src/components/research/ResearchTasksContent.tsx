"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Activity, Clock, ListTodo } from "lucide-react";
import ResearchSubNav from "./ResearchSubNav";
import ResearchRunningTasks from "./ResearchRunningTasks";
import ScheduledTasksSkeleton from "@/components/skeletons/ScheduledTasksSkeleton";

const ResearchScheduledTasks = dynamic(() => import("./ResearchScheduledTasks"), {
  loading: () => (
    <div className="p-4 md:p-6">
      <ScheduledTasksSkeleton />
    </div>
  ),
});

type TasksTab = "running" | "scheduled";

const viewTabs: {
  id: TasksTab;
  label: string;
  icon: typeof Activity;
}[] = [
  { id: "running", label: "Running", icon: Activity },
  { id: "scheduled", label: "Scheduled", icon: Clock },
];

export default function ResearchTasksContent() {
  const [activeTab, setActiveTab] = useState<TasksTab>("scheduled");

  return (
    <div className="relative min-h-screen">
      <div className="relative mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8 md:py-10">
        <section className="space-y-1">
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-primary shrink-0" aria-hidden />
            <h2 className="text-xl font-semibold tracking-tight text-base-content md:text-2xl">
              Research jobs
            </h2>
          </div>
          <p className="max-w-xl text-sm text-base-content/55">
            Trigger and monitor Celery tasks for the research service.
          </p>
        </section>

        <ResearchSubNav />

        <div
          className="inline-flex w-full flex-col gap-1 rounded-xl border border-base-300/80 bg-base-200/40 p-1 sm:w-auto sm:flex-row"
          role="tablist"
          aria-label="Job views"
        >
          {viewTabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors sm:min-w-[10rem] ${
                  selected
                    ? "bg-base-100 text-base-content shadow-sm ring-1 ring-base-300/60"
                    : "text-base-content/65 cursor-pointer hover:bg-base-100/60 hover:text-base-content"
                }`}
              >
                <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                {tab.label}
              </button>
            );
          })}
        </div>

        <section
          className="overflow-hidden rounded-2xl border border-base-300/80 bg-base-100"
          role="tabpanel"
        >
          {activeTab === "running" ? (
            <ResearchRunningTasks />
          ) : (
            <ResearchScheduledTasks />
          )}
        </section>
      </div>
    </div>
  );
}
