"use client";

import { useState } from "react";
import ScheduledTasks from "@/components/admin/ScheduledTasks";
import RunningTasks from "@/components/admin/RunningTasks";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"scheduled" | "running">(
    "scheduled"
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="flex flex-col gap-4">
        <div className="tabs tabs-boxed w-fit">
          <button
            className={`tab ${activeTab === "scheduled" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("scheduled")}
          >
            Scheduled Tasks
          </button>
          <button
            className={`tab ${activeTab === "running" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("running")}
          >
            Running Tasks
          </button>
        </div>

        {activeTab === "scheduled" ? <ScheduledTasks /> : <RunningTasks />}
      </div>
    </div>
  );
}