"use client"
import React from 'react'
import ContainerLayout from '../components/ContainerLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Users, Package, DollarSign } from 'lucide-react' // Assuming you use lucide-react for icons
import { useAuth } from '../auth/auth-context'
import { AuthProvider } from '../auth/auth-context'
import { useContext } from 'react'
import { ThemeProvider } from '../components/theme-provider'

export default function DashBoardHome() {
  const {hospitalData} = useAuth()
  return (
        <main className="flex-1 overflow-auto p-6">
          <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Users Card */}
            <Card className="p-4">
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Total Users</CardTitle>
                <Users className="text-gray-400" size={24} />
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-semibold">{hospitalData?.users?.length || 0}</p>
                <Badge variant="outline" className="mt-2">Updated Today</Badge>
              </CardContent>
            </Card>

            {/* Total Drug Inventory */}
            <Card className="p-4">
                {/* filter in stock */}
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Total Drug Inventory</CardTitle>
                <Package className="text-gray-400" size={24} />
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-semibold">{hospitalData?.medication?.length || 0} </p>
                <Badge variant="outline" className="mt-2">In Stock</Badge>
              </CardContent>
            </Card>

            {/* Sales */}
            {/* <Card className="p-4">
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Total Sales</CardTitle>
                <DollarSign className="text-gray-400" size={24} />
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-semibold">$12,345</p>
                <Badge variant="outline" className="mt-2">This Month</Badge>
              </CardContent>
            </Card> */}

            {/* Performance Metrics */}
            {/* <Card className="p-4">
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Performance</CardTitle>
                <BarChart className="text-gray-400" size={24} />
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-semibold">85%</p>
                <Badge variant="outline" className="mt-2">System Efficiency</Badge>
              </CardContent>
            </Card> */}
          </div>

          {/* Detailed Section */}
          <div className="grid gap-6 mt-8">
            {/* User Activity */}
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Details about user activity...</p>
                {/* You can add charts or other details here */}
              </CardContent>
            </Card>

            {/* Inventory Updates */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Recent changes in the drug inventory...</p>
                {/* You can add tables, lists, or other data here */}
              </CardContent>
            </Card>
          </div>
        </main>
  )
}
