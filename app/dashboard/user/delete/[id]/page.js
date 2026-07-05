"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import api from "@/app/axios/axiosConfig";
import { useRouter, useParams } from "next/navigation";

export default function UserDeleteConfirmation() {
  const { id } = useParams(); // Retrieve the user ID from URL
  const userId = id;
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [hospitalId, setHospitalId] = useState(null);
  const [isValidUser, setIsValidUser] = useState(false); // Track if the user is valid
  const router = useRouter();

  // Check if the user exists by making a GET request
  const checkIfUserExists = async (userId, hospitalId) => {
    try {
      const response = await api.get(
        `http://localhost:8000/api/user/hospital/${hospitalId}/users/${userId}`,
      );
      if (response.status === 200 && response.data) {
        setIsValidUser(true);
      } else {
        setError("User not found. Redirecting...");
        setTimeout(() => {
          router.push("/dashboard/inventory");
        }, 2000);
      }
    } catch (err) {
      setError("User not found. Redirecting...");
      setTimeout(() => {
        router.push("/dashboard/inventory");
      }, 2000);
    }
  };

  useEffect(() => {
    const storedHospitalId = localStorage.getItem("_id"); // Get hospital ID from local storage
    if (!userId || !storedHospitalId) {
      setError("Invalid User or Hospital ID. Redirecting...");
      setTimeout(() => {
        router.push("/dashboard/inventory");
      }, 2000);
    } else {
      setHospitalId(storedHospitalId);
      checkIfUserExists(userId, storedHospitalId); // Check if the user exists
    }
  }, [userId, router]);

  const handleDelete = async () => {
    if (!isValidUser || !hospitalId) {
      setError("Invalid User ID or Hospital ID. Redirecting...");
      setTimeout(() => {
        router.push("/dashboard/inventory");
      }, 2000);
      return;
    }

    setIsDeleting(true); // Show loading state

    try {
      await api.delete(
        `http://localhost:8000/api/user/hospital/${hospitalId}/users/${userId}`,
      );
      alert("User deleted successfully.");
      router.push("/dashboard/user");
    } catch (err) {
      setError("Failed to delete the user.");
    } finally {
      setIsDeleting(false); // Remove loading state
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md text-center">
        <TrashIcon
          className="mx-auto h-12 w-12 text-destructive"
          aria-label="Delete Icon"
        />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Delete User
        </h1>
        <p className="mt-4 text-muted-foreground">
          Are you sure you want to delete this user? This action cannot be
          undone.
        </p>
        {error && <p className="mt-2 text-red-500">{error}</p>}
        <div className="mt-6 flex justify-center gap-4">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !isValidUser}
          >
            {isDeleting ? "Deleting..." : "Confirm Delete"}
          </Button>
          <Link href="/dashboard/user">
            <Button variant="outline" disabled={isDeleting}>
              Cancel
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function TrashIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
