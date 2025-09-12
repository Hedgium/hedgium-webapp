"use client";

import React, { useState } from "react";
import { Lock, Mail, User } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

const Register: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [nameError, setNameError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");

  const validateEmail = (email: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleRegister = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    let valid = true;

    if (!name) {
      setNameError("Name is required");
      valid = false;
    } else setNameError("");

    if (!email) {
      setEmailError("Email is required");
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email");
      valid = false;
    } else setEmailError("");

    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      valid = false;
    } else setPasswordError("");

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      valid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError("Passwords do not match");
      valid = false;
    } else setConfirmPasswordError("");

    if (valid) {
      console.log("Registration attempted with:", { name, email, password });
    }
  };

  return (
    <>
    <Navbar />
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
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-base-content">
                  Full Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center z-10">
                    <User className="h-5 w-5 text-base-content/60" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className={`input input-bordered w-full pl-10 ${nameError ? "input-error" : ""}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                {nameError && <p className="mt-2 text-sm text-error">{nameError}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-base-content">
                  Email address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center z-10">
                    <Mail className="h-5 w-5 text-base-content/60" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`input input-bordered w-full pl-10 ${emailError ? "input-error" : ""}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
                {emailError && <p className="mt-2 text-sm text-error">{emailError}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-base-content">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center z-10">
                    <Lock className="h-5 w-5 text-base-content/60" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className={`input input-bordered w-full pl-10 ${passwordError ? "input-error" : ""}`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>
                {passwordError && <p className="mt-2 text-sm text-error">{passwordError}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-base-content">
                  Confirm Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center z-10">
                    <Lock className="h-5 w-5 text-base-content/60" />
                  </div>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    className={`input input-bordered w-full pl-10 ${confirmPasswordError ? "input-error" : ""}`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                  />
                </div>
                {confirmPasswordError && <p className="mt-2 text-sm text-error">{confirmPasswordError}</p>}
              </div>

              {/* Submit */}
              <div>
                <button className="btn btn-primary w-full" onClick={handleRegister}>
                  Sign Up
                </button>
              </div>

              {/* Link */}
              <div className="text-center text-sm">
                <p>
                  Already have an account?{" "}
                  <Link href="/login" className="font-medium text-primary hover:opacity-80">
                    Log in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>


<Footer />

</>
  );
};

export default Register;