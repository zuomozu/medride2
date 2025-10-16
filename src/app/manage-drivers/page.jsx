"use client"
import AppLayout from "@/layouts/AppLayout"
import ManageDrivers from "@/Pages/ManageDrivers"

export default function Page() {
  return (
    <AppLayout currentPageName="ManageDrivers">
      <div className="p-6">
        <ManageDrivers />
      </div>
    </AppLayout>
  )
}
