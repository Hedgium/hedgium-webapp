"use client";

import { useEffect, useState } from "react";
import useAlert from "@/hooks/useAlert";
import { authFetch } from "@/utils/api";

type TaskState = {
    is_running: boolean;
    task_id: string | null;
    status?: string | null;
};

type TaskData = {
    name: string;
    task_id: string;
    status: string;
};

const TASK_NAME = "builder.run_strategy_exit";

export default function ExitTaskControl() {
    const [taskStatus, setTaskStatus] = useState<TaskState>({
        is_running: false,
        task_id: null,
        status: null
    });
    const [taskLoading, setTaskLoading] = useState(false);
    const alert = useAlert();

    const fetchTaskStatus = async () => {
        try {
            const response = await authFetch("tasks/running");
            const data = await response.json();

            const runningStatuses = ["PENDING", "STARTED", "RETRY", "RECEIVED"];
            const exitTask = (data as TaskData[]).find(
                (t) => t.name === TASK_NAME && runningStatuses.includes(t.status)
            );

            setTaskStatus({
                is_running: !!exitTask,
                task_id: exitTask?.task_id ?? null,
                status: exitTask?.status ?? null
            });
        } catch (error) {
            console.error("Error fetching exit task status:", error);
        }
    };

    const handleStartTask = async () => {
        setTaskLoading(true);
        try {
            const response = await authFetch("tasks/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ task_name: TASK_NAME })
            });
            const data = await response.json();

            if (response.ok) {
                alert.success(data.message || "Exit task started");
                await fetchTaskStatus();
            } else {
                alert.error(data.message || "Failed to start exit task");
            }
        } catch (error) {
            console.error("Error starting exit task:", error);
            alert.error("Failed to start exit task");
        } finally {
            setTaskLoading(false);
        }
    };

    const handleStopTask = async () => {
        setTaskLoading(true);
        try {
            // Ensure we have the latest task id before stopping
            await fetchTaskStatus();
            const activeTaskId = taskStatus.task_id;

            const response = await authFetch("tasks/stop", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ task_id: activeTaskId, terminate: false })
            });
            const data = await response.json();

            if (response.ok) {
                alert.success(data.message || "Exit task stopped");
                await fetchTaskStatus();
            } else {
                alert.error(data.message || "Failed to stop exit task");
            }
        } catch (error) {
            console.error("Error stopping exit task:", error);
            alert.error("Failed to stop exit task");
        } finally {
            setTaskLoading(false);
        }
    };

    useEffect(() => {
        fetchTaskStatus();

        // Poll task status every 10 seconds
        const interval = setInterval(fetchTaskStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-base-100/70 rounded-xl border border-base-300 py-3 px-4 flex-1 min-w-[200px]">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">Exit Task</h2>
                    <div className={`badge ${taskStatus.is_running ? "badge-success" : "badge-error"} gap-2`}>
                        <div
                            className={`w-2 h-2 rounded-full ${
                                taskStatus.is_running ? "bg-green-300 animate-pulse" : "bg-red-300"
                            }`}
                        ></div>
                        {taskStatus.is_running ? "Running" : "Stopped"}
                    </div>
                    {taskStatus.task_id && (
                        <span className="text-sm text-base-content/60">ID: {taskStatus.task_id.substring(0, 8)}...</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleStartTask}
                        disabled={taskStatus.is_running || taskLoading}
                        className="btn btn-success btn-sm"
                    >
                        {taskLoading ? <span className="loading loading-spinner loading-xs"></span> : "Start"}
                    </button>
                    <button
                        onClick={handleStopTask}
                        disabled={!taskStatus.is_running || taskLoading}
                        className="btn btn-error btn-sm"
                    >
                        {taskLoading ? <span className="loading loading-spinner loading-xs"></span> : "Stop"}
                    </button>
                </div>
            </div>
        </div>
    );
}
