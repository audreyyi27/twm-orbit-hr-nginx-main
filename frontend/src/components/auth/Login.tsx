"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-client";
import Image from "next/image";

export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, user, isLoading } = useAuth();

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error("Please enter both username and password");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Important: include cookies
        body: JSON.stringify({ username, password }),
      });

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text);
        toast.error("Server returned an error. Please check if the backend is running.");
        return;
      }

      const data = await res.json();

      if (res.ok) {
        // Set cookies first
        await login(data.access_token, data.refresh_token, data.user);

        toast.success(
          `Welcome back, ${data.user.fullname || data.user.username}`
        );

        // Wait a bit longer to ensure cookies are fully set and available
        // This is important for middleware to detect the token
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Use window.location for hard redirect to ensure cookies are read
        window.location.href = "/candidates";
      } else {
        toast.error(data.detail || "Invalid username or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      toast.error(`Login failed: ${errorMessage}. Please check if the backend server is running.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if already logged in (when visiting login page directly)
  useEffect(() => {
    if (user && !isLoading) {
      window.location.href = "/candidates";
    }
  }, [user, isLoading]);
  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-pink-500 to-purple-700 flex items-center justify-center">
        <div className="text-white text-center">
          <svg
            className="animate-spin h-12 w-12 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        {!user && (
          <div className="min-h-screen bg-gradient-to-br from-orange-500 via-pink-500 to-purple-700 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0">
              {/* Orange glow */}
              <div className="absolute top-0 -left-4 w-72 h-72 bg-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>

              {/* Green glow */}
              <div
                className="absolute top-0 -right-4 w-72 h-72 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"
                style={{ animationDelay: "2s" }}
              ></div>

              {/* Pink glow */}
              <div
                className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"
                style={{ animationDelay: "4s" }}
              ></div>

              {/* Blue glow (extra layer for "unity") */}
              <div
                className="absolute bottom-20 right-32 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse"
                style={{ animationDelay: "6s" }}
              ></div>
            </div>

            {/* Login Container */}
            <div className="relative bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-8 transform transition-all hover:scale-[1.01]">
              {/* Logo and Header */}
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg overflow-hidden">
                  <Image
                    src="/logo.webp" // place logo inside `public/`
                    alt="TWM Logo"
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Taiwan Mobile Indonesia HR System
                </h1>
                <p className="text-gray-600 text-sm">
                  Welcome back! Please login to your account.
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* Username Field */}
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                      </div>
                      <input
                        id="username"
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                        placeholder="Enter your username"
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                      </div>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <svg
                            className="h-5 w-5 text-gray-400 hover:text-gray-600"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                          </svg>
                        ) : (
                          <svg
                            className="h-5 w-5 text-gray-400 hover:text-gray-600"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Checkbox */}
                  {/* <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                      Remember me
                    </label>
                  </div>
                  <a href="#" className="text-sm text-purple-600 hover:text-purple-500 transition-colors">
                    Forgot password?
                  </a>
                </div> */}

                  {/* Submit Button */}
                  <button
                    disabled={isSubmitting || isLoading}
                    type="submit"
                    className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white 
             bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600
             hover:from-orange-600 hover:via-pink-600 hover:to-purple-700
             focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400
             transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] 
             disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </div>
              </form>

              {/* Footer */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Dont have an account?{" "}
                  <a
                    href="#"
                    className="font-medium text-orange-600 hover:text-orange-500 transition-colors"
                  >
                    Contact HR
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
