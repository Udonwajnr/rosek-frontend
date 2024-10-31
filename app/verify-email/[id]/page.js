"use client";

import { useEffect, useState } from "react";
import { usePathname,useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EmailVerified() {
  const [status, setStatus] = useState("loading"); // 'loading', 'success', 'expired', 'invalid', 'error'
  const pathname = usePathname();
  const token = pathname.split('/').pop(); // Extract the token from the URL path
  const router = useRouter()
  
  useEffect(() => {
    if (token) {
      axios.get(`https://medical-api-advo.onrender.com/api/hospital/verify-email/${token}`)
        .then(() => {
          setStatus("success");
        })
        .catch((error) => {
          if (error.response) {
            const message = error.response.data.msg;

            if (message === "Invalid token or hospital not found") {
              setStatus("invalid");
            } else if (message === "Email already verified") {
              setStatus("success");
            } else {
              setStatus("error");
            }
          } else {
            setStatus("error");
          }
          console.log(error);
        });
    }
  }, [token]);

  useEffect(() => {
    const data = localStorage.getItem("accessToken");
    if (data) {
      // If a token is found, redirect to the dashboard
      router.push("/dashboard");
    }
  }, [router]);
  
  return (
    <div className="flex justify-center items-center h-screen bg-background">
      <Card className="w-full max-w-md p-6 shadow-lg">
        <CardHeader>
          {status === "loading" && (
            <>
              <CardTitle className="text-2xl font-bold">Verifying...</CardTitle>
              <CardDescription>Please wait while we verify your email.</CardDescription>
            </>
          )}
          {status === "success" && (
            <>
              <CardTitle className="text-2xl font-bold text-green-600">Email Verified Successfully</CardTitle>
              <CardDescription>Your email has been successfully verified. You can now access all the features of your account.</CardDescription>
            </>
          )}
          {status === "expired" && (
            <>
              <CardTitle className="text-2xl font-bold text-red-600">Token Expired</CardTitle>
              <CardDescription>Your verification link has expired. Please request a new one.</CardDescription>
            </>
          )}
          {status === "invalid" && (
            <>
              <CardTitle className="text-2xl font-bold text-red-600">Invalid Token</CardTitle>
              <CardDescription>The verification link is invalid. Please ensure you have the correct link or request a new one.</CardDescription>
            </>
          )}
          {status === "error" && (
            <>
              <CardTitle className="text-2xl font-bold text-red-600">Something Went Wrong</CardTitle>
              <CardDescription>We encountered an error verifying your email. Please try again later or contact support.</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {status === "success" && (
            <Link href="/login">
              <Button className="w-full bg-green-600 text-white">Go to Login</Button>
            </Link>
          )}
          {(status === "expired" || status === "invalid") && (
            <Link href="/resend-verification">
              <Button className="w-full bg-blue-600 text-white">Resend Verification Email</Button>
            </Link>
          )}
        </CardContent>
        <CardFooter>
          <div className="text-center w-full">
            <p className="text-sm text-gray-600">Need help?</p>
            <Link href="/contact-support" className="text-blue-500 underline">
              Contact Support
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
