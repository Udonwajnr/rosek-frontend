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
import { useRouter } from "next/navigation";
import { Bars } from "react-loader-spinner"; // Importing the spinner component
import api from "../axios/axiosConfig";

export default function LoginHospital() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      // If an access token is found, redirect to the dashboard
      router.push("/dashboard");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Use the api instance for the request
      const response = await api.post(
        `${process.env.NEXT_PUBLIC_BACKEND_ENDPOINT}/api/hospital/login`,
        {
          email,
          password,
        },
      );
      console.log(response);
      // Save the access token to localStorage
      localStorage.setItem("accessToken", response.data.accessToken); // Store access token under a different key

      // Redirect to the dashboard or another page
      router.push("/dashboard");
    } catch (error) {
      if (error.response && error.response.data.msg) {
        setError(error.response.data.msg);
        console.log(error);
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-background">
      <Card className="w-full max-w-md p-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-red-600 text-center">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2 mt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm underline"
                  prefetch={false}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full mt-4" disabled={loading}>
              {loading ? (
                <Bars color="#ffffff" height={24} width={24} />
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col">
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?
              <Link href="/register" className="text-sm underline">
                Register
              </Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
