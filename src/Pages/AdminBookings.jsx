"use client"

import React, { useState, useEffect, useCallback } from "react";
import { Booking } from "@/entities/Booking";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Car,
  Phone,
  MapPin,
  Clock,
  User as UserIcon,
  Edit,
  Save,
  X,
  Filter,
  Search,
  RefreshCw,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AdminBookingForm from "../components/admin/AdminBookingForm";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewBookingForm, setShowNewBookingForm] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [drivers, setDrivers] = useState([]);
  

  useEffect(() => {
    loadData();
    fetchDrivers();
  }, []);

  const filterBookings = useCallback(() => {
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.pickup_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.dropoff_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.created_by?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, statusFilter]);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter, filterBookings]);

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
      setError("Unable to load bookings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const driverList = await User.list();
      setDrivers(driverList.filter(user => user.role === "driver"));
    } catch (error) {
      console.error("Failed to fetch drivers", error);
    }
  };

  const handleCreateBooking = async (bookingData) => {
    setIsCreatingBooking(true);
    try {
      await Booking.create(bookingData);
      setShowNewBookingForm(false);
      loadData();
    } catch (error) {
      setError("Failed to create booking. Please try again.");
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const handleUpdateBooking = async (bookingId, updates) => {
    try {
      console.log("Updating booking:", bookingId, updates);
      await Booking.update(bookingId, updates);
      setEditingBooking(null);
      loadData();
    } catch (error) {
      setError("Failed to update booking. Please try again.");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      assigned: "bg-purple-100 text-purple-800",
      en_route: "bg-orange-100 text-orange-800",
      arrived: "bg-green-100 text-green-800",
      in_transit: "bg-indigo-100 text-indigo-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const BookingCard = ({ booking }) => {
    const isEditing = editingBooking?._id === booking._id;
    const [editData, setEditData] = useState(booking);

    const handleSave = () => {
  const { status, driver_email, driver_name, driver_phone, vehicle_info } = editData;
  handleUpdateBooking(booking._id, { status, driver_email, driver_name, driver_phone, vehicle_info });
};

    const handleCancel = () => {
      setEditingBooking(null);
      setEditData(booking);
    };

    return (
      <Card className="card-hover mb-4">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-semibold">
                  {booking.scheduled_date
                    ? format(new Date(booking.scheduled_date), "EEEE, MMM d, yyyy")
                    : "No Date"}
                </span>
                <span className="text-gray-500">at {booking.scheduled_time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <UserIcon className="w-4 h-4" />
                <span>{booking.guest_name || booking.created_by}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(booking.status)}>
                {booking.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingBooking(isEditing ? null : booking)}
              >
                {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Trip Details */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-start gap-2 mb-2">
                <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Pickup:</p>
                  <p className="text-sm text-gray-600">{booking.pickup_address}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Drop-off:</p>
                  <p className="text-sm text-gray-600">{booking.dropoff_address}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm"><strong>Assistance:</strong> {booking.assistance_type?.replace('_', ' ')}</p>
              <p className="text-sm"><strong>Passengers:</strong> {booking.passenger_count}</p>
              <p className="text-sm"><strong>Cost:</strong> ${booking.final_cost || booking.estimated_cost}</p>
            </div>
          </div>

          {booking.special_instructions && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-900 mb-1">Special Instructions:</p>
              <p className="text-sm text-gray-600">{booking.special_instructions}</p>
            </div>
          )}

          {/* Driver Assignment Section */}
          <div className="border-t pt-4">
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={editData.status} onValueChange={(value) => setEditData(prev => ({...prev, status: value}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="en_route">En Route</SelectItem>
                        <SelectItem value="arrived">Arrived</SelectItem>
                        <SelectItem value="in_transit">In Transit</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="driver_name">Driver Name</Label>
                    <Select
                      value={editData.driver_email || ""}
                      onValueChange={(value) => {
                        const selectedDriver = drivers.find(driver => driver.email === value);
                        setEditData(prev => ({
                          ...prev,
                          driver_email: selectedDriver.email,
                          driver_name: selectedDriver.full_name,
                          driver_phone: selectedDriver.phone
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a driver" />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers.map(driver => (
                          <SelectItem key={driver.email} value={driver.email}>
                            {driver.full_name} ({driver.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="driver_phone">Driver Phone</Label>
                    <Input
                      value={editData.driver_phone || ""}
                      onChange={(e) => setEditData(prev => ({...prev, driver_phone: e.target.value}))}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicle_info">Vehicle Info</Label>
                    <Input
                      value={editData.vehicle_info || ""}
                      onChange={(e) => setEditData(prev => ({...prev, vehicle_info: e.target.value}))}
                      placeholder="Vehicle details"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 p-3 rounded-lg">
                {booking.driver_name ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Driver: {booking.driver_name}</span>
                    </div>
                    {booking.driver_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-3 h-3 text-blue-600" />
                        <span className="text-blue-700">{booking.driver_phone}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-blue-700 italic">No driver assigned yet</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage all medical transportation bookings</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowNewBookingForm(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
            <Button onClick={loadData} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* New Booking Form */}
        {showNewBookingForm && (
          <AdminBookingForm
            onSubmit={handleCreateBooking}
            onCancel={() => setShowNewBookingForm(false)}
            isLoading={isCreatingBooking}
          />
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by address, driver, or patient email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="en_route">En Route</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {bookings.filter(b => b.status === 'pending').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {bookings.filter(b => ['confirmed', 'assigned', 'en_route', 'arrived', 'in_transit'].includes(b.status)).length}
                  </p>
                </div>
                <Car className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {bookings.filter(b => b.status === 'completed').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xl">✓</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'No transportation bookings have been made yet'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredBookings.map((booking) => (
              <BookingCard key={booking._id} booking={booking} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
