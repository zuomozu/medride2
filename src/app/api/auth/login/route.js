import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectMongo from "@/lib/mongo";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "changeme123";

export async function POST(req) {
  try {
    await connectMongo();
    const body = await req.json();
    const { email, password } = body;

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
