"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import ResetSuccess from "@/app/components/SuccessfulResetPassword";
import { Bars } from "react-loader-spinner";
import { useRouter } from "next/navigation";

export default function ResetPassword() {
  const [status, setStatus] = useState("loading"); // 'loading', 'form', 'success', 'expired', 'invalid', 'error'
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const pathname = usePathname();
  const token = pathname.split("/").pop(); // Extract the token from the URL path
  const router = useRouter();
  useEffect(() => {
    if (token) {
      setStatus("form"); // Display form after token is initially checked
    } else {
      setStatus("invalid");
    }
  }, [token]);

  useEffect(() => {
    const data = localStorage.getItem("token");
    if (data) {
      // If a token is found, redirect to the dashboard
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/api/hospital/reset-password",
        {
          token,
          newPassword,
          confirmPassword,
        },
      );

      if (response.status === 200) {
        setStatus("success");
      }
    } catch (error) {
      if (error.response) {
        const message = error.response.data.msg;

        if (message === "Token is invalid or has expired") {
          setStatus("invalid");
        } else {
          setStatus("error");
        }
      } else {
        setStatus("error");
      }
      console.log(error);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-background">
      <Card className="w-full max-w-md p-6 shadow-lg">
        <CardHeader>
          {status === "loading" && (
            <>
              <CardTitle className="text-2xl font-bold">Verifying...</CardTitle>
              <CardDescription>
                Please wait while we verify your token.
              </CardDescription>
              <div className="flex justify-center mt-4">
                <Bars
                  height="40"
                  width="40"
                  color="#4fa94d"
                  ariaLabel="bars-loading"
                  wrapperStyle={{}}
                  wrapperClass=""
                />
              </div>
            </>
          )}
          {status === "form" && (
            <>
              <CardTitle className="text-2xl font-bold">
                Reset Password
              </CardTitle>
              <CardDescription>Enter your new password below.</CardDescription>
            </>
          )}
          {status === "success" && (
            <>
              <CardTitle className="text-2xl font-bold text-green-600">
                Password Reset Successfully
              </CardTitle>
              <CardDescription>
                Your password has been successfully reset. You can now log in
                with your new password.
              </CardDescription>
            </>
          )}
          {status === "invalid" && (
            <>
              <CardTitle className="text-2xl font-bold text-red-600">
                Invalid or Expired Token
              </CardTitle>
              <CardDescription>
                The reset link is invalid or has expired. Please request a new
                one.
              </CardDescription>
            </>
          )}
          {status === "error" && (
            <>
              <CardTitle className="text-2xl font-bold text-red-600">
                Something Went Wrong
              </CardTitle>
              <CardDescription>
                We encountered an error resetting your password. Please try
                again later or contact support.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "form" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <label htmlFor="newPassword">New Password</label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-red-500">{error}</p>}
              <Button type="submit" className="w-full bg-blue-600 text-white">
                Reset Password
              </Button>
            </form>
          )}
        </CardContent>
        {status === "success" && (
          <CardFooter className="text-center">
            <Link href="/login">
              <Button className="w-full bg-green-600 text-white">
                Go to Login
              </Button>
            </Link>
          </CardFooter>
        )}
        {status === "invalid" && (
          <CardFooter className="text-center">
            <Link href="/resend-reset-password">
              <Button className="w-full bg-blue-600 text-white">
                Resend Reset Password Link
              </Button>
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
