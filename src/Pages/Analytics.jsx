"use client"

import React, { useState, useEffect } from "react";
import { Booking } from "@/entities/Booking";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp,
  TrendingDown,
  Calendar,
  Car,
  DollarSign,
  Clock,
  MapPin,
  Users
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

export default function Analytics() {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState("month");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [currentUser, allBookings] = await Promise.all([
        User.me(),
        Booking.list("-created_date")
      ]);
      
      if (currentUser.role !== 'admin') {
        setError("Access denied. Admin privileges required.");
        return;
      }
      
      setUser(currentUser);
      setBookings(allBookings);
    } catch (error) {
      setError("Unable to load analytics data.");
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredBookings = () => {
    const now = new Date();
    let startDate;
    
    switch (dateRange) {
      case "week":
        startDate = subDays(now, 7);
        break;
      case "month":
        startDate = startOfMonth(now);
        break;
      case "quarter":
        startDate = subDays(now, 90);
        break;
      default:
        return bookings;
    }
    
    return bookings.filter(booking => 
      new Date(booking.created_date) >= startDate
    );
  };

  const calculateMetrics = () => {
    const filteredBookings = getFilteredBookings();
    const completed = filteredBookings.filter(b => b.status === 'completed');
    const cancelled = filteredBookings.filter(b => b.status === 'cancelled');
    
    const totalRevenue = completed.reduce((sum, b) => sum + (b.final_cost || b.estimated_cost || 0), 0);
    const avgRideValue = completed.length > 0 ? totalRevenue / completed.length : 0;
    const completionRate = filteredBookings.length > 0 ? (completed.length / filteredBookings.length * 100) : 0;
    const cancellationRate = filteredBookings.length > 0 ? (cancelled.length / filteredBookings.length * 100) : 0;
    
    return {
      totalBookings: filteredBookings.length,
      completedRides: completed.length,
      totalRevenue,
      avgRideValue,
      completionRate,
      cancellationRate
    };
  };

  const getTopLocations = () => {
    const locationCounts = {};
    
    bookings.forEach(booking => {
      if (booking.pickup_address) {
        const location = booking.pickup_address.split(',')[0]; // Get first part of address
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      }
    });
    
    return Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const getAssistanceTypeStats = () => {
    const assistanceTypes = {};
    
    bookings.forEach(booking => {
      if (booking.assistance_type) {
        assistanceTypes[booking.assistance_type] = (assistanceTypes[booking.assistance_type] || 0) + 1;
      }
    });
    
    return assistanceTypes;
  };

  const metrics = calculateMetrics();
  const topLocations = getTopLocations();
  const assistanceStats = getAssistanceTypeStats();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen medical-gradient p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Business insights and performance metrics</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                      <p className="text-2xl font-bold text-gray-900">{metrics.totalBookings}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">12% from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Completed Rides</p>
                      <p className="text-2xl font-bold text-green-600">{metrics.completedRides}</p>
                    </div>
                    <Car className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="flex items-center mt-2">
                    <span className="text-sm text-gray-600">
                      {metrics.completionRate.toFixed(1)}% completion rate
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">${metrics.totalRevenue.toFixed(2)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">8% from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Avg Ride Value</p>
                      <p className="text-2xl font-bold text-blue-600">${metrics.avgRideValue.toFixed(2)}</p>
                    </div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold">$</span>
                    </div>
                  </div>
                  <div className="flex items-center mt-2">
                    <span className="text-sm text-gray-600">Per completed ride</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Overview */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle>Booking Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['pending', 'confirmed', 'completed', 'cancelled'].map((status) => {
                      const count = bookings.filter(b => b.status === status).length;
                      const percentage = bookings.length > 0 ? (count / bookings.length * 100).toFixed(1) : 0;
                      
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              status === 'completed' ? 'bg-green-500' :
                              status === 'cancelled' ? 'bg-red-500' :
                              status === 'confirmed' ? 'bg-blue-500' : 'bg-yellow-500'
                            }`} />
                            <span className="capitalize font-medium">{status.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{count}</span>
                            <span className="text-xs text-gray-500">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <CardTitle>Assistance Type Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(assistanceStats).map(([type, count]) => {
                      const percentage = bookings.length > 0 ? (count / bookings.length * 100).toFixed(1) : 0;
                      
                      return (
                        <div key={type} className="flex items-center justify-between">
                          <span className="capitalize font-medium">{type.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{count}</span>
                            <span className="text-xs text-gray-500">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Revenue Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="font-bold text-green-600">${metrics.totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average per Ride</span>
                    <span className="font-bold">${metrics.avgRideValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed Rides</span>
                    <span className="font-bold">{metrics.completedRides}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover lg:col-span-2">
                <CardHeader>
                  <CardTitle>Revenue by Assistance Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(assistanceStats).map(([type, count]) => {
                      const avgCost = type === 'wheelchair' ? 32.50 : type === 'stretcher' ? 45.00 : 25.00;
                      const revenue = count * avgCost;
                      
                      return (
                        <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium capitalize">{type.replace('_', ' ')}</span>
                            <p className="text-sm text-gray-600">{count} rides</p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-green-600">${revenue.toFixed(2)}</span>
                            <p className="text-sm text-gray-600">${avgCost.toFixed(2)}/ride</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Operational Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Completion Rate</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-green-600">{metrics.completionRate.toFixed(1)}%</span>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Cancellation Rate</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-600">{metrics.cancellationRate.toFixed(1)}%</span>
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Drivers</span>
                    <span className="font-bold">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Rating</span>
                    <span className="font-bold">4.9 ⭐</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bookings.slice(0, 5).map((booking, index) => (
                      <div key={booking.id} className="flex items-center gap-3 p-2 border-b last:border-b-0">
                        <div className={`w-2 h-2 rounded-full ${
                          booking.status === 'completed' ? 'bg-green-500' :
                          booking.status === 'cancelled' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {booking.pickup_address?.split(',')[0]}
                          </p>
                          <p className="text-xs text-gray-500">
                            {booking.created_date ? format(new Date(booking.created_date), 'MMM d, h:mm a') : "No Date"}
                          </p>
                        </div>
                        <span className="text-sm font-medium">
                          ${booking.final_cost || booking.estimated_cost}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Top Pickup Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topLocations.map(([location, count], index) => (
                    <div key={location} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{location}</p>
                        <p className="text-sm text-gray-600">{count} pickups</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{count}</span>
                        <p className="text-xs text-gray-500">
                          {((count / bookings.length) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
