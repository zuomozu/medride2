"use client";

import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { auth } from "@/utils/auth";
import { Booking } from "@/entities/Booking";
import { User } from "@/entities/User";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Car,
  MapPin,
  Clock,
  Phone,
  User as UserIcon,
  Navigation,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DriverDashboard() {
  const socket = useRef(null);

  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [availableBookings, setAvailableBookings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationTracking, setLocationTracking] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    const token = auth.getToken();
    if (!token) return;

    socket.current = io(window.location.origin, {
      path: "/api/socket.io",
      auth: { token },
      transports: ["websocket"],
    });

    socket.current.on("connect", () => console.log("🔌 WS connected"));
    socket.current.on("disconnect", () => console.log("❌ WS disconnected"));

    return () => socket.current?.disconnect();
  }, []);

  // Load data (user + bookings)
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [currentUser, allBookings] = await Promise.all([
        User.me(),
        Booking.list("-created_date"),
      ]);

      if (currentUser.role !== "driver") {
        setError("Access denied. Driver privileges required.");
        return;
      }

      setUser(currentUser);

      const available = allBookings.filter(
        (b) => ["pending", "confirmed"].includes(b.status) && !b.driver_name
      );

      const mine = allBookings.filter(
        (b) =>
          b.driver_name === currentUser.full_name ||
          b.created_by === currentUser.email
      );

      setBookings(allBookings);
      setAvailableBookings(available);
      setMyBookings(mine);
    } catch (err) {
      setError("Unable to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);
  const getETA = async (driverLoc, dropoff) => {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${driverLoc.lng},${driverLoc.lat};${dropoff.lng},${dropoff.lat}?geometries=geojson&overview=simplified&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.routes && data.routes[0]) {
      return Math.round(data.routes[0].duration / 60); // ETA in minutes
    }
    return null;
  } catch (err) {
    console.error("ETA fetch failed", err);
    return null;
  }
};


  // Track driver location only after user & myBookings are ready
  useEffect(() => {
    if (!user) return;

    const updateLocation = async () => {
      if (!navigator.geolocation) {
        console.warn("Geolocation not supported");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocationTracking(true);

          // Find current active ride
          const activeBooking = myBookings.find(
            (b) => !["completed", "cancelled"].includes(b.status)
          );
          console.log("Active booking for location update:", activeBooking);

          if (activeBooking && socket.current) {
            const eta = await getETA(
        { lat: latitude, lng: longitude },
        activeBooking.pickup_coordinates
      );
            socket.current.emit("driver:location", {
              bookingId: activeBooking._id,
              location: { lat: latitude, lng: longitude },
              eta: eta, // TODO: replace with Mapbox ETA
              userEmail: activeBooking.created_by,
              driverEmail: user.email,
            });
            console.log("📍 Sent location update:", activeBooking._id, latitude, longitude, activeBooking.created_by, user.email)
            
          }
        },
        (err) => {
          console.error("Location error:", err);
          setLocationTracking(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    };

    updateLocation();
    const id = setInterval(updateLocation, 10000); // every 10 sec
    return () => clearInterval(id);
  }, [user, myBookings]);

  // Update ride handlers
  const handleAcceptRide = async (booking) => {
    try {
      await Booking.update(booking.id, {
        status: "assigned",
        driver_name: user.full_name,
        driver_phone: user.phone,
        vehicle_info: user.vehicle_type || "Medical Transport Vehicle",
      });

      await User.updateMyUserData({ driver_status: "on_duty" });
      loadData();
    } catch {
      setError("Failed to accept ride. Please try again.");
    }
  };

  const handleDeclineRide = async () => {
    loadData(); // simple refresh
  };

  const handleUpdateStatus = async (booking, newStatus) => {
    try {
      await Booking.update(booking._id, { status: newStatus,driver_name: user.full_name, driver_email: user.email, driver_phone:user.phone });
      loadData();
    } catch {
      setError("Failed to update ride status.");
    }
  };

  // Status badge colors
  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      assigned: "bg-purple-100 text-purple-800",
      en_route: "bg-orange-100 text-orange-800",
      arrived: "bg-green-100 text-green-800",
      in_transit: "bg-indigo-100 text-indigo-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // RideCard component
  const RideCard = ({ booking, showActions = false, isMyRide = false }) => (
    <Card className="card-hover mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              {booking.scheduled_date
                ? format(new Date(booking.scheduled_date), "EEEE, MMM d")
                : "No Date"}
            </CardTitle>
            <p className="text-gray-500 text-sm mt-1">
              {booking.scheduled_time} •{" "}
              {booking.assistance_type.replace("_", " ")}
            </p>
          </div>
          <Badge className={getStatusColor(booking.status)}>
            {booking.status.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Customer Info */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <UserIcon className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-900">
              {booking.guest_name || booking.created_by || "Patient"}
            </span>
          </div>
          {booking.guest_phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3 text-blue-600" />
              <span className="text-blue-700 text-sm">
                {booking.guest_phone}
              </span>
            </div>
          )}
        </div>

        {/* Trip Details */}
        <div className="space-y-3">
          <div className="flex items-start gap-2">
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

        {booking.special_instructions && (
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <p className="text-sm font-medium text-amber-900 mb-1">
              Special Instructions:
            </p>
            <p className="text-sm text-amber-700">
              {booking.special_instructions}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => handleAcceptRide(booking)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Accept Ride
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDeclineRide(booking)}
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Decline
            </Button>
          </div>
        )}

        {/* Status Update Buttons */}
        {isMyRide &&
          !["completed", "cancelled"].includes(booking.status) && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              {booking.status === "assigned" && (
                <Button
                  onClick={() => handleUpdateStatus(booking, "en_route")}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  En Route
                </Button>
              )}
              {booking.status === "en_route" && (
                <Button
                  onClick={() => handleUpdateStatus(booking, "arrived")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Arrived
                </Button>
              )}
              {booking.status === "arrived" && (
                <Button
                  onClick={() => handleUpdateStatus(booking, "in_transit")}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Car className="w-4 h-4 mr-2" />
                  In Transit
                </Button>
              )}
              {booking.status === "in_transit" && (
                <Button
                  onClick={() => handleUpdateStatus(booking, "completed")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete
                </Button>
              )}
            </div>
          )}
      </CardContent>
    </Card>
  );

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
            <h1 className="text-3xl font-bold text-gray-900">
              Driver Dashboard
            </h1>
            <p className="text-gray-600">Manage your rides and track earnings</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  locationTracking ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-sm text-gray-600">
                {locationTracking ? "Location Active" : "Location Disabled"}
              </span>
            </div>
            <Button onClick={loadData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Available Rides
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {availableBookings.length}
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
                  <p className="text-sm font-medium text-gray-500">
                    My Active Rides
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {
                      myBookings.filter(
                        (b) => !["completed", "cancelled"].includes(b.status)
                      ).length
                    }
                  </p>
                </div>
                <Navigation className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Completed Today
                  </p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {
                      myBookings.filter(
                        (b) =>
                          b.status === "completed" &&
                          b.scheduled_date?.slice(0, 10) ===
                            new Date().toISOString().slice(0, 10)
                      ).length
                    }
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">
                    {user?.driver_status || "Available"}
                  </p>
                </div>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    user?.driver_status === "on_duty"
                      ? "bg-green-100"
                      : "bg-gray-100"
                  }`}
                >
                  <span
                    className={
                      user?.driver_status === "on_duty"
                        ? "text-green-600"
                        : "text-gray-600"
                    }
                  >
                    ●
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="available" className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="available">
              Available Rides ({availableBookings.length})
            </TabsTrigger>
            <TabsTrigger value="my-rides">
              My Rides ({myBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {availableBookings.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Available Rides
                  </h3>
                  <p className="text-gray-600">
                    Check back later for new ride requests
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {availableBookings.map((b) => (
                  <RideCard key={b.id} booking={b} showActions />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-rides" className="space-y-4">
            {myBookings.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Navigation className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Assigned Rides
                  </h3>
                  <p className="text-gray-600">
                    Accept available rides to see them here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {myBookings.map((b) => (
                  <RideCard key={b.id} booking={b} isMyRide />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
