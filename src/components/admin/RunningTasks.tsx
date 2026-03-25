"use client";

import { useEffect, useState } from "react";
import { Activity, RefreshCw, StopCircle } from "lucide-react";
import { authFetch } from "@/utils/api";
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

export default function RunningTasks() {
  const [tasks, setTasks] = useState<RunningTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [stoppingTaskId, setStoppingTaskId] = useState<string | null>(null);
  const alert = useAlert();

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await authFetch("tasks/running");
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        alert.error("Failed to load running tasks");
      }
    } catch (error) {
      console.error("Error fetching running tasks:", error);
      alert.error("Failed to load running tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStopTask = async (taskId: string) => {
    if (!confirm("Stop this task?")) return;
    setStoppingTaskId(taskId);
    try {
      const response = await authFetch("tasks/stop/", {
        method: "POST",
        body: JSON.stringify({ task_id: taskId, terminate: true }),
      });
      const data = await response.json();

      if (response.ok) {
        alert.success(data.message || "Task stopped");
        await fetchTasks();
      } else {
        alert.error(data.message || "Failed to stop task");
      }
    } catch (error) {
      console.error("Error stopping task:", error);
      alert.error("Failed to stop task");
    } finally {
      setStoppingTaskId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-base-300/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <p className="text-sm text-base-content/65">
          Live tasks from the worker. Refresh to update the list.
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
                      <div className="font-medium text-base-content">{task.name || task.task_id}</div>
                      <div className="mt-0.5 font-mono text-xs text-base-content/50">
                        {task.task_id.slice(0, 8)}…
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-sm badge-outline font-normal">{task.status}</span>
                    </td>
                    <td className="text-base-content/80">{task.queue || "—"}</td>
                    <td className="whitespace-nowrap text-base-content/80">
                      {task.started_at ? new Date(task.started_at).toLocaleString() : "—"}
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
                {tasks.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="bg-transparent py-14 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                        <div className="rounded-full bg-base-200/80 p-3 text-base-content/40">
                          <Activity className="size-6" aria-hidden />
                        </div>
                        <p className="text-sm font-medium text-base-content">No running tasks</p>
                        <p className="text-xs text-base-content/55">
                          When workers pick up jobs, they will show up here.
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
