import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";
import io from "socket.io-client";
import "./Chat.css";

const Chat = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [socket, setSocket] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversations, setConversations] = useState([]);
  const [alert, setAlert] = useState(null);
  const [pendingPeerId, setPendingPeerId] = useState(() => location.state?.peerId || null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!user) return;

    const newSocket = io("http://localhost:5000", {
      transports: ["websocket"],
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Join user's room
    newSocket.emit("join-user", user._id || user.id);

    // Listen for incoming messages
    newSocket.on("receive-message", (data) => {
      setMessages((prev) => [
        ...prev,
        {
          sender: data.senderId,
          message: data.message,
          timestamp: data.timestamp,
        },
      ]);
    });

    // Listen for sent message confirmation
    newSocket.on("message-sent", (data) => {
      setMessages((prev) => [
        ...prev,
        {
          sender: user._id || user.id,
          message: data.message,
          timestamp: data.timestamp,
        },
      ]);
    });

    // Fetch students list
    fetchStudents();
    fetchConversations();

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (location.state?.peerId) {
      setPendingPeerId(location.state.peerId);
    }
  }, [location.state]);

  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 3500);
    return () => clearTimeout(timer);
  }, [alert]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!pendingPeerId || students.length === 0) return;
    const targetStudent = students.find((student) => student._id === pendingPeerId);
    if (targetStudent) {
      selectStudent(targetStudent);
      setPendingPeerId(null);
    }
  }, [pendingPeerId, students]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }
      
      const res = await fetch("http://localhost:5000/api/chat/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error response:", errorData);
        return;
      }
      
      const data = await res.json();
      console.log("Students fetched:", data.students);
      setStudents(data.students || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/chat/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const selectStudent = async (student) => {
    if (!student.verified) {
      setAlert({
        type: "warning",
        message: `${student.firstName || "This profile"} is not verified yet. Ask them to finish their profile before starting a chat.`,
      });
      return;
    }

    setSelectedStudent(student);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/chat/conversation/${student._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403 && data.unverified) {
          setAlert({
            type: "warning",
            message: data.message,
          });
        } else {
          setAlert({
            type: "error",
            message: data.message || "Unable to load conversation.",
          });
        }
        return;
      }
      const data = await res.json();
        // Populate messages with sender info
        const formattedMessages = data.chat.messages.map((msg) => ({
          ...msg,
          sender: msg.sender._id || msg.sender,
        }));
        setMessages(formattedMessages);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      setAlert({
        type: "error",
        message: "Something went wrong fetching the chat. Please try again.",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedStudent || !socket) return;

    const messageData = {
      senderId: user._id || user.id,
      receiverId: selectedStudent._id,
      message: newMessage.trim(),
    };

    // Send via socket
    socket.emit("send-message", messageData);

    // Also save to database via API
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: selectedStudent._id,
          message: newMessage.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403 && data.unverified) {
          setAlert({
            type: "warning",
            message: data.message,
          });
        } else {
          setAlert({
            type: "error",
            message: data.message || "Failed to deliver the message.",
          });
        }
      }
    } catch (error) {
      console.error("Error saving message:", error);
      setAlert({
        type: "error",
        message: "We couldn't send your message. Please check your connection.",
      });
    }

    setNewMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button className="back-btn" onClick={() => navigate("/student-dashboard")}>
          ⬅ Back to Dashboard
        </button>
        <h1>Chat with Students</h1>
        {alert && (
          <div className={`chat-alert chat-alert-${alert.type}`}>
            {alert.message}
          </div>
        )}
      </div>

      <div className="chat-layout">
        {/* Students List */}
        <div className="students-sidebar">
          <h2>Students</h2>
          <div className="students-list">
            {students.length > 0 ? (
              students.map((student) => (
                <div
                  key={student._id}
                  className={`student-item ${
                    selectedStudent?._id === student._id ? "active" : ""
                  }`}
                  onClick={() => selectStudent(student)}
                >
                  <div className="student-avatar">
                    {student.profilePicture ? (
                      <img src={student.profilePicture} alt={student.firstName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {student.firstName?.[0] || "U"}
                      </div>
                    )}
                  </div>
                  <div className="student-info">
                    <h3>
                      {student.firstName} {student.lastName}
                      {student.verified && (
                        <span className="verified-chip">Verified</span>
                      )}
                    </h3>
                    {student.skills && student.skills.length > 0 && (
                      <p className="student-skills">
                        Skills: {student.skills.slice(0, 3).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-students">
                <p>No students available</p>
                <p style={{ fontSize: "0.85rem", marginTop: "0.5rem", color: "#6b7280" }}>
                  Create another account to start chatting!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {selectedStudent ? (
            <>
              <div className="chat-header-bar">
                <div className="chat-user-info">
                  <div className="chat-user-avatar">
                    {selectedStudent.profilePicture ? (
                      <img
                        src={selectedStudent.profilePicture}
                        alt={selectedStudent.firstName}
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        {selectedStudent.firstName?.[0] || "U"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3>
                      {selectedStudent.firstName} {selectedStudent.lastName}
                        {selectedStudent.verified && (
                          <span className="verified-chip">Verified</span>
                        )}
                    </h3>
                    {selectedStudent.skills && (
                      <p className="chat-user-skills">
                        {selectedStudent.skills.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="messages-container">
                {messages.length > 0 ? (
                  messages.map((msg, index) => {
                    const isOwnMessage =
                      (msg.sender?._id || msg.sender) === (user._id || user.id);
                    return (
                      <div
                        key={index}
                        className={`message ${isOwnMessage ? "own" : "other"}`}
                      >
                        <div className="message-content">{msg.message}</div>
                        <div className="message-time">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-messages">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="message-input-container">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="message-input"
                />
                <button onClick={sendMessage} className="send-button">
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <p>Select a student to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;

