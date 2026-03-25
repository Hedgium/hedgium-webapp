"use client";

import { useState } from "react";
import { Activity, Clock, ListTodo } from "lucide-react";
import ScheduledTasks from "@/components/admin/ScheduledTasks";
import RunningTasks from "@/components/admin/RunningTasks";

type TasksTab = "running" | "scheduled";

const tabs: {
  id: TasksTab;
  label: string;
  description: string;
  icon: typeof Activity;
}[] = [
  {
    id: "running",
    label: "Running",
    description: "Workers and jobs in progress right now.",
    icon: Activity,
  },
  {
    id: "scheduled",
    label: "Scheduled",
    description: "Registered beat schedules you can trigger manually.",
    icon: Clock,
  },
];

export default function AdminTasksPage() {
  const [activeTab, setActiveTab] = useState<TasksTab>("running");
  const active = tabs.find((t) => t.id === activeTab)!;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="shrink-0 rounded-xl bg-primary/10 p-2.5">
              <ListTodo className="size-6 text-primary" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-base-content">
                Tasks
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-base-content/70">
                Monitor async work and scheduled jobs. Stop runaway tasks or run a beat entry
                on demand.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div
        className="mb-5 inline-flex w-full flex-col gap-1 rounded-xl border border-base-300/80 bg-base-200/40 p-1 sm:w-auto sm:flex-row"
        role="tablist"
        aria-label="Task views"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              id={`tasks-tab-${tab.id}`}
              aria-controls={`tasks-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors sm:min-w-[11rem] ${
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
        id={`tasks-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tasks-tab-${activeTab}`}
        className="overflow-hidden rounded-2xl border border-base-300/80 bg-base-100"
      >
        {activeTab === "running" ? <RunningTasks /> : <ScheduledTasks />}
      </section>
    </div>
  );
}
