"use client";

import { useId, useState, useEffect } from "react";
import { authFetch } from "@/utils/api";
import { Eye, EyeOff } from "lucide-react";
import useAlert from "@/hooks/useAlert";
import { useAuthStore } from "@/store/authStore";



interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface Errors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const PasswordInput: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPassword: boolean;
  toggleShowPassword: () => void;
  placeholder: string;
  error?: string;
  onEnter?: () => void;
}> = ({
  label,
  name,
  value,
  onChange,
  showPassword,
  toggleShowPassword,
  placeholder,
  error,
  onEnter,
}) => {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  return (
    <div className="form-control">
      <label className="label" htmlFor={inputId}>
        <span className="label-text text-base-content">{label}</span>
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          required
          aria-required="true"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          autoComplete={name === "currentPassword" ? "current-password" : "new-password"}
          onKeyDown={(e) => { if (e.key === "Enter") onEnter?.(); }}
          className={`input input-bordered w-full pr-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            error ? "input-error" : ""
          }`}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          onClick={toggleShowPassword}
          aria-label={showPassword ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {showPassword ? (
            <EyeOff className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Eye className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>
      {error && <p id={errorId} role="alert" className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
};


interface BrokerState {
  loading: boolean;
  id: number | null;
  loggedIn: boolean;
  name: string | null;
  userId?: string | null;
  margin?: number | null;
}


const PasswordTab: React.FC = () => {

    

   const [broker, setBroker] = useState<BrokerState>({
      loading: true,
      id: null,
      loggedIn: false,
      name: null,
      userId: null,
      margin: null,
    });
    const [error, setError] = useState<string | null>(null);
  
    /** 🔍 Fetch active profile + margin info */
    const fetchActiveProfile = async () => {
      if (!user) return;
  
      setBroker((b) => ({ ...b, loading: true }));
      setError(null);
  
      try {
        const res = await authFetch("profiles/check-profile/");
        const data = await res.json();
        console.log(data);
  
        setBroker({
          loading: false,
          id: data.id || null,
          loggedIn: data.logged_in || false,
          name: data.broker_name || "Unknown Broker",
          userId: data.broker_user_id || "N/A",
          margin: data.margin_equity ?? null,
        });
      } catch (err) {
        console.error("Broker check failed:", err);
      }
    };

  useEffect(()=>{
      fetchActiveProfile();
  },[]);

  const { user } = useAuthStore();
  const alert = useAlert();
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePasswordSubmit = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    let valid = true;
    const newErrors: Errors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
      valid = false;
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required";
      valid = false;
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
      valid = false;
    }
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      valid = false;
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      valid = false;
    }

    setErrors(newErrors);

    if (!valid) return;

    try {
      setLoading(true);
      const res = await authFetch("/users/password/change/", {
        method: "POST",
        body: JSON.stringify({
          old_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
          confirm_password: passwordData.confirmPassword,
        }),
      });


      if (res?.ok) {
        alert("Password changed successfully!");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const data = await res.json()
        alert(data?.message || "Failed to change password");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="card bg-base-100 border border-base-300 p-6">
      <h2 className="text-2xl font-bold mb-6 text-base-content">Change Password</h2>
      <div className="space-y-4">
        <PasswordInput
          label="Current Password"
          name="currentPassword"
          value={passwordData.currentPassword}
          onChange={handlePasswordChange}
          showPassword={showCurrentPassword}
          toggleShowPassword={() => setShowCurrentPassword(!showCurrentPassword)}
          placeholder="Enter your current password"
          error={errors.currentPassword}
          onEnter={() => handlePasswordSubmit()}
        />
        <PasswordInput
          label="New Password"
          name="newPassword"
          value={passwordData.newPassword}
          onChange={handlePasswordChange}
          showPassword={showNewPassword}
          toggleShowPassword={() => setShowNewPassword(!showNewPassword)}
          placeholder="Enter your new password"
          error={errors.newPassword}
          onEnter={() => handlePasswordSubmit()}
        />
        <PasswordInput
          label="Confirm New Password"
          name="confirmPassword"
          value={passwordData.confirmPassword}
          onChange={handlePasswordChange}
          showPassword={showConfirmPassword}
          toggleShowPassword={() => setShowConfirmPassword(!showConfirmPassword)}
          placeholder="Confirm your new password"
          error={errors.confirmPassword}
          onEnter={() => handlePasswordSubmit()}
        />
        <button
          type="button"
          onClick={handlePasswordSubmit}
          disabled={loading}
          aria-busy={loading}
          className="btn btn-primary w-full disabled:!bg-primary disabled:!text-primary-content disabled:opacity-90 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
        >
          {loading ? "Updating…" : "Update Password"}
        </button>
      </div>
    </div>
  );
};

export default PasswordTab;
