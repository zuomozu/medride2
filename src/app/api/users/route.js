import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongo";
import User from "@/models/User";

export async function GET() {
  try {
    await connectMongo();
    const users = await User.find().select("-password"); // Exclude passwords
    return NextResponse.json(users);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
