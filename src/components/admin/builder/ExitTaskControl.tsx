"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";

export default function ExitTaskControl() {
    const [taskStatus, setTaskStatus] = useState<{ is_running: boolean; task_id: string | null }>({
        is_running: false,
        task_id: null
    });
    const [taskLoading, setTaskLoading] = useState(false);
    const alert = useAlert();

    const fetchTaskStatus = async () => {
        try {
            const response = await authFetch('builder/exit-task/status/');
            const data = await response.json();
            setTaskStatus(data);
        } catch (error) {
            console.error('Error fetching exit task status:', error);
        }
    };

    const handleStartTask = async () => {
        setTaskLoading(true);
        try {
            const response = await authFetch('builder/exit-task/start/', { method: 'POST' });
            const data = await response.json();

            if (data.status === 'started' || data.status === 'already_running') {
                alert.success(data.message || 'Exit task started');
                await fetchTaskStatus();
            } else {
                alert.error(data.message || 'Failed to start exit task');
            }
        } catch (error) {
            console.error('Error starting exit task:', error);
            alert.error('Failed to start exit task');
        } finally {
            setTaskLoading(false);
        }
    };

    const handleStopTask = async () => {
        setTaskLoading(true);
        try {
            const response = await authFetch('builder/exit-task/stop/', { method: 'POST' });
            const data = await response.json();

            if (data.status === 'stopping' || data.status === 'not_running') {
                alert.success(data.message || 'Exit task stopped');
                await fetchTaskStatus();
            } else {
                alert.error(data.message || 'Failed to stop exit task');
            }
        } catch (error) {
            console.error('Error stopping exit task:', error);
            alert.error('Failed to stop exit task');
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
        <div className="bg-base-200 rounded-lg p-4 ">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold">Exit Task</h2>
                    <div className="flex items-center gap-2">
                        <div className={`badge ${taskStatus.is_running ? 'badge-success' : 'badge-error'} gap-2`}>
                            <div className={`w-2 h-2 rounded-full ${taskStatus.is_running ? 'bg-green-300 animate-pulse' : 'bg-red-300'}`}></div>
                            {taskStatus.is_running ? 'Running' : 'Stopped'}
                        </div>
                        {taskStatus.task_id && (
                            <span className="text-xs opacity-60">
                                ID: {taskStatus.task_id.substring(0, 8)}...
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleStartTask}
                        disabled={taskStatus.is_running || taskLoading}
                        className="btn btn-success btn-sm"
                    >
                        {taskLoading ? <span className="loading loading-spinner loading-xs"></span> : 'Start'}
                    </button>
                    <button
                        onClick={handleStopTask}
                        disabled={!taskStatus.is_running || taskLoading}
                        className="btn btn-error btn-sm"
                    >
                        {taskLoading ? <span className="loading loading-spinner loading-xs"></span> : 'Stop'}
                    </button>
                </div>
            </div>
        </div>
    );
}
