"use client"
import AppLayout from "@/layouts/AppLayout"
import AdminSupport from "@/Pages/AdminSupport"

export default function Page() {
  return (
    <AppLayout currentPageName="AdminSupport">
      <div className="p-6">
        <AdminSupport />
      </div>
    </AppLayout>
  )
}
