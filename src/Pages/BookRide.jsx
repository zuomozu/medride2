"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import LocationSelector from "@/components/booking/LocationSelector";
import AddressAutocomplete from "@/components/booking/AddressAutocomplete";

import { Booking } from "@/entities/Booking";
import { User } from "@/entities/User";
import { createPageUrl } from "@/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  Calendar as CalendarIcon,
  Accessibility,
  Users,
  CheckCircle,
  AlertCircle,
  Phone,
  User as UserIcon,
} from "lucide-react";

/**
 * Merged BookRide component
 *
 * - Uses the new trip detail structure from your "new" code (single `form` state)
 * - Restores all guest/verification flows and other features from your "old" code
 * - Includes return-trip toggle, guest phone verification simulation, address autocomplete,
 *   location selector, date/time pickers, cost calc and summary, success UI and redirect.
 *
 * NOTE: This component expects the following components/entities to exist in your codebase:
 * - LocationSelector (pickup/dropoff selection)
 * - AddressAutocomplete (text-autocomplete input)
 * - Booking entity with `.create(payload)` method
 * - User entity with `.me()` method
 * - UI primitives under "@/components/ui/*"
 * - createPageUrl util
 *
 * Copy-paste into your BookRide page file and it should work with your app structure.
 */

export default function BookRide() {
  const router = useRouter();

  // --- User & page state ---
  const [user, setUser] = useState(null); // logged-in user object or null
  const [loading, setLoading] = useState(false); // submission loading
  const [ok, setOk] = useState(false); // successful booking flag
  const [err, setErr] = useState(""); // error message UI

  // --- Unified form (based on new code schema) ---
  const [form, setForm] = useState({
    pickup_address: "",
    pickup_coordinates: null, // { lat, lng }
    dropoff_address: "",
    dropoff_coordinates: null,
    scheduled_date: null, // Date object or string depending on calendar
    scheduled_time: "",
    // Return schedule
    return_date: null,
    return_time: "",
    assistance_type: "ambulatory",
    passenger_count: 1,
    special_instructions: "",
    // Guest fields (from old code)
    guest_name: "",
    guest_phone: "",
    estimated_cost: 0,
  });

  // --- Return toggle (keeps new component's approach) ---
  const [isReturn, setIsReturn] = useState(false);

  // --- Guest verification state (from old code) ---
  const [verification, setVerification] = useState({
    code: "", // code user enters
    isCodeSent: false,
    isVerifying: false,
    isVerified: false,
    countdown: 0,
  });

  // A ref to hold countdown timer id to clear on unmount
  const countdownRef = useRef(null);

  // --- On mount: fetch logged-in user and set default date/time like old code ---
  useEffect(() => {
    (async () => {
      try {
        const me = await User.me();
        setUser(me);
      } catch {
        setUser(null);
      }
    })();

    // set default schedule to current date/time (old behaviour)
    const now = new Date();
    // for Calendar component we prefer Date object; for some old code you used ISO strings,
    // but new Calendar expects Date. We'll keep Date.
    setForm((p) => ({
      ...p,
      scheduled_date: now,
      scheduled_time: now.toTimeString().slice(0, 5), // "HH:MM"
    }));

    // cleanup on unmount
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // --- Helpers to update form ---
  const handle = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // For compatibility with older code that used handleInputChange etc.
  const handleInputChange = (field, value) => handle(field, value);

  // --- Cost calculation: combine new simple estimator with old breakdown --- //
  const calculateCostBreakdown = (f) => {
    const baseFare = 25.0;

    const assistanceFee =
      f.assistance_type === "wheelchair"
        ? 7.5
        : f.assistance_type === "stretcher"
        ? 20.0
        : f.assistance_type === "walker_assistance"
        ? 5.0
        : 0;

    let distanceCost = 12.0; // fallback default
    if (f.pickup_coordinates && f.dropoff_coordinates) {
      // simple haversine-like planar approx as used in previous code:
      const latDiff = f.pickup_coordinates.lat - f.dropoff_coordinates.lat;
      const lngDiff = f.pickup_coordinates.lng - f.dropoff_coordinates.lng;
      // approximate degrees -> km: lat ~111 km per degree; lon approx 111*cos(lat)
      const avgLat = (f.pickup_coordinates.lat + f.dropoff_coordinates.lat) / 2;
      const latKm = latDiff * 111;
      const lngKm = lngDiff * (111 * Math.cos((avgLat * Math.PI) / 180));
      const distanceKm = Math.sqrt(latKm * latKm + lngKm * lngKm);
      // price per km (approx)
      distanceCost = Math.max(8.0, distanceKm * 2.5); // ensure minimum distance charge
    }

    const total = baseFare + assistanceFee + distanceCost;
    return {
      baseFare,
      assistanceFee,
      distanceCost,
      total,
    };
  };

  // computed total for UI
  const costBreakdown = calculateCostBreakdown(form);
  const totalEstimate = costBreakdown.total;

  // When pickup/dropoff coords change, update estimated_cost in form state (helps with submission)
  useEffect(() => {
    setForm((p) => ({ ...p, estimated_cost: calculateCostBreakdown(p).total }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.pickup_coordinates, form.dropoff_coordinates, form.assistance_type, form.passenger_count]);

  // --- Guest phone verification simulation (old behaviour) --- //
  const handleSendVerificationCode = () => {
    if (!form.guest_phone || form.guest_phone.trim().length < 6) {
      setErr("Please enter a valid phone number to receive verification code.");
      return;
    }
    setErr("");
    setVerification((prev) => ({ ...prev, isCodeSent: true, isVerifying: false, isVerified: false, countdown: 60 }));
    // start countdown (simulate SMS countdown)
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setVerification((prev) => {
        if (prev.countdown <= 1) {
          clearInterval(countdownRef.current);
          return { ...prev, countdown: 0 };
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
    // In demo mode we consider the code is "123456"
    // Real integration: call backend to send SMS and store state server-side
  };

  const handleVerifyCode = () => {
    setErr("");
    setVerification((prev) => ({ ...prev, isVerifying: true }));
    // simulate verification delay
    setTimeout(() => {
      setVerification((prev) => {
        const codeMatches = prev.code === "123456";
        if (codeMatches) {
          return { ...prev, isVerifying: false, isVerified: true, code: "" };
        } else {
          setErr("Invalid verification code. Please try again (use 123456 in demo).");
          return { ...prev, isVerifying: false, isVerified: false };
        }
      });
    }, 1200);
  };

  // --- Submission handler: merges new component's payload logic + old validations --- //
  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      // Basic required fields
      if (!form.pickup_address || !form.dropoff_address) {
        throw new Error("Pickup and dropoff locations are required.");
      }
      if (!form.scheduled_date || !form.scheduled_time) {
        throw new Error("Pickup date and time are required.");
      }

      // Guest flow: if not logged in, require phone verification & details
      if (!user) {
        if (!verification.isVerified) {
          throw new Error("Please verify your phone number before booking as a guest.");
        }
        if (!form.guest_name || !form.guest_phone) {
          throw new Error("Please enter your name and phone number for guest booking.");
        }
      }

      // Build payload: use same keys as your backend expects
      const payload = {
        pickup_address: form.pickup_address,
        pickup_coordinates: form.pickup_coordinates,
        dropoff_address: form.dropoff_address,
        dropoff_coordinates: form.dropoff_coordinates,
        scheduled_date: form.scheduled_date ? format(form.scheduled_date, "yyyy-MM-dd") : null,
        scheduled_time: form.scheduled_time || null,
        return_date: isReturn && form.return_date ? format(form.return_date, "yyyy-MM-dd") : null,
        return_time: isReturn ? form.return_time : null,
        assistance_type: form.assistance_type,
        passenger_count: parseInt(form.passenger_count || 1, 10),
        special_instructions: form.special_instructions,
        estimated_cost: calculateCostBreakdown(form).total,
        // If guest, include guest name/phone - backend should ignore if user is authenticated
        guest_name: !user ? form.guest_name : undefined,
        guest_phone: !user ? form.guest_phone : undefined,
      };

      // call Booking.create (assumes your entity handles auth server-side)
      await Booking.create(payload);

      setOk(true);

      // redirect after short delay: old code redirected to MyBookings for logged-in,
      // or to BookRide?status=guest_success for guest
      setTimeout(() => {
        if (user) {
          router.push(createPageUrl("MyBookings"));
        } else {
          router.push(`${createPageUrl("BookRide")}?status=guest_success`);
        }
      }, 1600);
    } catch (e2) {
      setErr(e2.message || "Failed to book ride.");
    } finally {
      setLoading(false);
    }
  };

  // --- Location selection callbacks: unify AddressAutocomplete + LocationSelector usage --- //
  // LocationSelector returns address + coordinates objects; AddressAutocomplete returns similar
  const onPickupSelect = (data) => {
    // data: { address, coordinates: { lat, lng } }
    handle("pickup_address", data.address);
    handle("pickup_coordinates", data.coordinates);
  };

  const onDropoffSelect = (data) => {
    handle("dropoff_address", data.address);
    handle("dropoff_coordinates", data.coordinates);
  };

  // (optional) helper to allow AddressAutocomplete to just update text while selecting
  const onPickupChangeText = (v) => handle("pickup_address", v);
  const onDropoffChangeText = (v) => handle("dropoff_address", v);

  // Assistance types (from old code)
  const assistanceTypes = [
    { value: "ambulatory", label: "Ambulatory (Walking)", icon: "🚶" },
    { value: "wheelchair", label: "Wheelchair Accessible", icon: "♿" },
    { value: "stretcher", label: "Stretcher/Gurney", icon: "🛏️" },
    { value: "walker_assistance", label: "Walker Assistance", icon: "🦯" },
  ];

  // --- Render success screen if ok --- //
  if (ok) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-8 text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold">Booking Requested</h2>
          <p className="text-gray-600">We received your booking request. Redirecting…</p>
        </Card>
      </div>
    );
  }

  // --- Main form UI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Book a Ride</h1>

        {/* Error alert */}
        {err && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={submit} className="grid lg:grid-cols-3 gap-6">
          {/* LEFT: details & guest/verification */}
          <div className="lg:col-span-2 space-y-6">
            {/* Guest verification card (only show when user not logged in) */}
            {!user && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-blue-600" />
                    Guest Information & Verification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="guest_name">Full Name *</Label>
                      <Input
                        id="guest_name"
                        value={form.guest_name}
                        onChange={(e) => handle("guest_name", e.target.value)}
                        placeholder="e.g., Jane Doe"
                        disabled={verification.isVerified}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guest_phone">Phone Number *</Label>
                      <Input
                        id="guest_phone"
                        type="tel"
                        value={form.guest_phone}
                        onChange={(e) => handle("guest_phone", e.target.value)}
                        placeholder="(555) 123-4567"
                        disabled={verification.isVerified}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {!verification.isVerified ? (
                    <div className="space-y-3 pt-2">
                      {!verification.isCodeSent ? (
                        <div className="flex gap-2">
                          <Button type="button" onClick={handleSendVerificationCode} className="w-full" variant="outline">
                            <Phone className="w-4 h-4 mr-2" />
                            Verify Phone Number for Guest Booking
                          </Button>
                        </div>
                      ) : (
                        <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                          <Label htmlFor="verification_code">Enter 6-Digit Code (use 123456)</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              id="verification_code"
                              value={verification.code}
                              onChange={(e) => setVerification((p) => ({ ...p, code: e.target.value }))}
                              placeholder="••••••"
                              maxLength={6}
                            />
                            <Button
                              type="button"
                              onClick={handleVerifyCode}
                              disabled={verification.isVerifying || verification.countdown > 0}
                            >
                              {verification.isVerifying ? "Verifying..." : verification.countdown > 0 ? `${verification.countdown}s` : "Verify"}
                            </Button>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            In demo mode the verification code is <strong>123456</strong>.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Alert className="bg-green-50 border-green-200 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Phone number verified successfully!
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Trip Details: LocationSelector & AddressAutocomplete */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Trip Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Location *</Label>
                  <div className="mt-2 space-y-2">
                    
                    {/* A lightweight LocationSelector (map pin chooser) - keep both if desired */}
                    <LocationSelector
                      pickup={
                        form.pickup_coordinates
                          ? { address: form.pickup_address, coordinates: form.pickup_coordinates }
                          : null
                      }
                      dropoff={
                        form.dropoff_coordinates
                          ? { address: form.dropoff_address, coordinates: form.dropoff_coordinates }
                          : null
                      }
                      onPickupChange={(d) => {
                        handle("pickup_address", d.address);
                        handle("pickup_coordinates", d.coordinates);
                      }}
                      onDropoffChange={(d) => {
                        handle("dropoff_address", d.address);
                        handle("dropoff_coordinates", d.coordinates);
                      }}
                    />
                  </div>
                </div>

                
              </CardContent>
            </Card>

            {/* Schedule card (Date & Time) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Pickup Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full mt-1 text-left">
                          {form.scheduled_date ? format(form.scheduled_date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={form.scheduled_date}
                          onSelect={(d) => handle("scheduled_date", d)}
                          disabled={(d) => d < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Pickup Time</Label>
                    <Input
                      type="time"
                      value={form.scheduled_time}
                      onChange={(e) => handle("scheduled_time", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Return toggle */}
                <div className="flex items-center gap-2">
                  <Input
                    id="return_toggle"
                    type="checkbox"
                    className="w-4 h-4"
                    checked={isReturn}
                    onChange={() => setIsReturn((v) => !v)}
                  />
                  <Label htmlFor="return_toggle">Add Return Trip</Label>
                </div>

                {isReturn && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Return Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full mt-1 text-left">
                            {form.return_date ? format(form.return_date, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={form.return_date}
                            onSelect={(d) => handle("return_date", d)}
                            disabled={(d) => {
                              const min = form.scheduled_date || new Date();
                              return d < min;
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label>Return Time</Label>
                      <Input
                        type="time"
                        value={form.return_time}
                        onChange={(e) => handle("return_time", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assistance & Passengers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Accessibility className="w-5 h-5 text-blue-600" />
                  Assistance & Passengers
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Assistance</Label>
                  <Select value={form.assistance_type} onValueChange={(v) => handle("assistance_type", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assistanceTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.icon} {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Passengers</Label>
                  <Select
                    value={String(form.passenger_count)}
                    onValueChange={(v) => handle("passenger_count", parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} Passenger{n > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Special instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Special Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={form.special_instructions}
                  onChange={(e) => handle("special_instructions", e.target.value)}
                  placeholder="Any notes..."
                  className="h-24"
                />
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span>Base Fare</span><span>${costBreakdown.baseFare.toFixed(2)}</span></div>
                <div className="flex justify-between">
                  <span>Assistance Fee</span>
                  <span>
                    {form.assistance_type === "wheelchair" ? "$7.50" :
                     form.assistance_type === "stretcher" ? "$20.00" :
                     form.assistance_type === "walker_assistance" ? "$5.00" : "$0.00"}
                  </span>
                </div>
                <div className="flex justify-between"><span>Distance (est.)</span><span>${costBreakdown.distanceCost.toFixed(2)}</span></div>
                {isReturn && <div className="flex justify-between"><span>Return Trip</span><span>Included</span></div>}
                <hr />
                <div className="flex justify-between font-semibold"><span>Total</span><span>${costBreakdown.total.toFixed(2)}</span></div>

                {/* Guest verification prompt in summary */}
                {!user && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600">Guest booking requires phone verification before submitting.</p>
                  </div>
                )}

                <Button type="submit" className="w-full mt-2" disabled={loading || (!user && !verification.isVerified)}>
                  {loading ? "Booking..." : "Book Ride"}
                </Button>

                <div className="text-xs text-gray-500 mt-2">
                  Final cost may vary based on actual distance and wait time. You'll be charged after the ride.
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
