"use client"
import AppLayout from "@/layouts/AppLayout"
import DriverDashboard from "@/Pages/DriverDashboard"

export default function Page() {
  return (
    <AppLayout currentPageName="DriverDashboard">
      <div className="p-6">
        <DriverDashboard />
      </div>
    </AppLayout>
  )
}
