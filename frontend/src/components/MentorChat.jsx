import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import io from "socket.io-client";
import { Send, X, MessageCircle, Loader2 } from "lucide-react";
import { useUser } from "../context/UserContext";

const MentorChat = ({ mentor, onClose, onRequestRegister }) => {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!mentor || !user) return;

    const socket = io("http://localhost:5000", {
      transports: ["websocket"],
    });

    socketRef.current = socket;
    socket.emit("join-user", user._id || user.id);

    socket.on("receive-message", (data) => {
      if (data.senderId === mentor._id) {
        setMessages((prev) => [
          ...prev,
          {
            sender: data.senderId,
            message: data.message,
            timestamp: data.timestamp,
          },
        ]);
      }
    });

    socket.on("message-sent", (data) => {
      if (data.receiverId === mentor._id) {
        setMessages((prev) => [
          ...prev,
          {
            sender: user._id || user.id,
            message: data.message,
            timestamp: data.timestamp,
          },
        ]);
      }
    });

    fetchConversation();

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentor, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversation = async () => {
    if (!mentor) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/chat/conversation/${mentor._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Unable to load conversation.");
      }

      const data = await res.json();
      const formatted =
        data.chat?.messages?.map((msg) => ({
          sender: msg.sender?._id || msg.sender,
          message: msg.message,
          timestamp: msg.timestamp,
        })) || [];
      setMessages(formatted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !mentor || !socketRef.current) return;
    setError("");

    const messagePayload = {
      senderId: user._id || user.id,
      receiverId: mentor._id,
      message: newMessage.trim(),
    };

    socketRef.current.emit("send-message", messagePayload);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(messagePayload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to deliver message.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setNewMessage("");
    }
  };

  if (!mentor) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[1200] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white rounded-3xl shadow-2xl overflow-hidden relative border border-white/10"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden">
                {mentor.profilePicture ? (
                  <img
                    src={mentor.profilePicture}
                    alt={mentor.firstName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <MessageCircle className="w-6 h-6 text-indigo-200" />
                )}
              </div>
              <div>
                <p className="font-semibold text-lg">
                  Chat with {mentor.firstName} {mentor.lastName}
                </p>
                <p className="text-indigo-200 text-sm">
                  Plan your session, discuss goals, and sync schedules.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5 max-h-[420px] overflow-y-auto space-y-3 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-200" />
              </div>
            ) : messages.length > 0 ? (
              messages.map((msg, index) => {
                const isOwn = (msg.sender?._id || msg.sender) === (user._id || user.id);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${
                      isOwn ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-lg ${
                        isOwn
                          ? "bg-indigo-500 text-white rounded-tr-sm"
                          : "bg-white/10 text-indigo-50 rounded-tl-sm"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.message}</p>
                      <span className="block text-[11px] text-indigo-200 mt-2">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center text-indigo-200 py-12">
                Send a message to break the ice ✨
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="px-6 pb-3 text-sm text-rose-200">{error}</div>
          )}

          <div className="px-6 pb-6">
            <div className="flex items-center gap-3">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="flex-1 rounded-2xl bg-white/10 border border-white/10 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:bg-white/15 transition-colors"
                placeholder="Type a message..."
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                className="rounded-2xl bg-indigo-500 hover:bg-indigo-400 px-4 py-3 transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </motion.button>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onRequestRegister?.(mentor)}
              className="w-full mt-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-4 py-3 font-semibold transition-colors shadow-lg shadow-emerald-500/25"
            >
              Register for a Course with {mentor.firstName}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MentorChat;






