"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { Expand } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import api from "../axios/axiosConfig";

export default function UserTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("fullName");
  const [sortDirection, setSortDirection] = useState("asc");
  const [users, setUsers] = useState([]);
  const [hospitalId, setHospitalId] = useState(null);

  useEffect(() => {
    const fetchHospitalId = () => {
      const id = localStorage.getItem("_id");
      if (id) {
        setHospitalId(id);
      }
    };
    fetchHospitalId();
  }, []);

  useEffect(() => {
    if (!hospitalId) return;

    const fetchUsers = async () => {
      try {
        const response = await api.get(
          `${process.env.NEXT_PUBLIC_BACKEND_ENDPOINT}/api/user/hospital/${hospitalId}/users`,
        );
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, [hospitalId]);

  const filteredUsers = useMemo(() => {
    return users
      .filter((user) =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return sortDirection === "asc" ? -1 : 1;
        if (a[sortBy] > b[sortBy]) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [searchTerm, sortBy, sortDirection, users]);

  return (
    <Card className=" shadow-lg col-start-2 col-span-4">
      <div className="p-4 ">
        <div className="mb-4 flex items-center justify-between">
          <Input
            className="w-full max-w-xs"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex items-center">
            <Link href="user/table">
              <Button variant="ghost" className="ml-4">
                Expand Table
                <Expand className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="user/create">
              <Button variant="ghost" className="ml-4">
                Add User
                <PlusIcon className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="relative">
          <Table className="min-w-full text-left">
            <TableHeader className="sticky top-0">
              <TableRow>
                {[
                  "fullName",
                  "dateOfBirth",
                  "gender",
                  "phoneNumber",
                  "email",
                ].map((header) => (
                  <TableHead
                    key={header}
                    className="cursor-pointer p-4"
                    onClick={() => {
                      setSortBy(header);
                      setSortDirection(
                        sortDirection === "asc" ? "desc" : "asc",
                      );
                    }}
                  >
                    {header.charAt(0).toUpperCase() + header.slice(1)}
                    {sortBy === header && (
                      <span className="ml-2 text-gray-600">
                        {sortDirection === "asc" ? "\u2191" : "\u2193"}
                      </span>
                    )}
                  </TableHead>
                ))}
                <TableHead className="p-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.slice(0, 4).map((user) => (
                <TableRow key={user.id} className="">
                  <TableCell className="p-4 font-medium">
                    {user.fullName}
                  </TableCell>
                  <TableCell className="p-4">
                    {new Date(user.dateOfBirth).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="p-4">{user.gender}</TableCell>
                  <TableCell className="p-4">{user.phoneNumber}</TableCell>
                  <TableCell className="p-4">{user.email}</TableCell>
                  <TableCell className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoveVerticalIcon className="h-4 w-4" />
                          <span className="sr-only">More actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`user/edit/${user._id}`}>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                        </Link>
                        <Link href={`user/${user._id}`}>
                          <DropdownMenuItem>Detail</DropdownMenuItem>
                        </Link>
                        <Link href={`user/delete/${user._id}`}>
                          <DropdownMenuItem className="text-red-500">
                            Delete
                          </DropdownMenuItem>
                        </Link>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
}

function PlusIcon(props) {
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function MoveVerticalIcon(props) {
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
      <polyline points="8 18 12 22 16 18" />
      <polyline points="8 6 12 2 16 6" />
      <line x1="12" x2="12" y1="2" y2="22" />
    </svg>
  );
}
