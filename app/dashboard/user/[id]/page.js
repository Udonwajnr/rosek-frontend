"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  MailIcon,
  PhoneIcon,
  PillIcon,
  HospitalIcon,
  ShoppingCartIcon,
  ClockIcon,
} from "lucide-react";
import api from "@/app/axios/axiosConfig";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function UserDetails() {
  const { id } = useParams(); // Get the user ID from the URL
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserDetails = async () => {
      const hospitalId = localStorage.getItem("_id"); // Get hospital ID from local storage

      if (!hospitalId || !id) {
        setError("Invalid User ID or Hospital ID. Redirecting...");
        setTimeout(() => {
          router.push("/dashboard/inventory");
        }, 2000);
        return;
      }

      try {
        const response = await api.get(
          `https://medical-api-advo.onrender.com/api/user/hospital/${hospitalId}/users/${id}`
        );
        setUser(response.data);
      } catch (err) {
        setError("Failed to fetch user details.");
        setTimeout(() => {
          router.push("/dashboard/inventory");
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [id, router]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="container mx-auto p-4 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow rounded-lg p-6 flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage
            src="/placeholder.svg?height=80&width=80"
            alt={user?.fullName}
          />
          <AvatarFallback>
            {user?.fullName?.split(" ").map((n) => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{user?.fullName}</h1>
          <p className="text-gray-500">User Details</p>
        </div>
      </header>
      {/* Personal Information */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-primary">
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="text-primary" />
              <span className="font-medium">Date of Birth:</span>
              <span>{new Date(user?.dateOfBirth).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{user?.gender}</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <MailIcon className="text-primary" />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <PhoneIcon className="text-primary" />
              <span>{user?.phoneNumber}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Medications */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-primary">
            Current Medications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user?.medications?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.medications.filter((medications)=>medications.current=== true).map((med, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{med.medication.nameOfDrugs}</TableCell>
                    <TableCell>{med.quantity}</TableCell>
                    <TableCell>{med.startDate}</TableCell>
                    <TableCell>{med.endDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>No current medication assigned</p>
          )}
        </CardContent>
      </Card>

      {/* Past Medications */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-primary">
            Past Medications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user?.medications?.filter((medications)=>medications.current=== false).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.medications.map((med, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{med.medication.nameOfDrugs}</TableCell>
                    <TableCell>{med.quantity}</TableCell>
                    <TableCell>{med.startDate}</TableCell>
                    <TableCell>{med.endDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>No past medication assigned</p>
          )}
        </CardContent>
      </Card>

      {/* Purchase History */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-primary">
            Purchase History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user?.purchases?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {user.purchases?.map((purchase, index) => (
  <TableRow key={index}>
    <TableCell>{new Date(purchase.createdAt).toISOString().slice(0, 10)}</TableCell>
    <TableCell>
      {purchase.medications.map((med, medIndex) => (
        <div key={med._id}>
          <span className="font-medium">Medication {medIndex + 1}: {med.medication.nameOfDrugs}</span>
          <div>
            Quantity: <Badge variant="secondary">{med.quantity}</Badge>
          </div>
          <div>
            Start Time: {new Date(med.startTime).toLocaleString()}
          </div>
        </div>
      ))}
    </TableCell>
    <TableCell>
      Total Purchase: <Badge variant="secondary">{purchase.totalPurchase}</Badge>
    </TableCell>
  </TableRow>
))}

              </TableBody>
            </Table>
          ) : (
            <p>No purchase history available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
