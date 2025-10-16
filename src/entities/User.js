import { auth } from "@/utils/auth";

export const User = {
  async me() {
    return await auth.me();  // returns {email, role, full_name, ...} or null
  },

  async list() {
    const token = auth.getToken();
    const res = await fetch(`/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load users");
    return res.json();
  },

   async driverlist() {
    const token = auth.getToken();
    const res = await fetch(`/api/auth/driver`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load users");
    return res.json();
  },

  async updateMyUserData() { return true; }, // wire later if needed

  // UI will call these:
  async register({ full_name, email, password, role }) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name, email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");
    return data;
  },

  async login({ email, password }) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    auth.setToken(data.token);
    return data.user;
  },

  async logout() {
    auth.clear();
    return true;
  },

  // keep compatibility with your layout’s call
  async loginWithRedirect() {
    // We’ll just route the user to /login
    if (typeof window !== "undefined") window.location.href = "/login";
  },
};
