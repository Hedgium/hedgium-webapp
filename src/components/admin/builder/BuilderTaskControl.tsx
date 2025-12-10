"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";

type TaskState = {
    is_running: boolean;
    task_id: string | null;
    status?: string | null;
};

const TASK_NAME = "builder.run_strategy_builder";

export default function BuilderTaskControl() {
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
            const builderTask = (data as any[]).find(
                (t) => t.name === TASK_NAME && runningStatuses.includes(t.status)
            );

            setTaskStatus({
                is_running: !!builderTask,
                task_id: builderTask?.task_id ?? null,
                status: builderTask?.status ?? null
            });
        } catch (error) {
            console.error("Error fetching task status:", error);
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
                alert.success(data.message || "Builder task started");
                await fetchTaskStatus();
            } else {
                alert.error(data.message || "Failed to start task");
            }
        } catch (error) {
            console.error("Error starting task:", error);
            alert.error("Failed to start builder task");
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
                // terminate is ignored for thread/solo pools; keep for API compatibility
                body: JSON.stringify({ task_id: activeTaskId, terminate: false })
            });
            const data = await response.json();

            if (response.ok) {
                alert.success(data.message || "Builder task stopped");
                await fetchTaskStatus();
            } else {
                alert.error(data.message || "Failed to stop task");
            }
        } catch (error) {
            console.error("Error stopping task:", error);
            alert.error("Failed to stop builder task");
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
        <div className="bg-base-200 rounded-lg py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold">Entry Task</h2>
                    <div className="flex items-center gap-2">
                        <div className={`badge ${taskStatus.is_running ? "badge-success" : "badge-error"} gap-2`}>
                            <div
                                className={`w-2 h-2 rounded-full ${
                                    taskStatus.is_running ? "bg-green-300 animate-pulse" : "bg-red-300"
                                }`}
                            ></div>
                            {taskStatus.is_running ? "Running" : "Stopped"}
                        </div>
                        {taskStatus.task_id && (
                            <span className="text-xs opacity-60">ID: {taskStatus.task_id.substring(0, 8)}...</span>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
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
