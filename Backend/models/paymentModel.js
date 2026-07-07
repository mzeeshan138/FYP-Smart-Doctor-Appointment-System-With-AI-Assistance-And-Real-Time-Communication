import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    appointmentId: { type: String, default: null },
    docId: { type: String, required: true },
    stripeSessionId: { type: String, required: true, unique: true },
    stripePaymentIntentId: { type: String, default: null },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    paymentType: {
      type: String,
      enum: ["deposit", "balance"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    slotDate: { type: String, default: null },
    slotTime: { type: String, default: null },
    paidAt: { type: Date, default: null },
    /** Set when patient account is deleted — keeps audit trail */
    patientName: { type: String, default: "" },
    patientEmail: { type: String, default: "" },
    userDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const paymentModel =
  mongoose.models.payment || mongoose.model("payment", paymentSchema);

export default paymentModel;
