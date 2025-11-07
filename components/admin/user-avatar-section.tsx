"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface UserAvatarSectionProps {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  avatarUrl: string | null;
  role: string;
  verified: boolean;
  isFrozen: boolean;
}

export function UserAvatarSection({
  userId,
  userName,
  userEmail,
  avatarUrl,
  role,
  verified,
  isFrozen,
}: UserAvatarSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const router = useRouter();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be smaller than 5MB");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);

      const response = await fetch("/api/admin/users/update-avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload avatar");
      }

      router.refresh();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setUploadError(error instanceof Error ? error.message : "Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "guide":
        return "bg-blue-100 text-blue-800";
      case "agency":
        return "bg-purple-100 text-purple-800";
      case "dmc":
        return "bg-green-100 text-green-800";
      case "transport":
        return "bg-orange-100 text-orange-800";
      case "admin":
      case "super_admin":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-6 rounded-xl border border-foreground/10 bg-gradient-to-br from-white to-gray-50">
      {/* Avatar */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-purple-600">
          {avatarUrl && avatarUrl !== "n/a" && (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) ? (
            <Image
              src={avatarUrl}
              alt={userName || "User avatar"}
              width={128}
              height={128}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
              {getInitials(userName)}
            </div>
          )}
        </div>

        {/* Upload Button */}
        <label
          htmlFor="avatar-upload"
          className={`absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white cursor-pointer hover:bg-blue-700 shadow-lg transition-colors ${
            isUploading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      </div>

      {uploadError && (
        <p className="text-xs text-red-600 text-center">{uploadError}</p>
      )}

      {/* User Info */}
      <div className="text-center space-y-2 w-full">
        <h2 className="text-xl font-bold text-foreground">
          {userName || "Unknown User"}
        </h2>
        <p className="text-sm text-foreground/60 break-all">{userEmail}</p>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 justify-center mt-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(role)}`}
          >
            {role.toUpperCase()}
          </span>

          {verified && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1">
              <svg
                className="w-3 h-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              VERIFIED
            </span>
          )}

          {isFrozen && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
              ❄️ FROZEN
            </span>
          )}
        </div>
      </div>

      {/* User ID */}
      <div className="w-full pt-3 border-t border-foreground/10">
        <p className="text-xs text-foreground/50 text-center">
          ID: <span className="font-mono">{userId}</span>
        </p>
      </div>
    </div>
  );
}
