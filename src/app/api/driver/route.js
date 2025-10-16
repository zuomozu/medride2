import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongo";
import User from "@/models/User";

export async function GET() {
  try {
    await connectMongo();
    const drivers = await User.find({ role: "driver" }).select("_id full_name email phone vehicle_type");
    console.log("Drivers:", drivers);
    return NextResponse.json(drivers);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
