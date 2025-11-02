import { useState, useEffect, useRef } from "react";
import { Send, Users, Smile, ArrowLeft, Menu } from "lucide-react";
import io from "socket.io-client";

// ✅ Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const socket = io.connect(API_URL);

export default function App() {
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const messagesEndRef = useRef(null);
  const [isReconnecting, setIsReconnecting] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const emojis = [
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
    "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩",
    "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜",
    "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐",
    "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬",
    "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙",
    "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "🤲",
    "🙏", "💪", "❤️", "🧡", "💛", "💚", "💙", "💜",
    "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓",
    "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉",
    "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉",
  ];

  useEffect(() => {
    const savedUsername = localStorage.getItem("chatUsername");
    if (savedUsername) {
      setUsername(savedUsername);
      socket.emit("register_user", savedUsername);
      setJoined(true);
    }
    setIsReconnecting(false);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const joinChat = () => {
    if (!username.trim()) return;
    localStorage.setItem("chatUsername", username);
    socket.emit("register_user", username);
    setJoined(true);
  };

  const logout = () => {
    socket.emit("user_logout", username);
    localStorage.removeItem("chatUsername");
    setJoined(false);
    setUsername("");
    setSelectedUser(null);
    setMessages([]);
    setTimeout(() => {
      socket.disconnect();
      window.location.reload();
    }, 100);
  };

  const selectUser = async (user) => {
    setSelectedUser(user.username);
    setShowSidebar(false);
    try {
      const res = await fetch(`${API_URL}/messages/${username}/${user.username}`);
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const sendMessage = () => {
    if (!msg.trim() || !selectedUser) return;

    const messageData = {
      message: msg,
      sender: username,
      receiver: selectedUser,
      timestamp: new Date(),
    };

    socket.emit("send_message", messageData);
    setMessages((prev) => [...prev, messageData]);
    setMsg("");
    setShowEmojiPicker(false);
  };

  const addEmoji = (emoji) => {
    setMsg((prev) => prev + emoji);
  };

  useEffect(() => {
    const handleReceive = (data) => {
      if (selectedUser === data.sender) {
        setMessages((prev) => [...prev, data]);
      }
    };

    const handleUsersUpdate = (users) => {
      setAllUsers(users.filter((u) => u.username !== username));
    };

    socket.on("receive_message", handleReceive);
    socket.on("users_update", handleUsersUpdate);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("users_update", handleUsersUpdate);
    };
  }, [username, selectedUser]);

  const formatTime = (time) => {
    const date = new Date(time);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatLastSeen = (lastSeen) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (!joined || isReconnecting) {
    if (isReconnecting) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Reconnecting...</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 w-full max-w-md">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Welcome to Chat
            </h1>
            <p className="text-sm md:text-base text-gray-600">Enter your name to get started</p>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter your name..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition text-base"
              onChange={(e) => setUsername(e.target.value)}
              value={username}
              onKeyDown={(e) => e.key === "Enter" && joinChat()}
            />
            <button
              onClick={joinChat}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              Join Chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex overflow-hidden">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex w-full md:w-80 bg-white border-r border-gray-200 flex-col absolute md:relative z-20 h-full`}>
        <div className="p-3 md:p-4 border-b border-gray-200 bg-indigo-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg md:text-xl font-bold">Chat App</h2>
              <p className="text-xs md:text-sm text-indigo-100">Logged in as: {username}</p>
            </div>
            <button
              onClick={logout}
              className="text-xs bg-indigo-700 hover:bg-indigo-800 px-2 md:px-3 py-1 rounded transition"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="p-3 md:p-4 flex items-center gap-2 border-b border-gray-200">
          <Users className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
          <h3 className="text-sm md:text-base font-semibold text-gray-700">All Users</h3>
        </div>

        <div className="flex-1 overflow-y-auto">
          {allUsers.length === 0 ? (
            <div className="p-3 md:p-4 text-center text-gray-500 text-sm">
              No other users yet
            </div>
          ) : (
            allUsers.map((user, index) => (
              <div
                key={index}
                onClick={() => selectUser(user)}
                className={`p-3 md:p-4 cursor-pointer hover:bg-gray-50 transition border-b border-gray-100 ${
                  selectedUser === user.username ? "bg-indigo-50 border-l-4 border-indigo-600" : ""
                }`}
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br ${
                    user.isOnline 
                      ? "from-indigo-400 to-purple-500" 
                      : "from-gray-400 to-gray-500"
                  } flex items-center justify-center text-white font-bold text-sm md:text-base`}>
                    {user.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{user.username}</p>
                    {user.isOnline ? (
                      <p className="text-xs md:text-sm text-green-500">● Online</p>
                    ) : (
                      <p className="text-xs md:text-sm text-gray-400">
                        ○ Last seen {formatLastSeen(user.lastSeen)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${!showSidebar || selectedUser ? 'flex' : 'hidden'} md:flex flex-1 flex-col w-full`}>
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
            <div className="text-center">
              <button
                onClick={() => setShowSidebar(true)}
                className="md:hidden mb-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                <Menu className="w-5 h-5 inline mr-2" />
                Show Users
              </button>
              <Users className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">
                No Chat Selected
              </h3>
              <p className="text-sm md:text-base text-gray-500">
                Select a user from the sidebar to start chatting
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-3 md:p-4 bg-white border-b border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="md:hidden text-gray-600 hover:text-indigo-600 mr-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {(() => {
                  const user = allUsers.find(u => u.username === selectedUser);
                  return (
                    <>
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br ${
                        user?.isOnline 
                          ? "from-indigo-400 to-purple-500" 
                          : "from-gray-400 to-gray-500"
                      } flex items-center justify-center text-white font-bold text-sm md:text-base`}>
                        {selectedUser[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm md:text-base font-semibold text-gray-800">{selectedUser}</h3>
                        {user?.isOnline ? (
                          <p className="text-xs md:text-sm text-green-500">● Online</p>
                        ) : (
                          <p className="text-xs md:text-sm text-gray-400">
                            ○ Last seen {user ? formatLastSeen(user.lastSeen) : 'recently'}
                          </p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-gray-50">
              {messages.map((m, index) => {
                const isSender = m.sender === username;
                return (
                  <div
                    key={index}
                    className={`mb-3 md:mb-4 flex ${isSender ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] md:max-w-xs lg:max-w-md px-3 md:px-4 py-2 rounded-2xl ${
                        isSender
                          ? "bg-indigo-600 text-white rounded-br-none"
                          : "bg-white text-gray-800 rounded-bl-none shadow"
                      }`}
                    >
                      <p className="break-words text-sm md:text-base">{m.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isSender ? "text-indigo-200" : "text-gray-500"
                        }`}
                      >
                        {formatTime(m.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 md:p-4 bg-white border-t border-gray-200">
              <div className="flex gap-1 md:gap-2 items-end relative">
                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div className="absolute bottom-14 md:bottom-16 left-0 bg-white border border-gray-300 rounded-lg shadow-xl p-2 md:p-3 w-64 md:w-80 max-h-48 md:max-h-64 overflow-y-auto z-10">
                    <div className="grid grid-cols-6 md:grid-cols-8 gap-1 md:gap-2">
                      {emojis.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => addEmoji(emoji)}
                          className="text-xl md:text-2xl hover:bg-gray-100 rounded p-1 transition"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emoji Button */}
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-gray-500 hover:text-indigo-600 p-2 md:p-3 transition"
                >
                  <Smile className="w-5 h-5 md:w-6 md:h-6" />
                </button>

                {/* Message Input */}
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1 px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-full focus:outline-none focus:border-indigo-500 transition"
                />

                {/* Send Button */}
                <button
                  onClick={sendMessage}
                  className="bg-indigo-600 text-white p-2 md:p-3 rounded-full hover:bg-indigo-700 transition"
                >
                  <Send className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}