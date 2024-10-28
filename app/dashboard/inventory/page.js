"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "@/components/ui/card"
import DrugInventoryTable from "../../components/DrugInventoryTable"
import ContainerLayout from "@/app/components/ContainerLayout"
import { useAuth } from "@/app/auth/auth-context"
import { useState } from "react"
import { format } from "date-fns"

export default function InventoryDashboard() {
  const {hospitalData} = useAuth()
  const totalPrice = hospitalData?.medication?.reduce((total, medication) => {
    return total + (medication.price * medication.quantityInStock);
  }, 0) || 0;
   
  // Format the total price
  const formattedTotalPrice = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(totalPrice);

  const filterLowOnStocks = hospitalData?.medication?.filter((medication)=>medication?.quantityInStock<10).length
  
  const sortedMedications = hospitalData?.medication?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
      <>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Total Inventory</CardTitle>
                <CardDescription>
                  {/* filter in stock */}
                  <span className="text-4xl font-bold">{hospitalData?.medication?.filter(medication=>medication.inStock===true)?.length || 0}</span>
                  <span className="text-muted-foreground">Total items</span>
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline">View Inventory</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Total Value</CardTitle>
                <CardDescription>
                  <span className="text-4xl font-bold">{formattedTotalPrice}</span>
                  <span className="text-muted-foreground">Total value</span>
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline">View Reports</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Low Stock</CardTitle>
                <CardDescription>
                  <span className="text-4xl font-bold">{filterLowOnStocks || 0}</span>
                  <span className="text-muted-foreground">Items below minimum</span>
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline">View Alerts</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Add New Product</CardTitle>
                <CardDescription>
                  <span className="text-4xl font-bold">+</span>
                  <span className="text-muted-foreground">Add a new product to your inventory</span>
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Link  href="/dashboard/inventory/create">
                  <Button variant="outline">Add Product</Button>
                </Link>
              </CardFooter>
          </Card>
          <Card>
              <CardHeader className="pb-3">
                <CardTitle>Medication Table</CardTitle>
                <CardDescription>
                  {/* <span className="text-4xl font-bold">+</span> */}
                  <span className="text-muted-foreground">See All Your Medication </span>
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Link  href="/dashboard/inventory/table">
                  <Button variant="outline">See Medication Table</Button>
                </Link>
              </CardFooter>
          </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Recently Added Medication</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {sortedMedications?.slice(0,5).map((medication)=>{
                    return(
                      <div key={hospitalData._id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          
                          <div>
                            <div className="font-medium">{medication.nameOfDrugs}</div>
                            <div className="text-sm text-muted-foreground">{format(new Date(medication.createdAt), 'MMMM d, yyyy')}</div>
                          </div>
                        </div>
                        <Link href={`/dashboard/inventory/${medication._id}`}>
                          <Button size="icon" variant="ghost">
                            <ExpandIcon className="h-5 w-5" />
                          </Button>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline">View All</Button>
              </CardFooter>
            </Card>
            <DrugInventoryTable hospitalData={hospitalData?.medication}/>
          </div>
        </main>
      </>
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


function FilesIcon(props) {
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
      <path d="M20 7h-3a2 2 0 0 1-2-2V2" />
      <path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z" />
      <path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8" />
    </svg>
  )
}


function MenuIcon(props) {
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
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  )
}


function PillIcon(props) {
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
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <path d="m8.5 8.5 7 7" />
    </svg>
  )
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


function SettingsIcon(props) {
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
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}


function ShoppingBasketIcon(props) {
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
      <path d="m15 11-1 9" />
      <path d="m19 11-4-7" />
      <path d="M2 11h20" />
      <path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4" />
      <path d="M4.5 15.5h15" />
      <path d="m5 11 4-7" />
      <path d="m9 11 1 9" />
    </svg>
  )
}


function WarehouseIcon(props) {
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
      <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z" />
      <path d="M6 18h12" />
      <path d="M6 14h12" />
      <rect width="12" height="12" x="6" y="10" />
    </svg>
  )
}

 function MdiAccount(props) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4"></path></svg>
    )
  }

  
 function MdiDesktopMacDashboard(props) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M21 14V4H3v10h18m0-12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-7l2 3v1H8v-1l2-3H3a2 2 0 0 1-2-2V4c0-1.11.89-2 2-2h18M4 5h11v5H4V5m12 0h4v2h-4V5m4 3v5h-4V8h4M4 11h5v2H4v-2m6 0h5v2h-5v-2Z"></path></svg>
    )
  }