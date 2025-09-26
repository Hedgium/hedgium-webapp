"use client";

import { useAuthStore } from "@/store/authStore"; // adjust path if different

const ProfileTab: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return (
      <div className="card bg-base-100 shadow-xl card-hover p-6">
        <h2 className="text-2xl font-bold mb-6">Profile</h2>
        <p className="text-base-content/70">No user data available.</p>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl card-hover p-6">
      <h2 className="text-2xl font-bold mb-6">Profile</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-base-content/70">Name</p>
          <p className="font-medium">{user.first_name} {user.last_name}</p>
        </div>
        <div>
          <p className="text-sm text-base-content/70">Email</p>
          <p className="font-medium">{user.email || "—"}</p>
        </div>
        <div>
          <p className="text-sm text-base-content/70">Phone</p>
          <p className="font-medium">{user.mobile || "—"}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
