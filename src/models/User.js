import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "driver", "admin"], default: "user" },
    phone: { type: String },
    vehicle_type: { type: String }, // driver only
  },
  { timestamps: true }
);

UserSchema.statics.findAll = async function () {
  return this.find().select("-password"); // Exclude the password field
};

// Prevent recompiling model during hot reload
export default mongoose.models.User || mongoose.model("User", UserSchema);
