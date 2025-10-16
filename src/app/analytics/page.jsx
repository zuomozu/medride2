"use client"
import AppLayout from "@/layouts/AppLayout"
import Analytics from "@/Pages/Analytics"

export default function Page() {
  return (
    <AppLayout currentPageName="Analytics">
      <div className="p-6">
        <Analytics />
      </div>
    </AppLayout>
  )
}
