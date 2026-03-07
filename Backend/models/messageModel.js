import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "senderModel", // dynamic reference
    },
    senderModel: {
      type: String,
      required: true,
      enum: ["user", "doctor"], // either User or Doctor
    },
    text: {
      type: String,
      required: true,
    },
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "seenByModel",
      }
    ],
    seenByModel: {
      type: String,
      enum: ["user", "doctor"], // dynamic reference for seenBy
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "deletedForModel",
      }
    ],
    deletedForModel: {
      type: String,
      enum: ["user", "doctor"], // dynamic reference for deletedFor
    }
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);