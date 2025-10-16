"use client";

import { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // if already logged in, redirect
  useEffect(() => {
    (async () => {
      const me = await User.me();
      if (me) router.replace("/");
    })();
  }, [router]);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await User.login(form);
      router.replace("/"); // go to BookRide (home)
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-white">
      <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 w-full max-w-md space-y-4">
        <h1 className="text-xl font-semibold">Welcome back</h1>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <div>
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required />
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required />
        </div>

        <Button type="submit" disabled={loading}>{loading ? "Signing in..." : "Log in"}</Button>
        <p className="text-sm text-gray-600">New here? <a className="text-blue-600 underline" href="/register">Create an account</a></p>
      </form>
    </main>
  );
}
