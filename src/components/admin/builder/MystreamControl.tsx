"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";

type StreamStatus = {
    running: boolean;
    persist_enabled: boolean;
    pid: number | null;
    last_heartbeat: string | null;
};

export default function MystreamControl() {
    const [status, setStatus] = useState<StreamStatus>({
        running: false,
        persist_enabled: true,
        pid: null,
        last_heartbeat: null,
    });
    const [toggling, setToggling] = useState(false);
    const alert = useAlert();

    const fetchStatus = async () => {
        try {
            const res = await authFetch("optionchain/stream/status/");
            const data = await res.json();
            setStatus(data);
        } catch {
            // silently ignore — stale values remain
        }
    };

    const handleToggle = async () => {
        setToggling(true);
        const next = !status.persist_enabled;
        try {
            const res = await authFetch(`optionchain/stream/set-active/?enabled=${next}`, {
                method: "POST",
            });
            const data = await res.json();
            if (res.ok) {
                setStatus((s) => ({ ...s, persist_enabled: data.persist_enabled }));
                alert.success(next ? "Mystream processing enabled" : "Mystream processing paused");
            } else {
                alert.error(data.message || "Failed to update mystream flag");
            }
        } catch {
            alert.error("Failed to update mystream flag");
        } finally {
            setToggling(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-base-100/70 rounded-xl border border-base-300 py-3 px-4 flex-1 min-w-[200px]">
            <div className="flex items-center justify-between gap-3">

                <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">Mystream</h2>

                    {/* WebSocket process status */}
                    <div className={`badge ${status.running ? "badge-success" : "badge-warning"} gap-1`}>
                        <div className={`w-2 h-2 rounded-full ${status.running ? "bg-green-300 animate-pulse" : "bg-yellow-300"}`} />
                        {status.running ? "Connected" : "Offline"}
                    </div>
                </div>

                {/* Persist enable/disable toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-base-content/70">
                        {status.persist_enabled ? "Active" : "Paused"}
                    </span>
                    <input
                        type="checkbox"
                        className="toggle toggle-success toggle-sm"
                        checked={status.persist_enabled}
                        disabled={toggling}
                        onChange={handleToggle}
                    />
                </label>

            </div>
        </div>
    );
}
