"use client";

import { useState } from "react";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";

/** Must match `TASKS` key in `hedgium_backend/core/api.py` */
const CORE_TASK_KEY = "make-adjustments-active-strategies";

export default function MakeAdjustmentsTaskControl() {
    const [loading, setLoading] = useState(false);
    const alert = useAlert();

    const handleRun = async () => {
        setLoading(true);
        try {
            const response = await authFetch(
                `core/tasks/run/?task_name=${encodeURIComponent(CORE_TASK_KEY)}`,
                { method: "POST" }
            );
            const data = await response.json();

            if (response.ok) {
                const id = (data as { task_id?: string }).task_id;
                alert.success(
                    id
                        ? `Adjustments task queued (ID: ${id})`
                        : "Adjustments task queued"
                );
            } else {
                const err = (data as { error?: string }).error;
                alert.error(err || "Failed to queue task");
            }
        } catch (error) {
            console.error("Error running adjustments task:", error);
            alert.error("Failed to run adjustments task");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-base-100/70 rounded-xl border border-base-300 py-3 px-4 flex-1 min-w-[200px]">
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold">Greeks / adjustments</h2>
                <button
                    type="button"
                    onClick={handleRun}
                    disabled={loading}
                    className="btn btn-primary btn-sm"
                >
                    {loading ? (
                        <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                        "Run now"
                    )}
                </button>
            </div>
            <p className="text-xs text-base-content/55 mt-1">
                Enqueues one pass over ACTIVE builders. 
            </p>
        </div>
    );
}
