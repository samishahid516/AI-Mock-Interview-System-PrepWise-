"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/frontend/components/ui/button";

const AuthForm = ({ type }: { type: "sign-in" | "sign-up" }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Backend API base URL (your .NET API)
    const baseUrl = "http://localhost:5216";

    try {
      if (type === "sign-up") {
        // Call /auth/register to create user in SQL
        const res = await fetch(`${baseUrl}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          setError(text || "Sign up failed. Please try again.");
          return;
        }

        setSuccess("Account created successfully. Please sign in.");
        // Small delay so user can see the message, then go to Sign In
        setTimeout(() => {
          router.push("/sign-in");
        }, 1000);
        return;
      }

      // Sign In: check credentials via /auth/login
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!res.ok) {
        setError("Invalid email or password.");
        return;
      }

      // Save basic user info for display (e.g. on /interview page)
      try {
        const user = await res.json();
        if (user) {
          if (user.FullName || user.fullName) {
            localStorage.setItem("userName", user.FullName || user.fullName);
          } else if (user.Email || user.email) {
            localStorage.setItem("userName", user.Email || user.email);
          }
          if (user.Email || user.email) {
            localStorage.setItem("userEmail", user.Email || user.email);
          }
          if (user.Id || user.id) {
            localStorage.setItem("userId", String(user.Id || user.id));
          }
          if (user.PhotoUrl || user.photoUrl) {
            localStorage.setItem("userPhoto", user.PhotoUrl || user.photoUrl);
          }
          localStorage.setItem("isAuthenticated", "true");
        }
      } catch {
        // ignore JSON parse errors; not critical for navigation
      }

      // Only after correct credentials, go to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Auth error:", err);
      setError("Cannot reach server. Make sure the .NET API is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-300 to-dark-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Hero Section (Desktop Only) */}
          <div className="hidden lg:flex flex-col justify-center">
            <div className="mb-8">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={80}
                height={80}
                className="mb-6"
              />
              <h1 className="text-5xl font-bold text-white mb-4">PrepWise</h1>
              <p className="text-xl text-gray-300 mb-6">
                Master Your Interview Skills with AI
              </p>
              <p className="text-lg text-gray-400 mb-8 leading-relaxed">                Get personalized feedback on your interview performance.
                Practice with real questions and improve your confidence.
              </p>

              {/* Features List */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-primary-200 text-xl">✓</span>
                  <div>
                    <h3 className="text-white font-semibold">
                      AI-Powered Interviews
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Practice with intelligent questions tailored to your role
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary-200 text-xl">✓</span>
                  <div>
                    <h3 className="text-white font-semibold">
                      Instant Feedback
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Get detailed analysis and improvement suggestions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary-200 text-xl">✓</span>
                  <div>
                    <h3 className="text-white font-semibold">Track Progress</h3>
                    <p className="text-gray-400 text-sm">
                      Monitor your improvement over time
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div>
            {/* Mobile Logo and Title */}
            <div className="lg:hidden text-center mb-8">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={64}
                height={64}
                className="mx-auto mb-4"
              />
              <h1 className="text-4xl font-bold text-white mb-2">PrepWise</h1>
              <p className="text-gray-400 text-sm">
                Master Your Interview Skills with AI
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-dark-200 rounded-2xl p-8 shadow-2xl border border-light-600">
              <h2 className="text-2xl font-bold text-white mb-6">
                {type === "sign-up" ? "Create Account" : "Welcome Back"}
              </h2>

              {error && (
                <div className="mb-4 rounded-md border border-red-500 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 rounded-md border border-emerald-500 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
                  {success}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                {type === "sign-up" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-lg bg-dark-300 border border-light-600 text-white placeholder-gray-500 focus:outline-none focus:border-primary-200 transition"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg bg-dark-300 border border-light-600 text-white placeholder-gray-500 focus:outline-none focus:border-primary-200 transition"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-lg bg-dark-300 border border-light-600 text-white placeholder-gray-500 focus:outline-none focus:border-primary-200 transition"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-primary-200 to-primary-100 text-dark-100 font-bold rounded-lg hover:shadow-lg transition mt-6 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3 text-black" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    type === "sign-up" ? "Create Account" : "Sign In"
                  )}
                </Button>
              </form>

              <div className="text-center mt-6">
                {type === "sign-up" ? (
                  <>
                    <p className="text-gray-400 text-sm">
                      Already have an account?
                    </p>
                    <Link
                      href="/sign-in"
                      className="text-primary-200 font-semibold hover:text-primary-300 transition"
                    >
                      Sign In
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm">
                      Don&apos;t have an account?
                    </p>
                    <Link
                      href="/sign-up"
                      className="text-primary-200 font-semibold hover:text-primary-300 transition"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;