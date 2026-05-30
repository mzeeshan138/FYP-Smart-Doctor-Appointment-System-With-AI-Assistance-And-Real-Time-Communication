import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  docId: { type: String, required: true },
  slotDate: { type: String, required: true },
  slotTime: { type: String, required: true },
  userData: { type: Object, required: true },
  docData: { type: Object, required: true },
  amount: { type: Number, required: true },
  depositAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },
  depositPaid: { type: Boolean, default: false },
  balancePaid: { type: Boolean, default: false },
  date: { type: Number, required: true },
  cancelled: { type: Boolean, default: false },
  payment: { type: Boolean, default: false },
  paymentProof: {
    name: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    tid: { type: String, default: "" },
    date: { type: Date, default: Date.now },
  },
  isCompleted: { type: Boolean, default: false },
});

const appointmentModel =
  mongoose.model.appointment ||
  mongoose.model("appointment", appointmentSchema);

export default appointmentModel;
