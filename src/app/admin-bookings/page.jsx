"use client"
import AppLayout from "@/layouts/AppLayout"
import AdminBookings from "@/Pages/AdminBookings"

export default function Page() {
  return (
    <AppLayout currentPageName="AdminBookings">
      <div className="p-6">
        <AdminBookings />
      </div>
    </AppLayout>
  )
}
