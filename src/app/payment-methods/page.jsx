"use client"
import AppLayout from "@/layouts/AppLayout"
import PaymentMethods from "@/Pages/PaymentMethods"

export default function Page() {
  return (
    <AppLayout currentPageName="PaymentMethods">
      <div className="p-6">
        <PaymentMethods />
      </div>
    </AppLayout>
  )
}
