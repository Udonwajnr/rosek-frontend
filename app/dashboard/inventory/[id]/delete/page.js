"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import api from "@/app/axios/axiosConfig";
import { useRouter, useParams } from "next/navigation";

export default function DeleteMedication() {
  const { id } = useParams(); // Retrieve the product ID from URL
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [hospitalId, setHospitalId] = useState(null);
  const [validMedication, setValidMedication] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkMedication = async () => {
      try {
        const hospital = localStorage.getItem("_id");
        const response = api
          .get(
            `http://localhost:8000/api/medication/${hospital}/medications/${id}`,
          )
          .then((data) => {
            setHospitalId(hospital);
            setValidMedication(true);
          })
          .catch((err) => {
            console.log(err);
            setValidMedication(false);
            setError("Medication Not Found");
          });
      } catch (err) {
        setError("Medication Not Found");
      }
    };
    checkMedication();
  }, [router]);

  const handleDelete = async () => {
    if (!id || !hospitalId) {
      setError("Invalid ID or Hospital ID. Redirecting...");
      setTimeout(() => {
        router.push("/dashboard/inventory");
      }, 2000);
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete(
        `http://localhost:8000/api/medication/${hospitalId}/medications/${id}`,
      );
      alert("Deleted Successfully");
      router.push("/dashboard/inventory");
    } catch (err) {
      setError("Failed to delete the item.");
      console.log(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md text-center">
        <TrashIcon className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Delete Item
        </h1>
        <p className="mt-4 text-muted-foreground">
          Are you sure you want to delete this item? This action cannot be
          undone.
        </p>
        {error && <p className="mt-2 text-red-500">{error}</p>}
        <div className="mt-6 flex justify-center gap-4">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !validMedication}
          >
            {isDeleting ? "Deleting..." : "Confirm Delete"}
          </Button>
          <Link href="/dashboard/inventory">
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
