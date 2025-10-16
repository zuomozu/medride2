import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectMongo from "@/lib/mongo";
import User from "@/models/User";

export async function POST(req) {
  try {
    await connectMongo();
    const body = await req.json();
    const { full_name, email, password, role } = body;

    if (!full_name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      full_name,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    return NextResponse.json({ message: "User registered", user: { id: user._id, email: user.email } });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
