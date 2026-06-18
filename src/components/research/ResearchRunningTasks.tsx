"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, RefreshCw, StopCircle } from "lucide-react";
import { researchProxyFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import RunningTasksSkeleton from "@/components/skeletons/RunningTasksSkeleton";

interface RunningTask {
  task_id: string;
  name: string;
  status: string;
  queue?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
}

export default function ResearchRunningTasks() {
  const [tasks, setTasks] = useState<RunningTask[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stoppingTaskId, setStoppingTaskId] = useState<string | null>(null);
  const alert = useAlert();
  const alertRef = useRef(alert);
  alertRef.current = alert;

  // Single fetch — no auto-polling. Avoids request bursts from HMR / Strict
  // Mode double-effects. The user clicks Refresh when they want an update.
  const fetchTasks = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const response = await researchProxyFetch("jobs/running/");
      if (response.ok) {
        setTasks(await response.json());
      } else if (!silent) {
        alertRef.current.error("Failed to load running research tasks");
      }
    } catch {
      if (!silent) alertRef.current.error("Failed to load running research tasks");
    } finally {
      setInitialLoading(false);
      if (!silent) setRefreshing(false);
    }
  };

  // Fetch once on mount; ignore Strict-Mode double-run via the abort guard
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    void fetchTasks(true);
    return () => {
      fetchedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStopTask = async (taskId: string) => {
    if (!confirm("Stop this research task?")) return;
    setStoppingTaskId(taskId);
    try {
      const response = await researchProxyFetch("jobs/stop/", {
        method: "POST",
        body: JSON.stringify({ task_id: taskId, terminate: true }),
      });
      const data = await response.json();
      if (response.ok) {
        alert.success(data.message || "Task stopped");
        await fetchTasks();
      } else {
        alert.error(data.error || data.message || "Failed to stop task");
      }
    } catch {
      alert.error("Failed to stop task");
    } finally {
      setStoppingTaskId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-base-300/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <p className="text-sm text-base-content/65">
          Research jobs tracked since last trigger. Click Refresh to update.
        </p>
        <button
          type="button"
          onClick={() => fetchTasks()}
          className="btn btn-ghost btn-sm gap-2 self-start sm:self-auto"
          disabled={refreshing}
        >
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="p-4 md:p-6 md:pt-4">
        {initialLoading ? (
          <RunningTasksSkeleton />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-base-300/60">
            <table className="table table-zebra w-full text-sm">
              <thead>
                <tr className="border-b border-base-300/80 bg-base-200/40 text-xs font-semibold uppercase tracking-wide text-base-content/55">
                  <th className="font-semibold">Task</th>
                  <th className="font-semibold">Status</th>
                  <th className="font-semibold">Queue</th>
                  <th className="font-semibold">Started</th>
                  <th className="text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.task_id}>
                    <td>
                      <div className="font-medium text-base-content">
                        {task.name || task.task_id}
                      </div>
                      <div className="mt-0.5 font-mono text-xs text-base-content/50">
                        {task.task_id.slice(0, 8)}…
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-sm badge-outline font-normal">
                        {task.status}
                      </span>
                    </td>
                    <td className="text-base-content/80">{task.queue || "—"}</td>
                    <td className="whitespace-nowrap text-base-content/80">
                      {task.started_at
                        ? new Date(task.started_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => handleStopTask(task.task_id)}
                        disabled={stoppingTaskId === task.task_id}
                        className="btn btn-error btn-outline btn-sm gap-1.5"
                      >
                        {stoppingTaskId === task.task_id ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <StopCircle className="size-3.5" />
                        )}
                        Stop
                      </button>
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="bg-transparent py-14 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                        <div className="rounded-full bg-base-200/80 p-3 text-base-content/40">
                          <Activity className="size-6" aria-hidden />
                        </div>
                        <p className="text-sm font-medium text-base-content">
                          No running research tasks
                        </p>
                        <p className="text-xs text-base-content/55">
                          Start a job from Scheduled, or check that the research worker is up.
                        </p>
                      </div>
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

