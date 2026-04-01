import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";


/* ============================================================
GET ALL CONVERSATIONS FOR LOGGED USER
============================================================ */
export const getConversations = async (req, res) => {
  try {
    const userId = req.body.userId;

    // Fetch conversations where the user is either the patient or the doctor
    // and the conversation is not deleted for the current user
    const conversations = await Conversation.find({
      $and: [
        { $or: [{ userId }, { docId: userId }] },
        { deletedFor: { $ne: userId } } // Exclude deleted conversations
      ],
    })
    .populate("userId", "name image")
    .populate("docId", "name image")
    .populate({
      path: "lastMessage",
      select: "text sender createdAt seen",
      populate: {
        path: "sender",
        select: "name image",
      },
    })
    .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
/* ============================================================
Soft & Hard Delete CONVERSATIONS FOR LOGGED USER
============================================================ */
export const deleteConversation = async (req, res) => {
  try {

    const { conversationId } = req.params;
    const userId = req.body.userId;
    const userModel = req.body.userModel;
    console.log("userId:", userId);
    console.log("userId:", conversationId);
    console.log("userModel:", userModel);

    const conversation = await Conversation.findById(conversationId);

    if (!conversation)
      return res.status(404).json({ message: "Conversation not found" });

    /* ===== soft delete conversation ===== */

    await Conversation.findByIdAndUpdate(conversationId, {
      $push: { deletedFor: userId },
      deletedForModel: userModel
    });

    await Message.updateMany(
      { conversationId },
      {
        $push: { deletedFor: userId },
        deletedForModel: userModel
      }
    );

    /* ===== check if both deleted ===== */

    const updatedConversation = await Conversation.findById(conversationId);

    if (updatedConversation.deletedFor.length >= 2) {

      await Message.deleteMany({ conversationId });

      await Conversation.findByIdAndDelete(conversationId);

    }

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ============================================================
GET MESSAGES OF A CONVERSATION
============================================================ */

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.body.userId;
    const userModel = req.query.userModel; // "User" or "Doctor"



    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Message.find({
      conversationId,
      deletedFor: { $ne: userId }, // hide deleted messages
    })
      .populate("sender", "name image")
      .sort({ createdAt: 1 });
    
    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: userId },
        seenBy: { $ne: userId },
      },
      {
        $push: { seenBy: userId },
        seenByModel: userModel,
      }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ============================================================
Two way SEND MESSAGE
============================================================ */

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, text } = req.body;
    const userId = req.body.userId;
    const userModel = req.body.userModel; // "User" or "Doctor"

    if (!conversationId || !text) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    /* ================= CREATE MESSAGE ================= */
    const message = await Message.create({
      conversationId,
      sender: userId,
      senderModel: userModel,
      text,
    });
      
    /* ================= REMOVE DELETE FLAG ================= */
    const otherUserId =
      userId.toString() === conversation.userId.toString()
        ? conversation.docId
        : conversation.userId;

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      // remove both users from deletedFor (optional but better)
      $pull: {
        deletedFor: { $in: [userId, otherUserId] }
      }
    });

    /* ================= RESPONSE ================= */
    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "name image"
    );

    res.status(201).json(populatedMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ============================================================
Soft DELETE + Delete for Everyone MESSAGE
============================================================ */
export const deleteMessage = async (req, res) => {
  try {

    const { messageId } = req.params;
    const userId = req.body.userId;
    const userModel = req.body.userModel;

    const message = await Message.findById(messageId);

    if (!message)
      return res.status(404).json({ message: "Message not found" });

    const isSender = message.sender.toString() === userId;

    const seenByOthers = message.seenBy.some(
      (id) => id.toString() !== userId
    );

    /* ================= DELETE FOR EVERYONE ================= */

    if (isSender && !seenByOthers) {

      await Message.findByIdAndDelete(messageId);

      const conversation = await Conversation.findById(message.conversationId);

      /* ----- check if deleted message was lastMessage ----- */

      if (
        conversation.lastMessage &&
        conversation.lastMessage.toString() === messageId
      ) {

        const lastMsg = await Message.findOne({
          conversationId: message.conversationId
        }).sort({ createdAt: -1 });

        await Conversation.findByIdAndUpdate(
          message.conversationId,
          { lastMessage: lastMsg ? lastMsg._id : null }
        );

      }

      return res.json({
        success: true,
        type: "delete_for_everyone"
      });
    }

    /* ================= DELETE FOR ME ================= */

    await Message.findByIdAndUpdate(messageId, {
      $push: { deletedFor: userId },
      deletedForModel: userModel,
    });

    res.json({
      success: true,
      type: "delete_for_me"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ============================================================
   CLEAR FULL CONVERSATION Soft Method
============================================================ */
export const clearConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.body.userId;
    const userModel = req.body.userModel;

    await Message.updateMany(
      { conversationId },
      {
        $push: { deletedFor: userId },
        deletedForModel: userModel,
      }
    );

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
