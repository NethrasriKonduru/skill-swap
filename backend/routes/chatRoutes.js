import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Chat from "../models/Chat.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all students (excluding current user)
router.get("/students", verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    console.log("Fetching students, excluding user:", currentUserId);
    
    // Convert to ObjectId if it's a string
    let userIdToExclude;
    try {
      userIdToExclude = mongoose.Types.ObjectId.isValid(currentUserId) 
        ? new mongoose.Types.ObjectId(currentUserId)
        : currentUserId;
    } catch (e) {
      userIdToExclude = currentUserId;
    }
    
    const students = await User.find({ _id: { $ne: userIdToExclude } })
      .select("firstName lastName email skills learningGoals profilePicture verified verificationBadge profileCompletion")
      .sort({ verified: -1, profileCompletion: -1 })
      .limit(50);
    
    console.log(`Found ${students.length} students`);
    res.json({ students });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get or create chat between two users
router.get("/conversation/:otherUserId", verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.otherUserId;

    const otherUser = await User.findById(otherUserId).select("verified firstName lastName");
    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!otherUser.verified) {
      return res.status(403).json({
        message: `${otherUser.firstName || "This user"} is not verified yet. Ask them to complete their profile before starting a conversation.`,
        unverified: true,
      });
    }

    let chat = await Chat.findOne({
      participants: { $all: [currentUserId, otherUserId] },
    }).populate("participants", "firstName lastName profilePicture");

    if (!chat) {
      // Create new chat
      chat = await Chat.create({
        participants: [currentUserId, otherUserId],
        messages: [],
      });
      chat = await Chat.findById(chat._id).populate(
        "participants",
        "firstName lastName profilePicture"
      );
    }

    res.json({ chat });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save message to database
router.post("/message", verifyToken, async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user.id;

    const receiver = await User.findById(receiverId).select("verified firstName lastName");
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    if (!receiver.verified) {
      return res.status(403).json({
        message: `${receiver.firstName || "This user"} is not verified yet. Ask them to complete their profile before messaging.`,
        unverified: true,
      });
    }

    let chat = await Chat.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [senderId, receiverId],
        messages: [],
      });
    }

    // Add message to chat
    chat.messages.push({
      sender: senderId,
      message,
      timestamp: new Date(),
    });

    chat.lastMessage = message;
    chat.lastMessageTime = new Date();

    await chat.save();

    res.json({ success: true, message: chat.messages[chat.messages.length - 1] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all conversations for current user
router.get("/conversations", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Chat.find({
      participants: userId,
    })
      .populate("participants", "firstName lastName profilePicture email")
      .sort({ lastMessageTime: -1 });

    // Format conversations to show the other participant
    const formattedConversations = conversations.map((conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== userId
      );
      return {
        _id: conv._id,
        otherParticipant,
        lastMessage: conv.lastMessage,
        lastMessageTime: conv.lastMessageTime,
        unreadCount: 0, // Can be implemented later
      };
    });

    res.json({ conversations: formattedConversations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

