"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BarChart3, TrendingUp } from "lucide-react";
import { authFetch } from "@/utils/api";
import { Profile } from "@/types/profile";
import ProfileReportsPanel from "@/components/reports/ProfileReportsPanel";

function AdminProfileReportsHeader({
  profile,
  profileId,
}: {
  profile: Profile | null;
  profileId: string;
}) {
  return (
    <div className="mb-2 flex flex-col gap-4 border-b border-base-300/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Link href={`/admin/profiles/${profileId}`} className="btn btn-ghost btn-sm btn-square shrink-0">
          <ArrowLeft className="h-5 w-5" aria-hidden />
          <span className="sr-only">Back to profile</span>
        </Link>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary shrink-0" aria-hidden />
            <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          </div>
          {profile ? (
            <p className="text-sm text-base-content/60">
              {profile.user?.email} · {profile.broker_name} · HID {profile.id}
            </p>
          ) : (
            <p className="text-sm text-base-content/60">Profile #{profileId}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/admin/profiles/${profileId}/live`} className="btn btn-outline btn-sm gap-2">
          <TrendingUp className="h-4 w-4" aria-hidden />
          Live positions
        </Link>
      </div>
    </div>
  );
}

export default function AdminProfileReportsPage() {
  const params = useParams();
  const profileId = params.profileId as string;
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await authFetch(`profiles/${profileId}/`);
      if (res.ok) {
        setProfile(await res.json());
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
    }
  }, [profileId]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return (
    <div className="min-h-screen bg-base-200">
      <ProfileReportsPanel
        scope={{ mode: "admin", profileId }}
        header={<AdminProfileReportsHeader profile={profile} profileId={profileId} />}
      />
    </div>
  );
}
