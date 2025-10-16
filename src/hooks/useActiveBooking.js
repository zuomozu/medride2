"use client";
import { useEffect, useState } from "react";
import { Booking } from "@/entities/Booking";
import { useBookingWS } from "./useBookingWS.js";

export function useActiveBooking() {
  const [active, setActive] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await Booking.filterActive();
        setActive(list[0] || null); // show first active booking (extend later for multiple)
      } catch (e) {
        console.error("Failed to fetch active bookings", e);
      }
    })();
  }, []);

  useBookingWS({
    onCreated: (b) => {
      if (!["completed", "cancelled"].includes(b.status)) setActive(b);
    },
    onUpdated: (b) => {
      if (["completed", "cancelled"].includes(b.status)) setActive(null);
      else setActive(b);
    },
    onDeleted: (b) => {
  setActive((prev) =>
    prev && (prev._id || prev.id) === (b._id || b.id) ? null : prev
  );
},
  });

  return active;
}
