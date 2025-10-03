"use client";

import { Sun, Moon, Laptop } from "lucide-react";

interface ThemeTabProps {
  theme: string | undefined;
  setTheme: (theme: string) => void;
}

const ThemeTab: React.FC<ThemeTabProps> = ({ theme, setTheme }) => {
  const themes = [
    { id: "light", label: "Light", icon: <Sun className="h-5 w-5 mr-2" /> },
    { id: "dark", label: "Dark", icon: <Moon className="h-5 w-5 mr-2" /> },
    { id: "system", label: "System", icon: <Laptop className="h-5 w-5 mr-2" /> },
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
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeTab;