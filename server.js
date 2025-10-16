import { createServer } from "http";
import { Server } from "socket.io";
import next from "next";
import { setIO } from "./src/lib/events.js";  // note the .js extension
// ✅ correct
import jwt from "jsonwebtoken";



const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));

  const io = new Server(server, {
    path: "/api/socket.io", // must match client
    cors: { origin: "*" },
  });

  // Save reference so API routes can emit
  setIO(io);

  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);

    // Join user/admin/driver rooms based on token
    const { token } = socket.handshake.auth || {};
    if (token) {
      try {
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "changeme123");
        if (decoded.role === "admin") socket.join("admins");
        if (decoded.role === "driver") socket.join(`driver:${decoded.email}`);
        socket.join(`user:${decoded.email}`);
        console.log("👤 Joined rooms:", socket.rooms);

      } catch (err) {
        console.warn("Invalid token:", err.message);
      }
    }
    // Listen for driver location updates
   socket.on("driver:location", (data) => {
    const { bookingId, location, eta, userEmail, driverEmail } = data;
    io.to(`user:${userEmail}`).emit("driver:location", { bookingId, location, eta });
    if (driverEmail) io.to(`driver:${driverEmail}`).emit("driver:location", { bookingId, location, eta });
    io.to("admins").emit("driver:location", { bookingId, location, eta });
  });
    
    
    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });

  server.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000");
  });
});
