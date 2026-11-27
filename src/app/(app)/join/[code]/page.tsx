"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { acceptTraderInvite } from "@/services/trader";
import useAlert from "@/hooks/useAlert";
import { useAuthStore } from "@/store/authStore";

export default function JoinTraderPage() {
  const params = useParams();
  const router = useRouter();
  const alert = useAlert();
  const user = useAuthStore((s) => s.user);
  const code = String(params.code || "").toUpperCase();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{
    trader_username: string;
    status: string;
  } | null>(null);

  const handleAccept = async () => {
    if (!user) {
      router.push(`/?next=${encodeURIComponent(`/join/${code}`)}`);
      return;
    }
    setBusy(true);
    try {
      const result = await acceptTraderInvite(code);
      setDone({
        trader_username: result.trader_username,
        status: result.status,
      });
      alert.success("Joined trader desk");
    } catch (e) {
      alert.error(e instanceof Error ? e.message : "Failed to accept invite");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center p-6">
      <div className="card w-full border border-base-300 bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <h1 className="card-title text-2xl">Join trader desk</h1>
          <p className="text-base-content/70">
            Invite code <span className="font-mono font-semibold">{code || "—"}</span>
          </p>
          {done ? (
            <div className="mt-4 space-y-2">
              <p className="text-success">
                You joined {done.trader_username || "the trader"} ({done.status}).
              </p>
              <p className="text-sm text-base-content/60">
                The trader still needs to attach your trading profile(s).
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm mt-2"
                onClick={() => router.push("/home")}
              >
                Go to home
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary mt-4"
              disabled={busy || !code}
              onClick={() => void handleAccept()}
            >
              {busy ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Accept invite"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
