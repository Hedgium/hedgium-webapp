"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "nextjs-toploader/app";

import { Lock, Mail } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [nextPath, setNextPath] = useState("/dashboard");

  const { login, accessToken, isLoading } = useAuthStore();
  const router = useRouter();

  // read ?next= param from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const nextParam = params.get("next");
      if (nextParam) setNextPath(nextParam);
    }
  }, []);

  // redirect if already logged in
  useEffect(() => {
    if (accessToken) {
      router.push(nextPath);
    }
  }, [accessToken, router, nextPath]);

  const handleLogin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    let valid = true;

    if (!email) {
      setEmailError("Email is required");
      valid = false;
    } else {
      setEmailError("");
    }

    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    } else {
      setPasswordError("");
    }

    if (valid) {
      login(email, password);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen hero-pattern flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Log in to <span className="text-primary">Hedgium</span>
          </h2>

          <div className="card bg-base-100 shadow-xl card-hover">
            <div className="card-body space-y-6">
              {accessToken ? (
                <div className="text-center">
                  <p className="text-green-600 font-semibold text-lg">
                    ✅ Login successful!
                  </p>
                </div>
              ) : (
                <>
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium">
                      Email address
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                        <Mail className="h-5 w-5 text-gray-400 z-10" />
                      </div>
                      <input
                        id="email"
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
                      <p className="mt-2 text-sm text-red-600">{emailError}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium">
                      Password
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                        <Lock className="h-5 w-5 text-gray-400 z-10" />
                      </div>
                      <input
                        id="password"
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
                      <p className="mt-2 text-sm text-red-600">{passwordError}</p>
                    )}
                  </div>

                  {/* Login Button */}
                  <button
                    className="btn btn-primary w-full"
                    onClick={handleLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? "Loading..." : "Log In"}
                  </button>

                  <div className="text-center text-sm">
                    <p>
                      Don&apos;t have an account?{" "}
                      <Link
                        href="/register"
                        className="font-medium text-primary hover:text-primary-dark"
                      >
                        Sign up
                      </Link>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Login;