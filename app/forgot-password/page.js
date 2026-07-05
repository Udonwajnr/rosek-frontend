"use client";
import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Bars } from "react-loader-spinner"; // Import the Bars loader
import ResetEmailSent from "../components/ResetEmailSent";
import { useRouter } from "next/navigation";
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/hospital/forgot-password",
        { email },
        { headers: { "Content-Type": "application/json" } },
      );
      setSuccess(true);
      console.log(response.data);
    } catch (error) {
      setError(
        error.response?.data?.msg ||
          "Failed to send reset link. Please try again.",
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const data = localStorage.getItem("token");
    if (data) {
      // If a token is found, redirect to the dashboard
      router.push("/dashboard");
    }
  }, [router]);

  if (success) return <ResetEmailSent />;

  return (
    <div className="flex justify-center items-center h-screen bg-background">
      <Card className="w-full max-w-md p-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email to reset your password.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={handleChange}
                required
              />
            </div>
            {error && <p className="text-red-500">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button
              type="submit"
              className="w-full flex justify-center items-center"
              disabled={loading}
            >
              {loading ? (
                <Bars
                  height="24"
                  width="24"
                  color="#ffffff"
                  ariaLabel="loading"
                  wrapperClass="mr-2"
                />
              ) : (
                "Send Reset Link"
              )}
            </Button>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{" "}
                <Link href="/login" className="font-semibold underline">
                  Login
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
