"use client"

import React, { useState, useEffect, useRef } from "react";
import { Booking } from "@/entities/Booking";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Phone, 
  Car, 
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { createPageUrl } from "@/utils";
import { useBookingWS } from "@/hooks/useBookingWS";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [currentUser, userBookings] = await Promise.all([
        User.me(),
        Booking.filter({ created_by: (await User.me()).email }, "-created_date")
      ]);
      setUser(currentUser);
      setBookings(userBookings);
    } catch (error) {
      setError("Unable to load your bookings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await Booking.update(bookingId, { status: "cancelled" });
      loadData();
    } catch (error) {
      setError("Unable to cancel booking. Please contact support.");
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filterBookings = (status) => {
    if (status === 'active') {
      return bookings.filter(b => !['completed', 'cancelled'].includes(b.status));
    }
    if (status === 'completed') {
      return bookings.filter(b => b.status === 'completed');
    }
    if (status === 'cancelled') {
      return bookings.filter(b => b.status === 'cancelled');
    }
    return bookings;
  };

  const BookingCard = ({ booking }) => {
    const canCancel = ['pending', 'confirmed'].includes(booking.status);
    const isActive = !['completed', 'cancelled'].includes(booking.status);

    return (
      <Card className="card-hover">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                {booking.scheduled_date ? format(new Date(booking.scheduled_date), "EEEE, MMM d") : "No Date"}
              </CardTitle>
              <p className="text-gray-500 text-sm mt-1">
                {booking.scheduled_time} • {booking.assistance_type.replace('_', ' ')}
              </p>
            </div>
            <Badge className={getStatusColor(booking.status)}>
              {getStatusIcon(booking.status)}
              <span className="ml-1 capitalize">{booking.status.replace('_', ' ')}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">From:</p>
                <p className="text-gray-600">{booking.pickup_address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">To:</p>
                <p className="text-gray-600">{booking.dropoff_address}</p>
              </div>
            </div>
          </div>

          {booking.driver_name && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="font-medium text-blue-900">Driver: {booking.driver_name}</p>
              {booking.driver_phone && (
                <div className="flex items-center gap-1 text-blue-700 text-sm mt-1">
                  <Phone className="w-3 h-3" />
                  <span>{booking.driver_phone}</span>
                </div>
              )}
              {booking.vehicle_info && (
                <p className="text-blue-600 text-sm">{booking.vehicle_info}</p>
              )}
            </div>
          )}

          {booking.special_instructions && (
            <div className="text-sm">
              <p className="font-medium text-gray-900">Special Instructions:</p>
              <p className="text-gray-600">{booking.special_instructions}</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <CreditCard className="w-4 h-4" />
              <span>${booking.final_cost || booking.estimated_cost}</span>
              <Badge variant="outline" className="ml-2">
                {booking.payment_status === 'paid' ? 'Paid' : 'Pending Payment'}
              </Badge>
            </div>
            
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCancelBooking(booking._id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  useBookingWS({
    onCreated: (b) => setBookings((prev) => [b, ...prev]),
   onUpdated: (b) =>
  setBookings((prev) =>
    prev.map((x) =>
      (x._id === b._id || x._id === b._id) ? b : x
    )
  ),

    onDeleted: (b) =>
      setBookings((prev) =>
        prev.filter((x) => x._id !== b._id)
      ),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen medical-gradient p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-600">Manage your medical transportation</p>
          </div>
          <Link href={createPageUrl("BookRide")}>

            <Button className="bg-blue-600 hover:bg-blue-700">
              <Car className="w-4 h-4 mr-2" />
              Book New Ride
            </Button>
          </Link>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="all">All Bookings ({bookings.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({filterBookings('active').length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({filterBookings('completed').length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({filterBookings('cancelled').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {bookings.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
                  <p className="text-gray-600 mb-6">Book your first medical transportation ride</p>
                  <Link href={createPageUrl("BookRide")}>

                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Book Your First Ride
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {bookings.map((booking) => (
                  <BookingCard key={booking._id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <div className="grid gap-4">
              {filterBookings('active').map((booking) => (
                <BookingCard key={booking._id} booking={booking} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="grid gap-4">
              {filterBookings('completed').map((booking) => (
                <BookingCard key={booking._id} booking={booking} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            <div className="grid gap-4">
              {filterBookings('cancelled').map((booking) => (
                <BookingCard key={booking._id} booking={booking} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
