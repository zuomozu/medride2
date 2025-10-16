// src/lib/events.js
if (!globalThis.ioInstance) {
  globalThis.ioInstance = null;
}

export function setIO(io) {
  console.log("✅ ioInstance set (globalThis)");
  globalThis.ioInstance = io;
}

export function emitBooking(event, booking) {
  const io = globalThis.ioInstance;
  if (!io) {
    console.log("❌ ioInstance not set (globalThis still null)");
    return;
  }

  console.log("📢 Emitting", event, "to rooms:", {
    created_by: booking.created_by,
    driver_email: booking.driver_email,
  });

  if (booking.created_by)
    io.to(`user:${booking.created_by}`).emit(event, booking);
  if (booking.driver_email)
    io.to(`driver:${booking.driver_email}`).emit(event, booking);
  io.to("admins").emit(event, booking);
}
