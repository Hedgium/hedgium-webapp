"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import ProfileLiveTradingPanel from "@/components/admin/profiles/ProfileLiveTradingPanel";

export interface ProfileLiveModalProps {
  profileId: number | string;
  onClose: () => void;
}

export default function ProfileLiveModal({ profileId, onClose }: ProfileLiveModalProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[1000] flex min-h-0 flex-col bg-base-100 shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-live-modal-title"
    >
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-base-300 px-4 py-3">
        <div className="min-w-0">
          <h3 id="profile-live-modal-title" className="truncate text-lg font-semibold">
            Live positions & orders
          </h3>
          <p className="truncate text-sm text-base-content/70">Profile #{profileId}</p>
        </div>
        <button
          type="button"
          className="btn btn-square btn-ghost btn-sm"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <ProfileLiveTradingPanel profileId={String(profileId)} variant="embedded" />
      </div>
    </div>
  );
}
