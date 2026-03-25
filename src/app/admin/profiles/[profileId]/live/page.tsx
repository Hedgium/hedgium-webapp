"use client";

import { useParams } from "next/navigation";
import ProfileLiveTradingPanel from "@/components/admin/profiles/ProfileLiveTradingPanel";

export default function ProfileLivePage() {
  const params = useParams();
  const profileId = params.profileId as string;

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="mx-auto max-w-7xl">
        <ProfileLiveTradingPanel profileId={profileId} variant="page" />
      </div>
    </div>
  );
}
