"use client";
import { useEffect } from "react";
import { io } from "socket.io-client";
import { auth } from "@/utils/auth";

/**
 * Keeps sending driver's location for active bookings
 * @param {Array} bookingIds - array of active booking IDs
 */
export function useDriverLocation(bookingIds = []) {
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const token = auth.getToken();
    if (!token) return;

    const socket = io(window.location.origin, {
      path: "/api/socket.io",
      auth: { token },
      transports: ["websocket"],
    });

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        bookingIds.forEach((id) => {
          socket.emit("driver:location", {
            bookingId: id,
            coords: { lat: latitude, lng: longitude },
          });
        });
      },
      (err) => console.error("Geo error", err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.disconnect();
    };
  }, [bookingIds]);
}
