"use client";

import Link from "next/link";
import { Sparkles, Crown } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function CurrentSubscription() {
  const { user } = useAuthStore();

  const planName = user?.active_subscription?.plan?.name || "No Active Plan";
  const isLegends = planName === "LEGENDS";

  return (
    <div className="mb-4 p-4 border-b border-b-base-300">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-base-content/70 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary/70" />
          Current Plan
        </span>
        {isLegends && (
          <Crown className="w-5 h-5 text-yellow-500" title="Top Tier" />
        )}
      </div>

      <div className="flex items-center justify-between w-full">
        <span
          className={`font-semibold text-lg ${
            isLegends ? "text-yellow-500" : "text-primary"
          }`}
        >
          {planName}
        </span>

        {!isLegends && (
          <Link
            href="/hedgium/upgrade"
            className="btn btn-sm btn-primary btn-outline"
          >
            Upgrade
          </Link>
        )}
      </div>
{/* 
      {isLegends && (
        <p className="text-xs mt-2 text-base-content/60 italic">
          You’re on our premium <span className="text-yellow-500 font-medium">Legends</span> plan.
        </p>
      )} */}
    </div>
  );
}
