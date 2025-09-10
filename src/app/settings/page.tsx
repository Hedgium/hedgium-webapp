'use client';

import { useState } from 'react';
import { 
  User, Mail, Phone, Save, Eye, EyeOff, 
  Palette, Moon, Sun, Laptop, Bell, Shield,
  CreditCard, Download, LogOut, ChevronLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

// Interfaces for type safety
interface UserData {
  name: string;
  email: string;
  phone: string;
  bio: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Reusable Input component
const InputField: React.FC<{
  label: string;
  name: string;
  value: string;
  type: string;
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  error?: string;
}> = ({ label, name, value, type, placeholder, onChange, icon, error }) => (
  <div className="form-control">
    <label className="label">
      <span className="label-text text-base-content">{label}</span>
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center z-10">
        {icon}
      </div>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={`input input-bordered w-full pl-10 ${error ? 'input-error' : ''}`}
        placeholder={placeholder}
      />
    </div>
    {error && <p className="mt-2 text-sm text-error">{error}</p>}
  </div>
);

// Reusable Password Input component
const PasswordInput: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPassword: boolean;
  toggleShowPassword: () => void;
  placeholder: string;
  error?: string;
}> = ({ label, name, value, onChange, showPassword, toggleShowPassword, placeholder, error }) => (
  <div className="form-control">
    <label className="label">
      <span className="label-text text-base-content">{label}</span>
    </label>
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        className={`input input-bordered w-full pr-10 ${error ? 'input-error' : ''}`}
        placeholder={placeholder}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/60"
        onClick={toggleShowPassword}
      >
        {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
      </button>
    </div>
    {error && <p className="mt-2 text-sm text-error">{error}</p>}
  </div>
);

// Main SettingsPage component
const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData>({
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    phone: '+91 9876543210',
    bio: 'Professional trader focused on options strategies',
  });
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<UserData & PasswordData>>({});

  const validateEmail = (email: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSaveProfile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    let valid = true;
    const newErrors: Partial<UserData> = {};

    if (!userData.name) {
      newErrors.name = 'Name is required';
      valid = false;
    }
    if (!userData.email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!validateEmail(userData.email)) {
      newErrors.email = 'Please enter a valid email';
      valid = false;
    }
    if (!userData.phone) {
      newErrors.phone = 'Phone number is required';
      valid = false;
    }

    setErrors(newErrors);
    if (valid) {
      console.log('Saving profile:', userData);
      alert('Profile updated successfully!');
    }
  };

  const handlePasswordSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    let valid = true;
    const newErrors: Partial<PasswordData> = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
      valid = false;
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
      valid = false;
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
      valid = false;
    }
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      valid = false;
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }

    setErrors(newErrors);
    if (valid) {
      console.log('Changing password:', passwordData);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      alert('Password changed successfully!');
    }
  };

  const handleThemeChange = (theme: string) => {
    setTheme(theme);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="h-5 w-5" /> },
    { id: 'password', label: 'Password', icon: <Shield className="h-5 w-5" /> },
    { id: 'theme', label: 'Theme', icon: <Palette className="h-5 w-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard className="h-5 w-5" /> },
    { id: 'data', label: 'Data & Privacy', icon: <Download className="h-5 w-5" /> },
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
          {/* Sidebar Navigation */}
          <div className="lg:w-1/4">
            <div className="card bg-base-100 shadow-xl card-hover p-4 sticky top-24">
              <ul className="menu menu-vertical space-y-2 w-full">
                {tabs.map(tab => (
                  <li key={tab.id}>
                    <a
                      className={activeTab === tab.id ? 'active' : ''}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.icon}
                      {tab.label}
                    </a>
                  </li>
                ))}
                <li className="mt-4">
                  <a className="text-error">
                    <LogOut className="h-5 w-5" />
                    Logout
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Profile Section */}
            {activeTab === 'profile' && (
              <div className="card bg-base-100 shadow-xl card-hover p-6">
                <h2 className="text-2xl font-bold mb-6 text-base-content">Profile Information</h2>
                <div className="space-y-4">
                  <InputField
                    label="Full Name"
                    name="name"
                    value={userData.name}
                    type="text"
                    placeholder="Enter your full name"
                    onChange={handleInputChange}
                    icon={<User className="h-6 w-6 text-base-content/60" />}
                    error={errors.name}
                  />
                  <InputField
                    label="Email Address"
                    name="email"
                    value={userData.email}
                    type="email"
                    placeholder="Enter your email address"
                    onChange={handleInputChange}
                    icon={<Mail className="h-6 w-6 text-base-content/60" />}
                    error={errors.email}
                  />
                  <InputField
                    label="Phone Number"
                    name="phone"
                    value={userData.phone}
                    type="tel"
                    placeholder="Enter your phone number"
                    onChange={handleInputChange}
                    icon={<Phone className="h-6 w-6 text-base-content/60" />}
                    error={errors.phone}
                  />
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-base-content">Bio</span>
                    </label>
                    <textarea
                      name="bio"
                      value={userData.bio}
                      onChange={handleInputChange}
                      className="textarea textarea-bordered h-24"
                      placeholder="Tell us about yourself"
                    />
                  </div>
                  <button onClick={handleSaveProfile} className="btn btn-primary w-full">
                    <Save className="h-6 w-6 mr-2" />
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Password Section */}
            {activeTab === 'password' && (
              <div className="card bg-base-100 shadow-xl card-hover p-6">
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
                  <button onClick={handlePasswordSubmit} className="btn btn-primary w-full">
                    Update Password
                  </button>
                </div>
              </div>
            )}

            {/* Theme Section */}
            {activeTab === 'theme' && (
              <div className="card bg-base-100 shadow-xl card-hover p-6">
                <h2 className="text-2xl font-bold mb-6 text-base-content">Theme Preferences</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Color Theme</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'light', label: 'Light', icon: <Sun className="h-6 w-6 mr-2" /> },
                        { id: 'dark', label: 'Dark', icon: <Moon className="h-6 w-6 mr-2" /> },
                        { id: 'auto', label: 'System Default', icon: <Laptop className="h-6 w-6 mr-2" /> },
                      ].map(themeOption => (
                        <div
                          key={themeOption.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            theme === themeOption.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => handleThemeChange(themeOption.id)}
                        >
                          <div className="flex items-center mb-2">
                            {themeOption.icon}
                            <span>{themeOption.label}</span>
                          </div>
                          <div className="flex space-x-1">
                            <div className={`w-6 h-6 rounded ${themeOption.id === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
                            <div className={`w-6 h-6 rounded ${themeOption.id === 'dark' ? 'bg-gray-900' : 'bg-white'} border`}></div>
                            <div className="w-6 h-6 rounded bg-blue-500"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Accent Color</h3>
                    <div className="flex space-x-3">
                      {['primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error'].map(color => (
                        <div
                          key={color}
                          className={`w-10 h-10 rounded-full bg-${color} cursor-pointer ${color === 'primary' ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="cursor-pointer label justify-start">
                      <input type="checkbox" className="toggle toggle-primary mr-3" defaultChecked />
                      <span className="label-text text-base-content">Enable dark mode between sunset and sunrise</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Section */}
            {activeTab === 'notifications' && (
              <div className="card bg-base-100 shadow-xl card-hover p-6">
                <h2 className="text-2xl font-bold mb-6 text-base-content">Notification Preferences</h2>
                <div className="space-y-6">
                  {[
                    { label: 'Email notifications', defaultChecked: true },
                    { label: 'Push notifications', defaultChecked: true },
                    { label: 'SMS alerts', defaultChecked: true },
                  ].map(notification => (
                    <div key={notification.label} className="form-control">
                      <label className="cursor-pointer label justify-start">
                        <input type="checkbox" className="toggle toggle-primary mr-3" defaultChecked={notification.defaultChecked} />
                        <span className="label-text text-base-content">{notification.label}</span>
                      </label>
                    </div>
                  ))}
                  <div className="divider"></div>
                  <h3 className="text-lg font-semibold mb-4">Trading Alerts</h3>
                  {[
                    { label: 'New trading signals', defaultChecked: true },
                    { label: 'Strategy updates', defaultChecked: true },
                    { label: 'Market news', defaultChecked: false },
                  ].map(alert => (
                    <div key={alert.label} className="form-control">
                      <label className="cursor-pointer label justify-start">
                        <input type="checkbox" className="checkbox checkbox-primary mr-3" defaultChecked={alert.defaultChecked} />
                        <span className="label-text text-base-content">{alert.label}</span>
                      </label>
                    </div>
                  ))}
                  <button className="btn btn-primary w-full">Save Preferences</button>
                </div>
              </div>
            )}

            {/* Billing Section */}
            {activeTab === 'billing' && (
              <div className="card bg-base-100 shadow-xl card-hover p-6">
                <h2 className="text-2xl font-bold mb-6 text-base-content">Billing Information</h2>
                <div className="space-y-6">
                  <div className="card bg-base-200 p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Current Plan</h3>
                      <span className="badge badge-primary">Pro</span>
                    </div>
                    <p className="text-base-content/80">₹19,999/month</p>
                    <p className="text-sm text-base-content/60 mt-2">Next billing date: October 10, 2023</p>
                    <button className="btn btn-outline btn-sm mt-4">Change Plan</button>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                    <div className="card bg-base-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-white p-1 rounded mr-3">
                            <CreditCard className="h-6 w-6 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-base-content">Visa ending in 4567</p>
                            <p className="text-sm text-base-content/60">Expires 12/2024</p>
                          </div>
                        </div>
                        <button className="btn btn-ghost btn-sm">Edit</button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Billing History</h3>
                    <div className="overflow-x-auto">
                      <table className="table table-zebra w-full">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Amount</th>
                            <th>Invoice</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { date: 'Sept 10, 2023', description: 'Pro Plan Subscription', amount: '₹19,999' },
                            { date: 'Aug 10, 2023', description: 'Pro Plan Subscription', amount: '₹19,999' },
                            { date: 'Jul 10, 2023', description: 'Pro Plan Subscription', amount: '₹19,999' },
                          ].map((entry, index) => (
                            <tr key={index}>
                              <td>{entry.date}</td>
                              <td>{entry.description}</td>
                              <td>{entry.amount}</td>
                              <td>
                                <button className="btn btn-ghost btn-xs">
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data & Privacy Section */}
            {activeTab === 'data' && (
              <div className="card bg-base-100 shadow-xl card-hover p-6">
                <h2 className="text-2xl font-bold mb-6 text-base-content">Data & Privacy</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Data Export</h3>
                    <p className="text-base-content/80 mb-4">
                      Download a copy of your personal data, including your trading history and preferences.
                    </p>
                    <button className="btn btn-outline">
                      <Download className="h-5 w-5 mr-2" />
                      Export Data
                    </button>
                  </div>
                  <div className="divider"></div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
                    {[
                      { label: 'Allow personalized trading insights', defaultChecked: true },
                      { label: 'Share anonymous usage data to improve Hedgium', defaultChecked: false },
                    ].map(setting => (
                      <div key={setting.label} className="form-control">
                        <label className="cursor-pointer label justify-start">
                          <input type="checkbox" className="toggle toggle-primary mr-3" defaultChecked={setting.defaultChecked} />
                          <span className="label-text text-base-content">{setting.label}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="divider"></div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Account Deletion</h3>
                    <p className="text-base-content/80 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <button className="btn btn-error btn-outline">Delete Account</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;