import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import doctorModel from "../models/doctorModel.js";

/** Delete chat thread (messages + conversation) for a cancelled appointment. */
export const deleteConversationForAppointment = async (appointmentId) => {
  const conversation = await Conversation.findOne({ appointmentId });

  if (!conversation) {
    return { deleted: false };
  }

  await Message.deleteMany({ conversationId: conversation._id });
  await Conversation.findByIdAndDelete(conversation._id);

  return { deleted: true, conversationId: conversation._id };
};

/** Release booked slot on doctor when appointment is cancelled. */
export const releaseDoctorSlot = async (docId, slotDate, slotTime) => {
  const doctorData = await doctorModel.findById(docId);
  if (!doctorData?.slots_booked?.[slotDate]) return;

  const slots_booked = doctorData.slots_booked;
  slots_booked[slotDate] = slots_booked[slotDate].filter((e) => e !== slotTime);

  await doctorModel.findByIdAndUpdate(docId, { slots_booked });
};
