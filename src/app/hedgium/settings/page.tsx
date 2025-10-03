"use client";

import { useState } from "react";
import { User, Shield, Palette, Bell, CreditCard, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import PasswordTab from "@/components/settings/PasswordTab";
import ProfileTab from "@/components/settings/ProfileTab";
import NotificationsTab from "@/components/settings/NotificationsTab";
import SubscriptionTab from "@/components/settings/SubscriptionTab";
import ThemeTab from "@/components/settings/ThemeTab";

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<string>("profile");

  const tabs = [
    { id: "profile", label: "Profile", icon: <User className="h-5 w-5" /> },
    { id: "password", label: "Password", icon: <Shield className="h-5 w-5" /> },
    { id: "theme", label: "Theme", icon: <Palette className="h-5 w-5" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="h-5 w-5" /> },
    { id: "subscription", label: "Subscription", icon: <CreditCard className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen hero-pattern flex flex-col px-4 py-8">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="btn btn-ghost btn-circle mr-2"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold text-base-content">Settings</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="card bg-base-100 shadow-xl card-hover p-4 sticky top-24">
              <ul className="menu menu-vertical space-y-2 w-full">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      className={activeTab === tab.id ? "active" : ""}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "password" && <PasswordTab />}
            {activeTab === "theme" && <ThemeTab theme={theme} setTheme={setTheme} />}
            {activeTab === "notifications" && <NotificationsTab />}
            {activeTab === "subscription" && <SubscriptionTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;