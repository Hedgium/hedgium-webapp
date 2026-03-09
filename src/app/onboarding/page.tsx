"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import { myFetch } from "@/utils/api";
import { useAuthStore } from "@/store/authStore";
import useAlert from "@/hooks/useAlert";

function Onboarding() {
  const router = useRouter();
  const alert = useAlert();
  const { login, updateUser } = useAuthStore();

  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registering, setRegistering] = useState(false);
  const [first_nameError, setFirstNameError] = useState("");
  const [last_nameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleRegister(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError("");
    setFirstNameError("");
    setLastNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    let valid = true;

    if (!first_name) {
      setFirstNameError("First name is required");
      valid = false;
    }
    if (!last_name) {
      setLastNameError("Last name is required");
      valid = false;
    }
    if (!email) {
      setEmailError("Email is required");
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Enter a valid email address");
      valid = false;
    }
    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("At least 6 characters");
      valid = false;
    }
    if (!confirmPassword) {
      setConfirmPasswordError("Confirm your password");
      valid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError("Passwords do not match");
      valid = false;
    }
    if (!valid) return;

    setRegistering(true);
    try {
      const res = await myFetch("users", {
        method: "POST",
        body: JSON.stringify({
          first_name,
          last_name,
          email,
          username: email,
          password,
        }),
      });
      if (res.ok) {
        alert.success("Account created. Please verify your email.", { duration: 3000 });
        await login(email, password);
        updateUser({ signup_step: "initiated" });
        router.push("/onboarding/verify-email");
      } else {
        const errorRes = await res.json();
        setError(errorRes?.detail || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      alert.error("Something went wrong", { duration: 5000 });
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4 py-8">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-base-content tracking-tight">
            Sign up for <span className="text-primary">Hedgium</span>
          </h1>
          <p className="text-sm text-base-content/60 mt-1">
            Create your account to get started
          </p>
        </div>

        <div className="bg-base-100 rounded-xl border border-base-300 shadow-sm p-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-base-content/80 mb-1.5">First name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/60 pointer-events-none z-10" />
                  <input
                    type="text"
                    autoComplete="given-name"
                    className={`input input-bordered input-sm w-full h-9 pl-9 text-sm bg-base-100 ${first_nameError ? "input-error" : ""}`}
                    value={first_name}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First"
                  />
                </div>
                {first_nameError && <p className="mt-1 text-xs text-error">{first_nameError}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-base-content/80 mb-1.5">Last name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/60 pointer-events-none z-10" />
                  <input
                    type="text"
                    autoComplete="family-name"
                    className={`input input-bordered input-sm w-full h-9 pl-9 text-sm bg-base-100 ${last_nameError ? "input-error" : ""}`}
                    value={last_name}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last"
                  />
                </div>
                {last_nameError && <p className="mt-1 text-xs text-error">{last_nameError}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-base-content/80 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/60 pointer-events-none z-10" />
                <input
                  type="email"
                  autoComplete="email"
                  className={`input input-bordered input-sm w-full h-9 pl-9 text-sm bg-base-100 ${emailError ? "input-error" : ""}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              {emailError && <p className="mt-1 text-xs text-error">{emailError}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-base-content/80 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/60 pointer-events-none z-10" />
                <input
                  type="password"
                  autoComplete="new-password"
                  className={`input input-bordered input-sm w-full h-9 pl-9 text-sm bg-base-100 ${passwordError ? "input-error" : ""}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {passwordError && <p className="mt-1 text-xs text-error">{passwordError}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-base-content/80 mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/60 pointer-events-none z-10" />
                <input
                  type="password"
                  autoComplete="new-password"
                  className={`input input-bordered input-sm w-full h-9 pl-9 text-sm bg-base-100 ${confirmPasswordError ? "input-error" : ""}`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {confirmPasswordError && <p className="mt-1 text-xs text-error">{confirmPasswordError}</p>}
            </div>

            {error && <p className="text-xs text-error text-center py-1">{error}</p>}

            <button
              type="submit"
              className="btn btn-primary btn-sm w-full h-9 text-sm font-medium normal-case"
              disabled={registering}
            >
              {registering ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-base-content/50 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Onboarding;
