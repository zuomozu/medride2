import { auth } from "@/utils/auth";
import { emitBooking } from "@/lib/events";

export const Booking = {
  async filter() {
    const token = auth.getToken();
    const res = await fetch("/api/bookings", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load bookings");
    return res.json();
  },

  async filterActive() {
    return this.filter({ active: "true" });
  },

  async create(data) {
  const token = auth.getToken();
  console.log("Creating booking with data:", data, "token",token);


  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch("/api/bookings", {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Failed to create booking: ${msg}`);
  }

  return res.json();
},

  async update(id, patch) {
    const token = auth.getToken();
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    });
    console.log("CALLLING",patch, res)
    if (!res.ok) throw new Error("Failed to update booking");
    // Wait for the latest copy from server
    const updatedBooking = await res.json();

    // Emit the fresh booking after update
    emitBooking("booking:updated", updatedBooking);
    return updatedBooking;
  },

  async remove(id) {
    const token = auth.getToken();
    const res = await fetch(`/api/bookings/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to delete booking");
    return res.json();
  },

  async list(sort = "") {
    const token = auth.getToken();
    const res = await fetch(`/api/bookings?sort=${sort}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load bookings");
    return res.json();
  },
};
