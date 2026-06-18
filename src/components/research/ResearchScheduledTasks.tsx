"use client";

import { useEffect, useState } from "react";
import { researchProxyFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import { Play, Clock, RefreshCw } from "lucide-react";
import ScheduledTasksSkeleton from "@/components/skeletons/ScheduledTasksSkeleton";

interface ScheduledTask {
  name: string;
  task: string;
  schedule: string;
}

export default function ResearchScheduledTasks() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningTask, setRunningTask] = useState<string | null>(null);
  const alert = useAlert();

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await researchProxyFetch("jobs/");
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        alert.error("Failed to load research scheduled tasks");
      }
    } catch (error) {
      console.error("Error fetching research tasks:", error);
      alert.error("Failed to load research scheduled tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleRunTask = async (taskName: string) => {
    if (!confirm(`Run research task "${taskName}" now?`)) return;

    setRunningTask(taskName);
    try {
      const response = await researchProxyFetch(
        "jobs/run/",
        { method: "POST" },
        { task_name: taskName }
      );

      const data = await response.json();

      if (response.ok) {
        alert.success(`Research task triggered (ID: ${data.task_id})`);
      } else {
        alert.error(data.error || "Failed to run task");
      }
    } catch (error) {
      console.error("Error running research task:", error);
      alert.error("Failed to trigger research task");
    } finally {
      setRunningTask(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-base-300/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <p className="text-sm text-base-content/65">
          Celery beat schedules and on-demand ingestion, features, ML, and agent jobs.
        </p>
        <button
          type="button"
          onClick={fetchTasks}
          className="btn btn-ghost btn-sm gap-2 self-start sm:self-auto"
          disabled={loading}
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="p-4 md:p-6 md:pt-4">
        {loading ? (
          <ScheduledTasksSkeleton />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-base-300/60">
            <table className="table table-zebra w-full text-sm">
              <thead>
                <tr className="border-b border-base-300/80 bg-base-200/40 text-xs font-semibold uppercase tracking-wide text-base-content/55">
                  <th className="font-semibold">Task name</th>
                  <th className="font-semibold">Schedule</th>
                  <th className="text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.name}>
                    <td>
                      <div className="font-medium text-base-content">{task.name}</div>
                      <div className="mt-0.5 font-mono text-xs text-base-content/50">
                        {task.task}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-ghost badge-sm gap-1 font-normal">
                        <Clock className="size-3" />
                        {task.schedule}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => handleRunTask(task.name)}
                        disabled={runningTask === task.name}
                        className="btn btn-primary btn-sm gap-1.5"
                      >
                        {runningTask === task.name ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <Play className="size-3.5" />
                        )}
                        Run now
                      </button>
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && !loading && (
                  <tr>
                    <td colSpan={3} className="bg-transparent py-14 text-center">
                      <p className="text-sm text-base-content/55">
                        No research tasks configured.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
