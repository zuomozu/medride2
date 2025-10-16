"use client";
import { useEffect } from "react";
import { io } from "socket.io-client";
import { auth } from "@/utils/auth";

export function useBookingWS({ onCreated, onUpdated, onDeleted }) {
  useEffect(() => {
    // run only in browser
    if (typeof window === "undefined") return;

    // no need to fetch /api/socket in App Router setup
    const token = auth.getToken();
    if (!token) return;

    const socket = io(window.location.origin, {
      path: "/api/socket.io",
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("🔌 WS connected");
    });

    socket.on("booking:created", (b) => onCreated?.(b));
    socket.on("booking:updated", (b) => {
  console.log("📩 Received booking:updated", b);
  onUpdated?.(b);
});

    socket.on("booking:deleted", (b) => onDeleted?.(b));

    socket.on("disconnect", () => {
      console.log("❌ WS disconnected");
    });

    return () => socket.disconnect();
  }, [onCreated, onUpdated, onDeleted]);
}
