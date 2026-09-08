"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/frontend/components/ui/button";

const ProfilePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Load user data from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("userName");
      const storedEmail = localStorage.getItem("userEmail");
      const storedId = localStorage.getItem("userId");

      if (!storedId) {
        // Not logged in, redirect to sign-in
        router.push("/sign-in");
        return;
      }

      setProfileData({
        fullName: storedName || "",
        email: storedEmail || "",
      });
    }
  }, [router]);

  // Fetch user data from backend
  useEffect(() => {
    const fetchUserData = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      try {
        const baseUrl = "http://localhost:5216";
        const res = await fetch(`${baseUrl}/auth/profile/${userId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          const user = await res.json();
          setProfileData({
            fullName: user.FullName || user.fullName || "",
            email: user.Email || user.email || "",
          });
          // Update localStorage
          localStorage.setItem("userName", user.FullName || user.fullName || "");
          localStorage.setItem("userEmail", user.Email || user.email || "");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    fetchUserData();
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("User not logged in");
      setLoading(false);
      return;
    }

    try {
      const baseUrl = "http://localhost:5216";
      const res = await fetch(`${baseUrl}/auth/profile/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          FullName: profileData.fullName,
          Email: profileData.email,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        const errorMessage = text || "Failed to update profile";
        setError(errorMessage);
        setLoading(false);
        return;
      }

      setSuccess("Profile updated successfully!");
      // Update localStorage
      localStorage.setItem("userName", profileData.fullName);
      localStorage.setItem("userEmail", profileData.email);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("User not logged in");
      setLoading(false);
      return;
    }

    try {
      const baseUrl = "http://localhost:5216";
      const res = await fetch(`${baseUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          UserId: userId,
          CurrentPassword: passwordData.currentPassword,
          NewPassword: passwordData.newPassword,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        const errorMessage = text || "Failed to reset password";
        setError(errorMessage);
        setLoading(false);
        return;
      }

      setSuccess("Password reset successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Error resetting password:", err);
      setError("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-500 to-dark-600">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-dark-400 border-b border-dark-200 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 hover:opacity-80 transition"
              >
                <Image src="/logo.svg" alt="PrepWise" width={32} height={32} />
                <span className="text-xl font-bold text-white">PrepWise</span>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button className="bg-dark-400 border border-dark-200 text-gray-300 hover:border-primary-200 hover:text-primary-200 px-6">
                  ← Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">User Profile</h1>
          <p className="text-gray-400">
            Manage your account information and settings
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-dark-200">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === "profile"
                ? "text-primary-200 border-b-2 border-primary-200"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Update Information
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === "password"
                ? "text-primary-200 border-b-2 border-primary-200"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Reset Password
          </button>
        </div>

        {/* Profile Update Form */}
        {activeTab === "profile" && (
          <div className="bg-dark-300 border border-dark-200 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">
              Update Your Information
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-red-950/40 border border-red-500 rounded-lg">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-950/40 border border-green-500 rounded-lg">
                <p className="text-green-200 text-sm">{success}</p>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={profileData.fullName}
                  onChange={handleProfileChange}
                  required
                  className="w-full px-4 py-3 bg-dark-400 border border-dark-200 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-200"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  required
                  className="w-full px-4 py-3 bg-dark-400 border border-dark-200 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-200"
                  placeholder="Enter your email"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary-200 text-black font-semibold hover:bg-primary-300 px-8 py-3"
                >
                  {loading ? "Updating..." : "Update Profile"}
                </Button>
                <Button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="bg-dark-400 border border-dark-200 text-gray-300 hover:border-primary-200 hover:text-primary-200 px-8 py-3"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Password Reset Form */}
        {activeTab === "password" && (
          <div className="bg-dark-300 border border-dark-200 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">
              Reset Your Password
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-red-950/40 border border-red-500 rounded-lg">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-950/40 border border-green-500 rounded-lg">
                <p className="text-green-200 text-sm">{success}</p>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-4 py-3 bg-dark-400 border border-dark-200 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-200"
                  placeholder="Enter your current password"
                />
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-dark-400 border border-dark-200 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-200"
                  placeholder="Enter your new password (min 6 characters)"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-dark-400 border border-dark-200 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-200"
                  placeholder="Confirm your new password"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary-200 text-black font-semibold hover:bg-primary-300 px-8 py-3"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
                <Button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="bg-dark-400 border border-dark-200 text-gray-300 hover:border-primary-200 hover:text-primary-200 px-8 py-3"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;

