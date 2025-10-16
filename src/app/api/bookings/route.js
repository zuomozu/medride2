import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongo";
import Booking from "@/models/Booking";
import jwt from "jsonwebtoken";
import { emitBooking } from "@/lib/events";

const JWT_SECRET = process.env.JWT_SECRET || "changeme123";

// 🔹 helper to decode token (if present)
function getUserDecoded(req) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// 🔹 GET /api/bookings
export async function GET(req) {
  try {
    await connectMongo();
    const decoded = getUserDecoded(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";

    const statusFilter = activeOnly ? { status: { $nin: ["completed", "cancelled"] } } : {};

    let baseFilter = {};
    if (decoded.role === "admin") baseFilter = {};
    else if (decoded.role === "driver") baseFilter = { driver_email: decoded.email };
    else baseFilter = { created_by: decoded.email };

    const filter = { ...baseFilter, ...statusFilter };

    const bookings = await Booking.find(filter).sort({ createdAt: -1 });

    return NextResponse.json(bookings, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 🔹 POST /api/bookings (supports both guest + logged-in)
export async function POST(req) {
  try {
    await connectMongo();
    const decoded = getUserDecoded(req);
    const body = await req.json();

    const {
      pickup_address,
      dropoff_address,
      scheduled_date,
      scheduled_time,
      return_date,
      return_time,
      assistance_type,
      passenger_count,
      special_instructions,
      estimated_cost,
      guest_name,
      guest_phone,
    } = body;

    // 🔸 Common required fields
    if (!pickup_address || !dropoff_address || !scheduled_date) {
      return NextResponse.json({ error: "Missing required booking fields" }, { status: 400 });
    }

    let bookingData = {
      pickup_address,
      dropoff_address,
      scheduled_date,
      scheduled_time,
      return_date,
      return_time,
      assistance_type,
      passenger_count,
      special_instructions,
      estimated_cost,
    };

    if (decoded?.email) {
      // Authenticated user
      bookingData.created_by = decoded.email;
    } else {
      // Guest booking — must have name + phone
      if (!guest_name || !guest_phone) {
        return NextResponse.json({ error: "Guest name and phone required" }, { status: 400 });
      }
      bookingData.guest_name = guest_name;
      bookingData.guest_phone = guest_phone;
      bookingData.created_by = "guest";
    }

    const booking = await Booking.create(bookingData);
    emitBooking("booking:created", booking);

    return NextResponse.json(booking, { status: 200 });
  } catch (err) {
    console.error("Booking creation failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
