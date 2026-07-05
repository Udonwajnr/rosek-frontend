"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  Moon,
  Sun,
  Twitter,
} from "lucide-react";
import { useAuth } from "@/app/auth/auth-context";
import api from "@/app/axios/axiosConfig";
import { toast } from "sonner";
import { Bars } from "react-loader-spinner";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SettingsPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { hospitalData } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    operatingHours: "",
    socialMedia: { facebook: "", twitter: "", instagram: "" },
  });
  const [loading, setLoading] = useState(false);
  const [hospitalId, setHospitalId] = useState("");
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const { setTheme } = useTheme();

  useEffect(() => {
    const getHospital = async () => {
      const hospital = localStorage.getItem("_id");
      await api
        .get(`http://localhost:8000/api/hospital/${hospital}`)
        .then((response) => {
          setFormData(response.data);
          setHospitalId(hospital);
        })
        .catch((err) => console.log(err));
    };
    getHospital();
  }, []);
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Here you would typically update your app's theme
    // For example: document.documentElement.classList.toggle('dark')
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes("socialMedia")) {
      const socialField = name.split(".")[1];
      setFormData((prevData) => ({
        ...prevData,
        socialMedia: { ...prevData.socialMedia, [socialField]: value },
      }));
    } else {
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Hospital name cannot be empty.";
      toast.error("Hospital name cannot be empty.");
    }
    // if (!formData.phone.trim()) errors.phone = "Phone number cannot be empty."
    // if (!formData.email.trim()) errors.email = "Email cannot be empty."
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError("");
    try {
      await api
        .put(`http://localhost:8000/api/hospital/${hospitalId}`, formData)
        .then((data) => {
          toast.success("Updated Successfully");
        });
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
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="email">Email Setup</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>
                Update your company's basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Hospital Name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  name="address"
                  id="address"
                  placeholder="Enter company address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phone"
                  placeholder="Enter phone number"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operating Hours</CardTitle>
              <CardDescription>
                Set your company's operating hours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="openTime">Opening Time</Label>
                  <Input id="openTime" type="time" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closeTime">Closing Time</Label>
                  <Input id="closeTime" type="time" />
                </div>
              </div> */}
              <div className="space-y-2">
                <Label htmlFor="operatingDays">Operating Days</Label>
                <Input
                  id="operatingHours"
                  name="operatingHours"
                  placeholder="e.g., Monday - Friday, 9AM - 5PM"
                  value={formData?.operatingHours}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
              <CardDescription>Add your social media links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Facebook className="w-5 h-5" />
                <Input
                  name="socialMedia.facebook"
                  placeholder="Facebook URL"
                  value={formData.socialMedia?.facebook}
                  onChange={handleChange}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Twitter className="w-5 h-5" />
                <Input
                  name="socialMedia.twitter"
                  placeholder="Twitter URL"
                  value={formData.socialMedia?.twitter}
                  onChange={handleChange}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Instagram className="w-5 h-5" />
                <Input
                  name="socialMedia.instagram"
                  placeholder="Instagram URL"
                  value={formData.socialMedia?.instagram}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look of your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="darkMode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle between light and dark themes
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      <span className="sr-only">Toggle theme</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
                      System
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Set up your email server settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="smtpServer">SMTP Server</Label>
                <Input id="smtpServer" placeholder="e.g., smtp.gmail.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input id="smtpPort" placeholder="e.g., 587" type="number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailUsername">Email Username</Label>
                <Input
                  id="emailUsername"
                  placeholder="Enter email username"
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailPassword">Email Password</Label>
                <Input
                  id="emailPassword"
                  placeholder="Enter email password"
                  type="password"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="useSSL" />
                <Label htmlFor="useSSL">Use SSL/TLS</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Manage your email templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="welcomeEmail">Welcome Email</Label>
                <Textarea
                  id="welcomeEmail"
                  placeholder="Enter welcome email template"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderConfirmation">Order Confirmation</Label>
                <Textarea
                  id="orderConfirmation"
                  placeholder="Enter order confirmation email template"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end" onClick={handleSubmit}>
        <Button disabled={loading}>
          {loading ? (
            <Bars color="#ffffff" height={24} width={24} />
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
