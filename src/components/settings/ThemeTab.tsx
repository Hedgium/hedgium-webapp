"use client";

import { Icon } from "@iconify/react";

interface ThemeTabProps {
  theme: string | undefined;
  setTheme: (theme: string) => void;
}

const ThemeTab: React.FC<ThemeTabProps> = ({ theme, setTheme }) => {
  const themes = [
    { id: "light", label: "Light", icon: "lucide:sun" },
    { id: "dark", label: "Dark", icon: "lucide:moon" },
    { id: "system", label: "System", icon: "lucide:laptop" },
  ];

  return (
    <div className="card bg-base-100 shadow-xl card-hover p-6">
      <h2 className="text-2xl font-bold mb-6">Theme</h2>
      <div className="space-y-4">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`btn w-full justify-start ${
              theme === t.id ? "btn-primary" : "btn-ghost"
            }`}
          >
            <Icon icon={t.icon} className="h-5 w-5 mr-2" />
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeTab;
