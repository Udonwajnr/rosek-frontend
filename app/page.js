"use client"
import Link from "next/link";
import {useState,useEffect} from "react"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from 'lucide-react';
import axios from "axios";

export default function InventoryLandingPage() {
  const [active,setActive] = useState(null)
  const [fakeError,setFakeError] = useState(null)
  useEffect(()=>{
    const accessToken = localStorage.getItem('accessToken');
     setActive(accessToken) 
    axios.get('https://medical-api-advo.onrender.com')
     .then((data)=>console.log("welcome"))
     .catch((err)=>console.log(""))
  },[])
  return (
    <>
      <div className="flex flex-col min-h-screen bg-gradient-to-r from-blue-100 via-green-100 to-blue-50">
        <header className=" lg:px-28 h-14 flex items-center bg-blue-600 text-white shadow-md " >
          <Link href="/" className="flex items-center justify-center" prefetch={false}>
            <PillIcon className="h-6 w-6" />
            <span className="ml-2 font-bold">Pharma Inventory</span>
          </Link>
          <nav className="hidden ml-auto sm:flex gap-4 sm:gap-6">
            <Link href="/" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
              Home
            </Link>
            {/* <Link href="/about" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
              About
            </Link> */}
            {
              !active? 
              <>
                <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
                  Login
                </Link>
                <Link href="/register" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
                  Register
                </Link>  
              </>
              :
              <>
                <Link href={"/dashboard"} className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
                  Go To dashboard
                </Link>
              </>
            }
          </nav>
          <div className="ml-auto sm:hidden">
            <Sheet>
              <SheetTrigger>
                <Menu />
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                  {/* <SheetDescription>Select a page to navigate</SheetDescription> */}
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-6">
                  <Link href="/" className="text-sm font-medium hover:underline underline-offset-4">
                    Home
                  </Link>
                  {
              !active? 
              <>
                <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
                  Login
                </Link>
                <Link href="/register" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
                  Register
                </Link>  
              </>
              :
              <>
                <Link href={"/dashboard"} className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
                  Go To dashboard
                </Link>
              </>
            }
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="flex-1">
          {/* Hero Section */}
          <section className="w-full  py-10">
            <div className="flex flex-col md:flex-row items-center justify-around px-4 relative">
              <div className="text-center md:text-left">
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                  Buy, Purchase, and Get <br /> Drugs with Automatic <br />{" "}
                  <span className="text-blue-600">Dosage Reminders</span>
                </h2>
                <p className="font-bold my-6">
                  PERSONAL INFORMATION // MEDICAL <br /> INFORMATION // PRESCRIPTION VERIFICATION
                </p>
                {/* <div className="flex flex-col my-3 gap-2 w-48 mx-auto md:mx-0">
                  <Link href="/" className="bg-blue-600 px-4 py-2 text-white rounded-full text-center">
                    Customer View
                  </Link>
                  <Link href="/" className="bg-blue-600 px-4 py-2 text-white rounded-full text-center">
                    Admin View
                  </Link>
                </div> */}
              </div>

              <div className="relative  md:mt-0">
                <img src="img.png" alt="Doctor" className="w-full max-w-[950px] mx-auto" />
                <div className="absolute shadow-xl top-64  lg:-left-16 bg-white rounded-xl px-3 py-3">
                  <p className="text-center text-[10px] lg:text-lg">The number one service that <br /> renders quick healthcare in Nigeria</p>
                </div>
                <div className="absolute top-48 right-8 lg:-right-6 bg-white px-3 py-3 rounded-xl shadow-lg">
                  <p className="text-center text-[10px] lg:text-lg">You don't have to <br /> forget taking <br /> that medication <br /> because we're here <br /> to remind you</p>
                </div>
                <div className="absolute inset-0 w-[80%] h-[70%] bg-blue-300 rounded-xl -z-10 top-12 left-8"></div>
              </div>
            </div>

            <div className="flex justify-between bg-blue-600 text-white py-6 lg:px-28 mt-12">
              <div className="text-center">
                <p className="text-lg lg:text-4xl">100,000</p>
                <span className="text-sm">Total Users</span>
              </div>
              <div className="text-center">
                <p className="text-lg lg:text-4xl">500</p>
                <span className="text-sm">Listed Drugs</span>
              </div>
              <div className="text-center">
                <p className="text-lg lg:text-4xl">20%</p>
                <span className="text-sm">Sales Increase</span>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="w-full py-12 md:py-24 lg:py-32 bg-blue-50">
            <div className="container px-4 md:px-6">
              <div className="text-center">
                <div className="inline-block rounded-lg bg-blue-200 px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-extrabold tracking-tight text-blue-800 sm:text-4xl mt-2">
                  Powerful Capabilities for Your Pharmacy
                </h2>
                <p className="max-w-xl mx-auto text-lg text-gray-700 md:text-xl">
                  Our drug inventory system offers a comprehensive suite of features to streamline your pharmaceutical
                  operations.
                </p>
              </div>
              <div className="mt-12 grid lg:grid-cols-2 gap-12">
                <ul className="space-y-6">
                  <li>
                    <h3 className="text-xl font-bold text-blue-700">Real-Time Tracking</h3>
                    <p className="text-gray-600">
                      Monitor your drug inventory in real-time, with instant updates on stock levels and expiration dates.
                    </p>
                  </li>
                  <li>
                    <h3 className="text-xl font-bold text-blue-700">Automated Reporting</h3>
                    <p className="text-gray-600">
                      Generate comprehensive reports on your drug inventory, including usage trends and order history.
                    </p>
                  </li>
                  <li>
                    <h3 className="text-xl font-bold text-blue-700">Secure Data Storage</h3>
                    <p className="text-gray-600">
                      Keep your pharmaceutical data safe and secure with our encrypted storage and backup solutions.
                    </p>
                  </li>
                </ul>
                <img
                  src="img1.png"
                  alt="Secure Data Storage"
                  className=" "
                />
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <div className="text-center">
                <div className="inline-block rounded-lg bg-green-200 px-3 py-1 text-sm">Testimonials</div>
                <h2 className="text-3xl font-extrabold tracking-tight text-green-800 sm:text-4xl mt-2">
                  What Our Customers Say
                </h2>
                <p className="max-w-xl mx-auto text-lg text-gray-700 md:text-xl">
                  Hear from the pharmacists and healthcare professionals who have transformed their operations with our
                  drug inventory system.
                </p>
              </div>
              <div className="mt-12 grid lg:grid-cols-2 gap-12">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <blockquote>
                    <p className="text-gray-700">
                      "The real-time tracking and automated reporting features of this system have been a game-changer
                      for our pharmacy."
                    </p>
                    <cite className="text-sm font-medium text-green-600">- Dr. Sarah Lim, Pharmacist</cite>
                  </blockquote>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <blockquote>
                    <p className="text-gray-700">
                      "We love how secure and reliable this inventory system is. It has given us peace of mind knowing our
                      data is safe."
                    </p>
                    <cite className="text-sm font-medium text-green-600">- Michael Lee, Healthcare Administrator</cite>
                  </blockquote>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="py-4 px-6 bg-blue-700 text-white text-center">
          <p>&copy; {new Date().getFullYear()} . All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}

function PillIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l9-9m0 0a5.64 5.64 0 11-8-8l-9 9a5.64 5.64 0 108 8z" />
    </svg>
  );
}
