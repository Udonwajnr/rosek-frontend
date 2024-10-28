"use client";

import { useState, useMemo } from "react";
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
import { Expand} from "lucide-react";
import Link from "next/link";

export default function DrugInventoryTable({ hospitalData }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("nameOfDrugs");
  const [sortDirection, setSortDirection] = useState("asc");
  const formattedPrice = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  });
  const filteredInventory = useMemo(() => {
    return hospitalData?.filter((item) =>
        item.nameOfDrugs.toLowerCase().includes(searchTerm.toLowerCase())
      )
      ?.sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return sortDirection === "asc" ? -1 : 1;
        if (a[sortBy] > b[sortBy]) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [searchTerm, sortBy, sortDirection, hospitalData]);

  return (
    <Card className=" shadow-lg col-start-2 col-span-4">
      <div className="p-4 ">
        <div className="mb-4 flex items-center justify-between">
          <Input
            className="w-full max-w-xs"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex items-center">
            <Link href="/dashboard/inventory/table">
              <Button variant="ghost" className="ml-4">
                Full Table
                <Expand className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/inventory/create">
              <Button variant="ghost" className="ml-4">
                Add Product
                <PlusIcon className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="relative ">
          <Table className="min-w-full text-left">
            <TableHeader className="sticky top-0 ">
              <TableRow>
                {["nameOfDrugs", "quantityInStock", "price", "expiryDate"].map(
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
                <TableHead className="p-4">Status</TableHead>
                <TableHead className="p-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory?.slice(0,4).map((item) => {
                const status =
                  item.quantityInStock === 0
                    ? "Out of Stock"
                    : item.quantityInStock < item.reorderLevel
                    ? "Low Stock"
                    : item.inStock
                    ? "In Stock"
                    : "Out of Stock";

                const statusVariant =
                  status === "In Stock"
                    ? "secondary"
                    : status === "Low Stock"
                    ? "warning"
                    : "destructive";

                return (
                  <TableRow key={item._id}>
                    <TableCell className="p-4 font-medium">
                      {item.nameOfDrugs}
                    </TableCell>
                    <TableCell className="p-4">{item.quantityInStock}</TableCell>
                    <TableCell className="p-4">
                      {formattedPrice.format(item.price)}
                      {/* {item.price.toFixed(2)} */}
                    </TableCell>
                    <TableCell className="p-4">
                      {new Date(item.expiryDate).toLocaleDateString()}
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
                          <Link href={`/dashboard/inventory/edit/${item._id}`}>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                          </Link>
                          <Link href={`/dashboard/inventory/${item._id}`}>
                            <DropdownMenuItem >
                              Details
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/dashboard/inventory/${item._id}/delete`}>
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
      </div>
      
    </Card>
  );
}

function PlusIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}

function MoveVerticalIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 18 12 22 16 18" />
      <polyline points="8 6 12 2 16 6" />
      <line x1="12" x2="12" y1="2" y2="22" />
    </svg>
  )
}


function ExpandIcon(props) {
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
      <path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8" />
      <path d="M3 16.2V21m0 0h4.8M3 21l6-6" />
      <path d="M21 7.8V3m0 0h-4.8M21 3l-6 6" />
      <path d="M3 7.8V3m0 0h4.8M3 3l6 6" />
    </svg>
  )
}

