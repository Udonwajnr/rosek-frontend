"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useAuth } from "@/app/auth/auth-context";
import { MoveVerticalIcon } from "lucide-react";

export default function FullInventoryTable() {
  const { hospitalData } = useAuth();
  const medications = hospitalData?.medication;
  const [sortBy, setSortBy] = useState("name");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // You can change the value for items per page

  const filteredMedications = useMemo(() => {
    return medications
      ?.filter((medication) =>
        medication.nameOfDrugs.toLowerCase().includes(searchTerm.toLowerCase())
      )
      ?.sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return sortDirection === "asc" ? -1 : 1;
        if (a[sortBy] > b[sortBy]) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [searchTerm, sortBy, sortDirection, medications]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMedications = filteredMedications?.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredMedications?.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <Card className="shadow-lg">
      <div className="p-4 ">
        <div className="mb-4 flex items-center justify-between">
          <Input
            className="w-full max-w-xs"
            placeholder="Search medications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative overflow-auto">
          <Table className="min-w-full text-left">
            <TableHeader className="sticky top-0 ">
              <TableRow>
                {["name", "dosage", "price", "frequency", "in stock","action"].map(
                  (header) => (
                    <TableHead
                      key={header}
                      className="cursor-pointer p-4"
                      onClick={() => {
                        setSortBy(header);
                        setSortDirection(
                          sortDirection === "asc" ? "desc" : "asc"
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
                  )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentMedications?.map((medication) => {
                const status =
                  medication.quantityInStock === 0
                    ? "Out of Stock"
                    : medication.quantityInStock < medication.reorderLevel
                    ? "Low Stock"
                    : medication.inStock
                    ? "In Stock"
                    : "Out of Stock";

                const statusVariant =
                  status === "In Stock"
                    ? "secondary"
                    : status === "Low Stock"
                    ? "warning"
                    : "destructive";

                return (
                  <TableRow key={medication.id} className="hover:bg-gray-100">
                    <TableCell className="p-4 font-medium">
                      <Link
                        href={`/dashboard/inventory/${medication._id}`}
                      >
                        {medication.nameOfDrugs}
                      </Link>
                    </TableCell>
                    <TableCell className="p-4">{medication.dosage}</TableCell>
                    <TableCell className="p-4">
                      ${medication.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="p-4">
                      {medication.frequency.value + ""+ medication.frequency.unit}
                    </TableCell>
                    <TableCell className="p-4">
                      <Badge variant={statusVariant}>{status}</Badge>
                    </TableCell>
                    <TableCell className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoveVerticalIcon className="h-4 w-4" />
                            <span className="sr-only">More actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link
                            href={`/dashboard/inventory/edit/${medication._id}`}
                          >
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                          </Link>
                          <Link href={`/dashboard/inventory/${medication._id}`}>
                            <DropdownMenuItem>
                              Details
                            </DropdownMenuItem>
                          </Link>
                          <Link
                            href={`/dashboard/inventory/${medication._id}/delete`}
                          >
                            <DropdownMenuItem className="text-red-500">
                              Delete
                            </DropdownMenuItem>
                          </Link>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between p-4">
          <div className="text-sm text-muted-foreground">
            Showing {indexOfFirstItem + 1} to {indexOfLastItem} of{" "}
            {filteredMedications?.length} medications
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1)?.map(
                (pageNumber) => (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      onClick={() => handlePageChange(pageNumber)}
                      isActive={pageNumber === currentPage}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </Card>
  );
}

function SearchIcon(props) {
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
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}