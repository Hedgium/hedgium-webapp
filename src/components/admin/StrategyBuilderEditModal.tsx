"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { authFetch } from "@/utils/api";
import useAlert from "@/hooks/useAlert";
import type {
  StrategyBuilder,
  StrategyBuilderCreate,
  StrategyBuilderUpdate,
} from "@/types/builder";

const BuilderForm = dynamic(
  () => import("@/components/admin/builder/BuilderForm"),
  { ssr: false }
);

export type StrategyBuilderEditModalProps = {
  builderId: number;
  onClose: () => void;
  onSaved: () => void;
};

export default function StrategyBuilderEditModal({
  builderId,
  onClose,
  onSaved,
}: StrategyBuilderEditModalProps) {
  const alert = useAlert();
  const alertRef = useRef(alert);
  alertRef.current = alert;
  const [builder, setBuilder] = useState<StrategyBuilder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setBuilder(null);
    void (async () => {
      try {
        const res = await authFetch(`builder/builders/${builderId}/`);
        if (!res.ok) {
          throw new Error(`Failed to load builder (${res.status})`);
        }
        const data = (await res.json()) as StrategyBuilder;
        if (!cancelled) setBuilder(data);
      } catch (e) {
        if (!cancelled) {
          const message =
            e instanceof Error ? e.message : "Failed to load strategy builder";
          setError(message);
          alertRef.current.error("Failed to load strategy builder");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [builderId]);

  const handleSubmit = async (
    data: StrategyBuilderCreate | StrategyBuilderUpdate
  ) => {
    try {
      const response = await authFetch(`builder/builders/${builderId}/`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`Failed to save builder (${response.status})`);
      }
      alert.success("Strategy builder updated successfully");
      onSaved();
      onClose();
    } catch (e) {
      console.error("Error saving builder:", e);
      alert.error("Failed to save strategy builder");
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-3xl rounded-xl">
        <h3 className="font-semibold text-xl mb-4">Edit Strategy Builder</h3>
        {loading && (
          <div className="flex items-center gap-2 py-8 text-sm text-base-content/60">
            <span className="loading loading-spinner loading-sm" />
            Loading builder…
          </div>
        )}
        {error && !loading && (
          <div className="space-y-4">
            <p className="text-sm text-error">{error}</p>
            <div className="flex justify-end">
              <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}
        {builder && !loading && (
          <BuilderForm
            initialData={builder}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        )}
      </div>
    </div>
  );
}
