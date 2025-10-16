"use client";

import { useState } from "react";
import { User } from "@/entities/User";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";

export default function RegisterPage() {   // <-- must be default export
  const router = useRouter();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "user" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await User.register(form);
      router.push("/login");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-white">
      <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 w-full max-w-md space-y-4">
        <h1 className="text-xl font-semibold">Create an account</h1>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <div>
          <Label>Full name</Label>
          <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
        </div>
        <div>
          <Label>Role</Label>
          <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="driver">Driver</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Sign up"}
        </Button>
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 underline">Log in</a>
        </p>
      </form>
    </main>
  );
}
