"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { myFetch } from "@/utils/api";
import { useAuthStore } from "@/store/authStore";
import useAlert from "@/hooks/useAlert";

function Register() {
  const router = useRouter();
  const alert = useAlert();

  const [first_name, setFirstName] = useState<string>("");
  const { login, accessToken, updateUser } = useAuthStore();
  const [last_name, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [registering, setRegistering] = useState<boolean>(false);

  // Errors
  const [first_nameError, setFirstNameError] = useState<string>("");
  const [last_nameError, setLastNameError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");


  const [error, setError] = useState(""); // Add this
  
  const validateEmail = (email: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleRegister(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setRegistering(true);
    let valid = true;

    try {
      if (!first_name) {
        setFirstNameError("First name is required");
        valid = false;
        return;
      } else setFirstNameError("");

      if (!last_name) {
        setLastNameError("Last name is required");
        valid = false;
        return;
      } else setLastNameError("");

      if (!email) {
        setEmailError("Email is required");
        valid = false;
        return;
      } else if (!validateEmail(email)) {
        setEmailError("Please enter a valid email");
        valid = false;
        return;
      } else setEmailError("");

      if (!password) {
        setPasswordError("Password is required");
        valid = false;
        return;
      } else if (password.length < 6) {
        setPasswordError("Password must be at least 6 characters");
        valid = false;
        return;
      } else setPasswordError("");

      if (!confirmPassword) {
        setConfirmPasswordError("Please confirm your password");
        valid = false;
        return;
      } else if (confirmPassword !== password) {
        setConfirmPasswordError("Passwords do not match");
        valid = false;
        return;
      } else setConfirmPasswordError("");

      const dataToSend = {
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "username": email,
        "password": password
      };
      try {
        setError(null)
        const res = await myFetch('users', {
          method: "POST",
          body: JSON.stringify(dataToSend) // Convert the data object to a JSON string
        });
        
        if (res.ok) {
          const data = await res.json();
          alert.success('User created sucessfully', { duration: 3000 });
          login(email, password);
          updateUser({ signup_step: "initiated" });
        } else {
          const errorRes = await res.json();
          setError(errorRes?.detail)
          alert(errorRes?.detail, {duration:3000})

        }
      } catch (e) {
        console.log(e);
        alert.error("Something went wrong", { duration: 5000 });
      }
    } finally {
      setRegistering(false);
    }
  }
  
  useEffect(() => {
    if (accessToken) {
      router.push("/register/complete-profile");
    }
  }, [accessToken]);

  return (
    <>
      <div className="min-h-screen hero-pattern flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="text-center text-3xl font-bold text-base-content">
              Sign up for <span className="text-primary">Hedgium</span>
            </h2>
            <p className="mt-2 text-center text-sm text-base-content/60">
              Start trading with AI-powered strategies today
            </p>
          </div>

          <div className="card bg-base-100 shadow-xl card-hover">
            <div className="card-body">
              <div className="space-y-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-base-content">
                    First Name
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center z-10">
                      <User className="h-5 w-5 text-base-content/60" />
                    </div>
                    <input
                      type="text"
                      className={`input input-bordered w-full pl-10 ${
                        first_nameError ? "input-error" : ""
                      }`}
                      value={first_name}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  {first_nameError && (
                    <p className="mt-2 text-sm text-error">{first_nameError}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-base-content">
                    Last Name
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center z-10">
                      <User className="h-5 w-5 text-base-content/60" />
                    </div>
                    <input
                      type="text"
                      className={`input input-bordered w-full pl-10 ${
                        last_nameError ? "input-error" : ""
                      }`}
                      value={last_name}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                  {last_nameError && (
                    <p className="mt-2 text-sm text-error">{last_nameError}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-base-content">
                    Email address
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center z-10">
                      <Mail className="h-5 w-5 text-base-content/60" />
                    </div>
                    <input
                      type="email"
                      className={`input input-bordered w-full pl-10 ${
                        emailError ? "input-error" : ""
                      }`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>
                  {emailError && (
                    <p className="mt-2 text-sm text-error">{emailError}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-base-content">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center z-10">
                      <Lock className="h-5 w-5 text-base-content/60" />
                    </div>
                    <input
                      type="password"
                      className={`input input-bordered w-full pl-10 ${
                        passwordError ? "input-error" : ""
                      }`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                  </div>
                  {passwordError && (
                    <p className="mt-2 text-sm text-error">{passwordError}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-base-content">
                    Confirm Password
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center z-10">
                      <Lock className="h-5 w-5 text-base-content/60" />
                    </div>
                    <input
                      type="password"
                      className={`input input-bordered w-full pl-10 ${
                        confirmPasswordError ? "input-error" : ""
                      }`}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                    />
                  </div>
                  {confirmPasswordError && (
                    <p className="mt-2 text-sm text-error">
                      {confirmPasswordError}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <div>
                  <button
                    className="btn btn-primary w-full"
                    disabled={registering}
                    onClick={handleRegister}
                  >
                    {registering ? "Loading..." : "Register"}
                  </button>
                </div>

                {error && (
                    <p className="text-red-600 text-sm text-center mb-2">{error}</p>
                  )}



                {/* Link */}
                <div className="text-center text-sm">
                  <p>
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="font-medium text-primary hover:opacity-80"
                    >
                      Log in
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;