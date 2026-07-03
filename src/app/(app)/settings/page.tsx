"use client";

import { useId, useState } from "react";
import { User, Shield, Palette, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import PasswordTab from "@/components/settings/PasswordTab";
import ProfileTab from "@/components/settings/ProfileTab";
import ThemeTab from "@/components/settings/ThemeTab";

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<string>("profile");
  const tabPanelId = useId();

  const tabs = [
    { id: "profile", label: "Profile", icon: <User className="h-5 w-5" aria-hidden="true" /> },
    { id: "password", label: "Password", icon: <Shield className="h-5 w-5" aria-hidden="true" /> },
    { id: "theme", label: "Theme", icon: <Palette className="h-5 w-5" aria-hidden="true" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col px-4 md:px-8 py-8">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="btn btn-ghost btn-circle mr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <h1 className="text-3xl font-bold text-base-content">Settings</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="card bg-base-100 border border-base-300 card-hover sticky top-24">
              <ul className="menu menu-vertical space-y-2 w-full" role="tablist" aria-label="Settings sections">
                {tabs.map((tab) => (
                  <li key={tab.id} role="presentation">
                    <button
                      type="button"
                      id={`${tabPanelId}-tab-${tab.id}`}
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      aria-controls={`${tabPanelId}-panel`}
                      tabIndex={activeTab === tab.id ? 0 : -1}
                      className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeTab === tab.id ? "text-primary" : ""}`}
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
          <div
            className="lg:w-3/4"
            id={`${tabPanelId}-panel`}
            role="tabpanel"
            aria-labelledby={`${tabPanelId}-tab-${activeTab}`}
          >
            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "password" && <PasswordTab />}
            {activeTab === "theme" && <ThemeTab theme={theme} setTheme={setTheme} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;