"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "nextjs-toploader/app";
import { Mail, Lock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
// import Navbar from "@/components/Navbar";
// import Footer from "@/components/Footer";
import Link from "next/link";
import { Shield } from "lucide-react";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [nextPath, setNextPath] = useState("/hedgium/dashboard");

  const [loginError, setLoginError] = useState(""); // Add this

  const { login, accessToken, isLoading, isInitializing } = useAuthStore();
  const router = useRouter();

  // read ?next= param from URL (for use after login, not for redirect if already logged in)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const nextParam = params.get("next");
      if (nextParam) setNextPath(nextParam);
    }
  }, []);

  useEffect(() => {
    fetch("/api/session", { method: "GET", credentials: "include" })
      .catch(console.error);
  }, []);

  // redirect if already logged in - always go to hedgium dashboard
  useEffect(() => {
    console.log("isInitializing", isInitializing);
    console.log("accessToken", accessToken);
    if (!isInitializing && accessToken) {
      router.push("/hedgium/dashboard");
    }
  }, [accessToken, isInitializing, router]);

  const handleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoginError("");
    
    if (loginMode === "password") {
      let valid = true;

      if (!email) {
        setEmailError("Email is required");
        valid = false;
      }
      // Email pattern check
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setEmailError("Please enter a valid email address");
        valid = false;
      } 
      else {
        setEmailError("");
      }

      if (!password) {
        setPasswordError("Password is required");
        valid = false;
      } else {
        setPasswordError("");
      }

      if (valid) {
        try{
          await login(email, password);
        } catch (err: any) {
          // Show error to user
          setLoginError(err?.detail || "Something went wrong");
        }
      }
    } else {
      // Broker token login
      let valid = true;

      if (!email) {
        setEmailError("Email is required");
        valid = false;
      }
      // Email pattern check
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setEmailError("Please enter a valid email address");
        valid = false;
      } 
      else {
        setEmailError("");
      }

      if (!brokerAccessToken) {
        setTokenError("Broker access token is required");
        valid = false;
      } else {
        setTokenError("");
      }

      if (!brokerName) {
        setBrokerError("Broker selection is required");
        valid = false;
      } else {
        setBrokerError("");
      }

      if (valid) {
        try{
          await loginWithBrokerToken(email, brokerAccessToken, brokerName);
        } catch (err: any) {
          // Show error to user
          setLoginError(err?.detail || "Something went wrong");
        }
      }
    }
  };

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

                  {loginError && (
                    <p className="text-red-600 text-sm text-center mb-2">{loginError}</p>
                  )}

                  
                    


                  <div className="text-center text-sm space-y-2">
                    <p className="text-xs text-base-content/50 flex items-center justify-center gap-1">
                      <Shield className="w-3 h-3" />
                      Your data is securely encrypted and protected
                    </p>

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

                  {/* Login Button */}
                  <button
                    className="btn btn-primary w-full"
                    onClick={handleLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? "Loading..." : "Log In"}
                  </button>

                  {loginError && (
                    <p className="text-red-600 text-sm text-center mb-2">{loginError}</p>
                  )}

                  
                    


                  <div className="text-center text-sm space-y-2">
                    <p className="text-xs text-base-content/50 flex items-center justify-center gap-1">
                      <Shield className="w-3 h-3" />
                      Your data is securely encrypted and protected
                    </p>

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
    </>
  );
};

export default Login;