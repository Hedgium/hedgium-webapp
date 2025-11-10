"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/utils/api";
import { Eye, EarOff, EyeOff } from "lucide-react";
import useAlert from "@/hooks/useAlert";
import { useAuthStore } from "@/store/authStore";
import { encryptWithPublicKey, decryptPassword } from "@/utils/crypto";



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
}> = ({
  label,
  name,
  value,
  onChange,
  showPassword,
  toggleShowPassword,
  placeholder,
  error,
}) => (
  <div className="form-control">
    <label className="label">
      <span className="label-text text-base-content">{label}</span>
    </label>
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        className={`input input-bordered w-full pr-10 ${
          error ? "input-error" : ""
        }`}
        placeholder={placeholder}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/60"
        onClick={toggleShowPassword}
      >
        {showPassword ? (
          <EyeOff className="h-6 w-6" />
        ) : (
          <Eye className="h-6 w-6" />
        )}
      </button>
    </div>
    {error && <p className="mt-2 text-sm text-error">{error}</p>}
  </div>
);


interface BrokerState {
  loading: boolean;
  id: Number;
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
    
  const handleSetBrokerUserPassword = async () => {
  // console.log("Hello World");
  console.log("user", keys);

  try {
    // 🔹 Step 1: Encrypt password with broker's public key
    const encryptedPassword = await encryptWithPublicKey(keys.public_key, brokerUserPassword);

    // 🔹 Step 2: Send encrypted password to API
    const res = await authFetch(`profiles/${broker.id}/`, {
      method: "PUT",
      body: JSON.stringify({
        broker_user_password: encryptedPassword,
      }),
    });

    const data = await res.json();
    console.log("API response:", data);

    // 🔹 Step 3: Decrypt password locally using private key from localStorage
    const decryptedPassword = await decryptPassword(encryptedPassword);
    console.log("Decrypted back:", decryptedPassword);
  } catch (error) {
    console.error("Error in handleSetBrokerUserPassword:", error);
  }
};




  useEffect(()=>{
      fetchActiveProfile();
  },[])


  const handleCreateKeys = ()=>{
    userKeyCreateUpdate();      
  }
    

  const {keys, user, userKeyCreateUpdate} = useAuthStore();
  const alert = useAlert();
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [brokerUserPassword, setBrokerUserPassword] = useState("");
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

  const handlePasswordSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
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
      <button onClick={handleCreateKeys} className="btn">Create keys</button>
      <input 
      className="input"
      
      onChange={(e)=>setBrokerUserPassword(e.target.value)}
      />

      <button className="btn" onClick={handleSetBrokerUserPassword}>Submit</button>

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
        />
        <button
          onClick={handlePasswordSubmit}
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
};

export default PasswordTab;
