"use client"
import AppLayout from "@/layouts/AppLayout"
import Support from "@/Pages/Support"

export default function Page() {
  return (
    <AppLayout currentPageName="Support">
      <div className="p-6">
        <Support />
      </div>
    </AppLayout>
  )
}
