"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
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
import { Button } from "@/components/ui/button";
import VerifyEmail from "../components/VerifyEmail";
import { Bars } from "react-loader-spinner";
import api from "../axios/axiosConfig";
export default function RegisterHospital() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Check if the user is already registered or authenticated
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const validateForm = () => {
    const { name, email, password, confirmPassword } = formData;

    if (name.length < 4) {
      setError("Name must be at least 4 characters.");
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }

    if (password.length < 5) {
      setError("Password must be at least 5 characters.");
      return false;
    }

    if (confirmPassword !== password) {
      setError("Passwords don't match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        `${process.env.NEXT_PUBLIC_BACKEND_ENDPOINT}/api/hospital/register`,
        formData,
      );
      router.push("/login");
      setSuccess(true);
    } catch (error) {
      console.log(error);
      setError(
        error.response?.data?.msg || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // if (success) return <VerifyEmail email={formData.email} />;

  return (
    <div className="flex justify-center items-center h-screen bg-background">
      <Card className="w-full max-w-md p-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Register</CardTitle>
          <CardDescription>
            Create your account today.{" "}
            <Link href="/login" className="underline" prefetch={false}>
              Already have an account? Login
            </Link>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name Of Hospital</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                minLength={4}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter a password"
                value={formData.password}
                onChange={handleChange}
                minLength={5}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                minLength={5}
                required
              />
            </div>
            {error && <p className="text-red-500">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className={`w-full ${loading ? "bg-blue-500" : "bg-primary"} flex justify-center items-center`}
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
                "Register"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
