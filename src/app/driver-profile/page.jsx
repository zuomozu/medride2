"use client"
import AppLayout from "@/layouts/AppLayout"
import DriverProfile from "@/Pages/DriverProfile"

export default function Page() {
  return (
    <AppLayout currentPageName="DriverProfile">
      <div className="p-6">
        <DriverProfile />
      </div>
    </AppLayout>
  )
}
