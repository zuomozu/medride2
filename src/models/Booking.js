import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    created_by: { type: String, required: true },   // user email
    pickup_address: { type: String, required: true },
    dropoff_address: { type: String, required: true },
    pickup_coordinates: { lat: Number, lng: Number },
    dropoff_coordinates: { lat: Number, lng: Number },
    scheduled_date: { type: Date },
    scheduled_time: { type: String },
    assistance_type: { type: String, enum: ["ambulatory", "wheelchair", "stretcher", "walker_assistance"], default: "ambulatory" },
    passenger_count: { type: Number, default: 1 },
    special_instructions: { type: String },
    estimated_cost: { type: Number, default: 0 },
    final_cost: { type: Number },
    driver_email: { type: String },   // 🔹 for assignment
    driver_name: { type: String },
    driver_phone: { type: String },
    vehicle_info: { type: String },
    vehicle_location: { lat: Number, lng: Number }, // Driver's live location
    eta: { type: Number }, // Estimated time of arrival
    status: { type: String, enum: ["pending", "confirmed", "assigned", "en_route", "arrived", "in_transit", "completed", "cancelled"], default: "pending" },
    payment_status: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
    guest_name: { type: String },
guest_phone: { type: String },

  },
  { timestamps: true }
);
BookingSchema.index({ created_by: 1, status: 1, createdAt: -1 });
BookingSchema.index({ driver_email: 1, status: 1, createdAt: -1 });

export default mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
