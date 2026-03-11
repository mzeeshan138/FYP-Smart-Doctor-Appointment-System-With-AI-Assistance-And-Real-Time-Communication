import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    docId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctor",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "appointment",
      required: true,
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "deletedForModel"
      }
    ],

    deletedForModel: {
      type: String,
      enum: ["user","doctor"]
    }
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", conversationSchema);