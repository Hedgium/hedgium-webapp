"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import { Play, Clock, RefreshCw } from "lucide-react";

interface ScheduledTask {
    name: string;
    task: string;
    schedule: string;
}

export default function ScheduledTasks() {
    const [tasks, setTasks] = useState<ScheduledTask[]>([]);
    const [loading, setLoading] = useState(false);
    const [runningTask, setRunningTask] = useState<string | null>(null);
    const alert = useAlert();

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const response = await authFetch('core/tasks/');
            if (response.ok) {
                const data = await response.json();
                setTasks(data);
            } else {
                console.error('Failed to fetch tasks');
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            alert.error('Failed to load scheduled tasks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleRunTask = async (taskName: string) => {
        if (!confirm(`Are you sure you want to run task "${taskName}" now?`)) return;

        setRunningTask(taskName);
        try {
            const response = await authFetch(`core/tasks/run/?task_name=${encodeURIComponent(taskName)}`, {
                method: 'POST'
            });

            const data = await response.json();

            if (response.ok) {
                alert.success(`Task triggered successfully (ID: ${data.task_id})`);
            } else {
                alert.error(data.error || 'Failed to run task');
            }
        } catch (error) {
            console.error('Error running task:', error);
            alert.error('Failed to trigger task');
        } finally {
            setRunningTask(null);
        }
    };

    return (
        <div className="bg-base-100 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Scheduled Tasks
                </h2>
                <button
                    onClick={fetchTasks}
                    className="btn btn-ghost btn-sm btn-circle"
                    disabled={loading}
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th>Task Name</th>
                            <th>Schedule</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map((task) => (
                            <tr key={task.name} className="hover">
                                <td>
                                    <div className="font-medium">{task.name}</div>
                                    <div className="text-xs opacity-50">{task.task}</div>
                                </td>
                                <td>
                                    <div className="badge badge-ghost gap-1">
                                        <Clock className="w-3 h-3" />
                                        {task.schedule}
                                    </div>
                                </td>
                                <td className="text-right">
                                    <button
                                        onClick={() => handleRunTask(task.name)}
                                        disabled={runningTask === task.name}
                                        className="btn btn-sm btn-primary gap-2"
                                    >
                                        {runningTask === task.name ? (
                                            <span className="loading loading-spinner loading-xs"></span>
                                        ) : (
                                            <Play className="w-3 h-3" />
                                        )}
                                        Run Now
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {tasks.length === 0 && !loading && (
                            <tr>
                                <td colSpan={3} className="text-center text-gray-500 py-4">
                                    No scheduled tasks found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
