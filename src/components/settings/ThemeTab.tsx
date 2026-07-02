"use client";

import { Sun, Moon, Laptop } from "lucide-react";

interface ThemeTabProps {
  theme: string | undefined;
  setTheme: (theme: string) => void;
}

const ThemeTab: React.FC<ThemeTabProps> = ({ theme, setTheme }) => {
  const themes = [
    { id: "light", label: "Light", icon: <Sun className="h-5 w-5 mr-2" aria-hidden="true" /> },
    { id: "dark", label: "Dark", icon: <Moon className="h-5 w-5 mr-2" aria-hidden="true" /> },
    { id: "system", label: "System", icon: <Laptop className="h-5 w-5 mr-2" aria-hidden="true" /> },
  ];

  return (
    <div className="card bg-base-100 border border-base-300 p-6">
      <h2 className="text-2xl font-bold mb-6">Theme</h2>
      <div className="space-y-4" role="group" aria-label="Theme selection">
        {themes.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            aria-pressed={theme === t.id}
            className={`btn w-full justify-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 ${
              theme === t.id ? "btn-primary" : "btn-ghost"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeTab;