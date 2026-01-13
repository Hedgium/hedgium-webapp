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
    <div className="bg-base-100 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Running Tasks
        </h2>
        <button
          onClick={fetchTasks}
          className="btn btn-ghost btn-sm btn-circle"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <RunningTasksSkeleton />
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Queue</th>
                <th>Started</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.task_id} className="hover">
                  <td>
                    <div className="font-medium">{task.name || task.task_id}</div>
                    <div className="text-xs opacity-60">
                      ID: {task.task_id.slice(0, 8)}...
                    </div>
                  </td>
                  <td>
                    <div className="badge badge-outline">{task.status}</div>
                  </td>
                  <td>{task.queue || "-"}</td>
                  <td>
                    {task.started_at
                      ? new Date(task.started_at).toLocaleString()
                      : "-"}
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => handleStopTask(task.task_id)}
                      disabled={stoppingTaskId === task.task_id}
                      className="btn btn-sm btn-error gap-2"
                    >
                      {stoppingTaskId === task.task_id ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <StopCircle className="w-4 h-4" />
                      )}
                      Stop
                    </button>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 py-4">
                    No running tasks.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

