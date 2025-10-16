import React, { createContext, useContext, useEffect, useState } from "react";
import { Booking } from "@/entities/Booking";
import { User } from "@/entities/User";

const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const currentUser = await User.me(); // Check if user is logged in
        if (!currentUser) {
          setBookings([]); // If not logged in, provide an empty list
          return;
        }

        const allBookings = await Booking.getAll(); // Fetch bookings for logged-in users
        const filteredBookings = allBookings.filter(
          (booking) => booking.status !== "completed" && booking.status !== "cancelled"
        );
        setBookings(filteredBookings);
      } catch (error) {
        console.error("Failed to fetch bookings:", error);
      }
    };

    fetchBookings();
  }, []);

  return (
    <BookingContext.Provider value={{ bookings, setBookings }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBookings = () => useContext(BookingContext);
