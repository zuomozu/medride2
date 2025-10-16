import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongo";
import Booking from "@/models/Booking";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { emitBooking } from "@/lib/events";

const JWT_SECRET = process.env.JWT_SECRET || "changeme123";

function getUserEmail(req) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.email;
  } catch {
    return null;
  }
}

export async function GET(req, { params }) {
  await connectMongo();
  const email = getUserEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const booking = await Booking.findById(params.id);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(booking);
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params; 
    console.log("Received PUT request for booking ID:", id);
    await connectMongo();
    const decoded = getUserEmail(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.log("Decoded user email:", decoded);
    const body = await req.json();

    // 🔹 Handle driver assignment
    if (body.driver_email) {
      const driver = await User.findOne({ email: body.driver_email, role: "driver" });
      if (!driver) {
        return NextResponse.json({ error: "Driver not found" }, { status: 404 });
      }
      body.driver_name = driver.full_name;
      body.driver_phone = driver.phone || "";
      body.vehicle_info = driver.vehicle_type || "";
      body.status = body.status || "assigned";
    } else {
      // if unassigning driver
      body.driver_email = "";
      body.driver_name = "";
      body.driver_phone = "";
      body.vehicle_info = "";
    }
    console.log("Updating booking with data:", body);
    const booking = await Booking.findByIdAndUpdate(id, body, { new: true });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    emitBooking("booking:updated", booking);
    return NextResponse.json(booking);
  } catch (err) {
    console.error("Booking update failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export async function DELETE(req, { params }) {
  await connectMongo();
  const email = getUserEmail(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deleted = await Booking.findByIdAndDelete(params.id);
if (deleted) emitBooking("booking:deleted", deleted); 
  return NextResponse.json({ message: "Deleted" });
}
