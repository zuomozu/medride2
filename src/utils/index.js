export const createPageUrl = (name) => {
  const map = {
    BookRide: "/",
    MyBookings: "/my-bookings",
    PaymentMethods: "/payment-methods",
    Support: "/support",
    AdminBookings: "/admin-bookings",
    ManageDrivers: "/manage-drivers",
    Analytics: "/analytics",
    AdminSupport: "/admin-support",
    DriverDashboard: "/driver-dashboard",
    DriverProfile: "/driver-profile",
  }
  return map[name] || "/"
}
