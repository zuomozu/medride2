"use client";

import { useEffect, useState } from "react";
import ActiveBookingCard from "./ActiveBookingCard";
import { Booking } from "@/entities/Booking";
import { User } from "@/entities/User";

export default function ActiveBookingsList() {
  const [activeBookings, setActiveBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const user = await User.me();
        const bookings = await Booking.filter(
          { created_by: user.email },
          "-created_date"
        );
        // filter only active rides
        const actives = bookings.filter(
          (b) => !["completed", "cancelled"].includes(b.status)
        );
        setActiveBookings(actives);
      } catch (err) {
        console.error("Failed to load bookings", err);
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, []);

  if (loading) {
    return <p className="text-center p-4">Loading active rides…</p>;
  }

  if (activeBookings.length === 0) {
    return <p className="text-center p-4">No active rides right now.</p>;
  }

  return (
  <div className="flex gap-4 overflow-x-auto pb-4">
    {activeBookings.map((b) => (
      <div key={b._id} className="flex-shrink-0 w-[350px]">
        <ActiveBookingCard booking={b} />
      </div>
    ))}
  </div>
);
}
