import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectMongo from "@/lib/mongo";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "changeme123";

export async function GET(req) {
  try {
    await connectMongo();

    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return NextResponse.json({ error: "No token" }, { status: 401 });

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id).select("_id email role full_name phone vehicle_type");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
