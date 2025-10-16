"use client";

import { useState } from "react";

interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
}

const NotificationsTab: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    email: true,
    sms: false,
    push: true,
  });

  const toggle = (field: keyof NotificationSettings) => {
    setSettings({ ...settings, [field]: !settings[field] });
  };

  return (
    <div className="card bg-base-100 border-base-300 p-6">
      <h2 className="text-2xl font-bold mb-6">Notifications</h2>
      <div className="form-control">
        <label className="label cursor-pointer">
          <span>Email Alerts</span>
          <input
            type="checkbox"
            className="toggle"
            checked={settings.email}
            onChange={() => toggle("email")}
          />
        </label>
        <label className="label cursor-pointer">
          <span>SMS Alerts</span>
          <input
            type="checkbox"
            className="toggle"
            checked={settings.sms}
            onChange={() => toggle("sms")}
          />
        </label>
        <label className="label cursor-pointer">
          <span>Push Notifications</span>
          <input
            type="checkbox"
            className="toggle"
            checked={settings.push}
            onChange={() => toggle("push")}
          />
        </label>
      </div>
      <button className="btn btn-primary mt-6 w-full">Save Preferences</button>
    </div>
  );
};

export default NotificationsTab;
