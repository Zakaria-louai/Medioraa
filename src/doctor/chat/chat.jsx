import { useState } from "react";
import styles from "./chat.module.css";
import { getChatContacts, getConversationMessages, patchConversation } from "../../api/api";
import { useEffect } from "react";
import { useRef } from "react";
import { useMemo } from "react";

// MOCK CONVERSATION FOR TESTING
const MOCK_CONVERSATION = {
  id: "mock-conv-001",
  name: "Test Patient",
  avatar: "/default-avatar.png",
  lastMessage: "This is a test message",
  lastMessageTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  unreadCount: 1,
  isOnline: true,
  isMock: true
};

// MOCK MESSAGES FOR TESTING
const MOCK_MESSAGES = [
  {
    id: "mock-msg-1",
    text: "Hello doctor, I have a question about my medication",
    timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    isSentByMe: false,
    senderName: "Test Patient",
    senderAvatar: "/default-avatar.png"
  },
  {
    id: "mock-msg-2",
    text: "Of course, what would you like to know?",
    timestamp: new Date(Date.now() - 3500000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    isSentByMe: true,
    isPending: false
  },
  {
    id: "mock-msg-3",
    text: "Is it safe to take this with my other medications?",
    timestamp: new Date(Date.now() - 3400000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    isSentByMe: false,
    senderName: "Test Patient",
    senderAvatar: "/default-avatar.png"
  }
];

// MOCK PATIENT PROFILE
const MOCK_PATIENT_PROFILE = {
  name: "Test Patient",
  picture: "/default-avatar.png",
  nextAppointment: {
    date: "2024-12-15",
    time: "10:30 AM"
  },
  documents: [
    { id: "doc1", name: "Lab Results.pdf", size: "2.4 MB", date: "2024-11-20", type: "pdf", url: "#" },
    { id: "doc2", name: "X-Ray Image.png", size: "1.8 MB", date: "2024-11-15", type: "img", url: "#" },
    { id: "doc3", name: "Prescription.pdf", size: "856 KB", date: "2024-11-10", type: "pdf", url: "#" }
  ]
};

function Chat() {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [conversationMessages, setConversationMessages] = useState({});
  const [patientProfile, setPatientProfile] = useState({
    name: "",
    picture: "",
    nextAppointment: {
      date: "",
      time: ""
    },
    documents: []
  });
  const fileInputRef = useRef(null);
  
  // WebSocket ref
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  
  // Fix #1: Store selectedConversation in ref to avoid stale closure
  const selectedConversationRef = useRef(null);
  
  // Fix #2: Typing timeout ref instead of window
  const typingTimeoutRef = useRef(null);
  
  // Fix #3: Typing reset ref for race condition
  const typingResetRef = useRef(null);
  
  // Track message IDs to prevent duplicates (Fix #4)
  const messageIdsRef = useRef(new Set());

  // Update ref when selectedConversation changes
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // WebSocket connection function with reconnect (Fix #6)
  const connectWebSocket = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("No token found");
      return;
    }

    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close existing connection if any
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      wsRef.current.close();
    }

    const wsUrl = `wss://mediora-back-2.onrender.com/chat/ws?token=${token}`;
    console.log("Connecting to:", wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      
      // Clear message IDs on reconnect to prevent stale state
      messageIdsRef.current.clear();
    };

    ws.onmessage = (event) => {
      console.log("MESSAGE:", event.data);

      try {
        const data = JSON.parse(event.data);
        console.log("Parsed:", data);
        
        // Use ref to get current selectedConversation
        const currentSelectedConv = selectedConversationRef.current;
        
        if (data.type === "message.new") {
          // New message received
          const newMsg = {
            id: data.payload.id || Date.now(),
            text: data.payload.message || data.payload.text || "",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isSentByMe: false,
            senderName: currentSelectedConv?.name || "Patient",
            senderAvatar: currentSelectedConv?.avatar || "/default-avatar.png"
          };
          
          // Fix #4: Message deduplication
          if (currentSelectedConv && data.payload.conversation_id === currentSelectedConv.id) {
            setMessages(prev => {
              // Check if message already exists
              if (prev.some(m => m.id === newMsg.id)) {
                console.log("Duplicate message prevented:", newMsg.id);
                return prev;
              }
              return [...prev, newMsg];
            });
          }
          
          // Update conversation list with new message preview
          setConversations(prev => 
            prev.map(conv => 
              conv.id === data.payload.conversation_id
                ? { 
                    ...conv, 
                    lastMessage: newMsg.text,
                    lastMessageTime: newMsg.timestamp,
                    unreadCount: currentSelectedConv?.id === conv.id ? 0 : (conv.unreadCount || 0) + 1
                  }
                : conv
            )
          );
        } else if (data.type === "message.sent") {
          // Fix #5: Always rely on tempId for matching
          const tempId = data.payload.tempId;
          if (tempId) {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === tempId
                  ? { ...msg, isPending: false, id: data.payload.id || msg.id }
                  : msg
              )
            );
          } else {
            console.warn("Received message.sent without tempId, cannot reliably match");
            // Fallback only for legacy messages without tempId
            if (data.payload.id) {
              setMessages(prev =>
                prev.map(msg =>
                  msg.isPending === true && !msg.id.toString().startsWith('real_')
                    ? { ...msg, isPending: false, id: data.payload.id }
                    : msg
              )
            );
            }
          }
        } else if (data.type === "user.typing") {
          // Fix #3: Handle typing indicator with race condition fix
          if (currentSelectedConv && data.payload.conversation_id === currentSelectedConv.id) {
            setIsTyping(data.payload.is_typing);
            
            // Only set auto-clear for active typing
            if (data.payload.is_typing) {
              // Clear any existing timeout
              if (typingResetRef.current) {
                clearTimeout(typingResetRef.current);
              }
              
              // Set new timeout to clear typing indicator after 2 seconds of no updates
              typingResetRef.current = setTimeout(() => {
                setIsTyping(false);
              }, 2000);
            }
          }
        }
      } catch (err) {
        console.log("Non JSON message:", event.data);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    ws.onclose = (event) => {
      console.log("WebSocket closed");
      console.log("Code:", event.code);
      console.log("Reason:", event.reason);
      setIsConnected(false);
      
      // Fix #6: Reconnect logic
      if (event.code !== 1000) { // Don't reconnect on normal closure
        console.log("Attempting to reconnect in 3 seconds...");
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      }
    };
  };

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();

    return () => {
      // Cleanup
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (typingResetRef.current) {
        clearTimeout(typingResetRef.current);
      }
    };
  }, []); // Empty dependency array

  // Send typing indicator
  const sendTypingIndicator = (isTyping) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && selectedConversation && !selectedConversation.isMock) {
      wsRef.current.send(JSON.stringify({
        type: "message.typing",
        payload: {
          conversation_id: selectedConversation.id,
          is_typing: isTyping
        }
      }));
    }
  };

  // Handle input change with typing indicator
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Send typing indicator
    if (e.target.value.length > 0) {
      sendTypingIndicator(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false);
      }, 1000);
    } else {
      sendTypingIndicator(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleConversationClick = async (conversation) => {
    try {
      setSelectedConversation(conversation);
      messageIdsRef.current.clear();
console.log("FULL CONVERSATION:", conversation);
      if (conversation.isMock) {
        console.log("Using mock conversation data");
        setMessages(MOCK_MESSAGES);
        setPatientProfile(MOCK_PATIENT_PROFILE);
        return;
      }

      if (conversation.id) {
        console.log("Fetching real conversation:", conversation.id);
        const data = await getConversationMessages(conversation.id);
        console.log("Messages data:", data);
        
        // Handle different response structures
        let messagesArray = [];
        if (data && data.data && Array.isArray(data.data)) {
          messagesArray = data.data;
        } else if (data && Array.isArray(data)) {
          messagesArray = data;
        } else if (data && data.messages && Array.isArray(data.messages)) {
          messagesArray = data.messages;
        } else {
          messagesArray = [];
        }
        
        console.log("Messages array:", messagesArray);
        
        const formattedMessages = messagesArray.map((msg) => ({
          id: msg.id,
          text: msg.body || msg.message || msg.text || "",
          timestamp: msg.created_at || msg.createdAt
            ? new Date(msg.created_at || msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isSentByMe: msg.sender_type === "doctor" || msg.sender_id === localStorage.getItem("doctorId"),
          senderName: msg.sender_name || msg.senderName,
          senderAvatar: msg.sender_avatar || msg.senderAvatar
        }));
        
        formattedMessages.forEach(msg => messageIdsRef.current.add(msg.id));
        setMessages(formattedMessages);
        setConversationMessages((prev) => ({
              ...prev,
              [conversation.id]: formattedMessages,
            }));
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "message.read",
            payload: {
              conversation_id: conversation.id
            }
          }));
        }
      }
      
      setPatientProfile({
        name: conversation.name,
        picture: conversation.avatar,
        nextAppointment: { date: "", time: "" },
        documents: []
      });
      
    } catch (error) {
      console.error("Error fetching conversation:", error);
      setMessages(conversationMessages[conversation.id] || []);
    }
  };

 const fetchConversations = async () => {
  try {
    setLoading(true);
    const data = await getChatContacts();
    console.log("Raw conversations data:", data);
    
    // Handle different response structures
    let conversationsArray = [];
    if (data && data.data && Array.isArray(data.data)) {
      conversationsArray = data.data;
    } else if (data && Array.isArray(data)) {
      conversationsArray = data;
    } else if (data && data.conversations && Array.isArray(data.conversations)) {
      conversationsArray = data.conversations;
    } else {
      conversationsArray = [];
    }
    
    console.log("Conversations array:", conversationsArray);
    
    if (conversationsArray.length > 0) {
      const formattedConversations = conversationsArray.map((conv) => ({
        id: conv.id,
        name: conv.name || conv.patient_name || conv.username || "Unknown Patient",
        avatar: conv.avatar || conv.patient_avatar || conv.user?.picture || "",
        lastMessage: conv.last_message || conv.latest_message || conv.lastMessage || "No messages yet",
        lastMessageTime: conv.last_message_time || conv.updated_at || conv.created_at
          ? new Date(conv.last_message_time || conv.updated_at || conv.created_at).toLocaleTimeString([], { 
              hour: "2-digit", minute: "2-digit" 
            })
          : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        unreadCount: conv.unread_count || 0,
        isOnline: conv.is_online || false,
        isMock: false
      }));
      
      console.log("Formatted conversations:", formattedConversations);
      
      // Show all conversations (no filtering)
      if (formattedConversations.length > 0) {
        setConversations(formattedConversations);
      } else {
        setConversations([{ ...MOCK_CONVERSATION, isMock: true }]);
      }
    } else {
      setConversations([{ ...MOCK_CONVERSATION, isMock: true }]);
    }
    
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    setConversations([{ ...MOCK_CONVERSATION, isMock: true }]);
  } finally {
    setLoading(false);
  }
};

  const handleRenameConversation = async () => {
    console.log("handleRenameConversation called");
    console.log("editingName:", editingName);
    console.log("selectedConversation:", selectedConversation);
    
    if (!editingName.trim() || !selectedConversation) {
      console.log("Validation failed - no name or no conversation");
      return;
    }
    
    // Don't try to rename mock conversations
    if (selectedConversation.isMock) {
      console.log("Cannot rename mock conversation - updating locally only");
      setSelectedConversation({
        ...selectedConversation,
        name: editingName
      });
      setConversations(prevConversations =>
        prevConversations.map(conv =>
          conv.id === selectedConversation.id
            ? { ...conv, name: editingName }
            : conv
        )
      );
      setIsEditingName(false);
      setEditingName("");
      return;
    }
    
    try {
      console.log("Calling patchConversation with:", selectedConversation.id, editingName);
      const response = await patchConversation(selectedConversation.id, editingName);
      console.log("Conversation renamed, response:", response);
      
      setSelectedConversation({
        ...selectedConversation,
        name: editingName
      });
      
      setConversations(prevConversations =>
        prevConversations.map(conv =>
          conv.id === selectedConversation.id
            ? { ...conv, name: editingName }
            : conv
        )
      );
      
      setIsEditingName(false);
      setEditingName("");
      
    } catch (error) {
      console.error("Failed to rename conversation:", error);
      alert("Failed to rename conversation. Please try again.");
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const tempId = Date.now();
    
    // Send via WebSocket if connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !selectedConversation.isMock) {
              const messageToSend = {
        type: "message.send",
        payload: {
          conversation_id: selectedConversation.id,
          message: newMessage
        }
      };
      
      console.log("Sending message via WebSocket:", messageToSend);
      wsRef.current.send(JSON.stringify(messageToSend));
      
      // Add temporary message to UI
      const tempMessage = {
        id: tempId,
        text: newMessage,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isSentByMe: true,
        isPending: true,
      };
      
    setMessages((prev) => [...prev, tempMessage]);

      setConversationMessages((prev) => ({
        ...prev,
        [selectedConversation.id]: [
          ...(prev[selectedConversation.id] || []),
          tempMessage,
        ],
      }));
      setNewMessage("");
      
      // Clear typing indicator
      sendTypingIndicator(false);
    } else if (selectedConversation.isMock) {
      // Handle mock conversation
      const tempMessage = {
        id: tempId,
        text: newMessage,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isSentByMe: true,
        isPending: false,
      };
      
      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage("");
      console.log("Message sent to mock conversation");
    } else {
      console.log("WebSocket not connected, cannot send message");
      alert("Connection lost. Please refresh the page.");
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    console.log("Files selected:", files);
    
    for (const file of files) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }
      
      // Create a temporary message for the file
      const fileMessage = {
        id: Date.now(),
        text: `📎 ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isSentByMe: true,
        isPending: true,
        isFile: true,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      };
      
      // Add to messages immediately
      setMessages((prev) => [...prev, fileMessage]);
      
      // Simulate upload
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === fileMessage.id
              ? { ...msg, isPending: false, text: `✅ ${file.name} (${(file.size / 1024).toFixed(2)} KB)` }
              : msg
          )
        );
      }, 2000);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleDownloadDocument = (doc) => {
    console.log("Download document:", doc);
    if (doc.url && doc.url !== "#") {
      window.open(doc.url, '_blank');
    } else {
      alert("Document URL not available");
    }
  };

  const handleViewAllDocuments = () => {
    console.log("View all documents");
  };

  const handleOpenPatientFile = () => {
    console.log("Open patient file for:", patientProfile.name);
  };

  // Fix #8: Use useMemo for filtered conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv =>
      conv.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  return (
    <div className={styles.chatContainer}>
      <div className={styles.threePane}>

        {/* Left Pane: Conversation List */}
        <aside className={styles.convList}>
          <div className={styles.convSearch}>
            <div className={styles.searchWrap}>
              <span className="material-symbols-outlined">search</span>
              <input 
                type="text" 
                placeholder="Search patients..."
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>

          <div className={styles.convScroll}>
            {loading && <div className={styles.loading}>Loading conversations...</div>}
            
            {/* WebSocket connection status indicator */}
            {selectedConversation && !selectedConversation.isMock && (
              <div className={`${styles.connectionStatus} ${isConnected ? styles.connected : styles.disconnected}`}>
                <span className={styles.statusDotSmall}></span>
                <span>{isConnected ? "Connected (Secure)" : "Connecting to secure chat..."}</span>
              </div>
            )}
            
            {filteredConversations.map((conversation) => (
              <div 
                key={conversation.id}
                className={`${styles.convItem} ${selectedConversation?.id === conversation.id ? styles.active : ''}`}
                onClick={() => handleConversationClick(conversation)}
              >
                <div className={styles.convAvatar}>
                  <img alt={conversation.name} src={conversation.avatar || "/default-avatar.png"}/>
                  {conversation.isOnline && <div className={styles.onlineDot}></div>}
                  {conversation.isOnline === false && <div className={styles.offlineDot}></div>}
                  {conversation.unreadCount > 0 && (
                    <div className={styles.unreadBadge}>{conversation.unreadCount}</div>
                  )}
                </div>
                <div className={styles.convMeta}>
                  <div className={styles.convRow}>
                    <span className={styles.convName}>{conversation.name}</span>
                    <span className={styles.convTime}>{conversation.lastMessageTime}</span>
                  </div>
                  <p className={`${styles.convPreview} ${conversation.isTyping ? styles.typing : ''}`}>
                    {conversation.isTyping ? "Typing..." : conversation.lastMessage}
                  </p>
                </div>
              </div>
            ))}
            
            {!loading && filteredConversations.length === 0 && (
              <div className={styles.noResults}>No conversations found</div>
            )}
          </div>
        </aside>

        {/* Center Pane: Chat Window */}
        <main className={styles.chatMain}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className={styles.chatHeader}>
                <div className={styles.chatHeaderLeft}>
                  <div className={styles.chatAvatarIcon}>
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div>
                    {isEditingName ? (
                      <div className={styles.editNameContainer}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameConversation();
                            if (e.key === "Escape") setIsEditingName(false);
                          }}
                          className={styles.editNameInput}
                          autoFocus
                        />
                        <button onClick={handleRenameConversation} className={styles.saveNameBtn}>
                          <span className="material-symbols-outlined">check</span>
                        </button>
                        <button onClick={() => setIsEditingName(false)} className={styles.cancelNameBtn}>
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    ) : (
                      <div className={styles.chatNameWrapper}>
                        <h2 className={styles.chatName}>{selectedConversation.name}</h2>
                        <button 
                          onClick={() => {
                            console.log("Edit icon clicked");
                            setEditingName(selectedConversation.name);
                            setIsEditingName(true);
                          }} 
                          className={styles.editNameIcon}
                          title="Rename conversation"
                          type="button"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                      </div>
                    )}
                    <div className={styles.chatStatus}>
                      <span className={styles.statusDot}></span>
                      <span className={styles.statusLabel}>
                        {selectedConversation.isOnline ? "Active Secure Session" : "Offline"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Typing Indicator */}
              {isTyping && (
                <div className={styles.typingIndicator}>
                  <span>Patient is typing...</span>
                </div>
              )}

              {/* Message Feed */}
              <div className={styles.msgFeed}>
                <div className={styles.encBanner}>
                  <div className={styles.encPill}>
                    <span className="material-symbols-outlined">encrypted</span>
                    <span className={styles.text}>Messages are end-to-end encrypted</span>
                  </div>
                </div>

                {messages.length === 0 && (
                  <div className={styles.welcomeMessage}>
                    <span className="material-symbols-outlined">chat</span>
                    <h4>Start a conversation</h4>
                    <p>Send a message to {selectedConversation.name}</p>
                  </div>
                )}

                {messages.map((message) => (
                  message.isSentByMe ? (
                    <div key={message.id} className={styles.msgOut}>
                      <div className={styles.msgOutBody}>
                        <div className={`${styles.bubbleOut} ${message.isFile ? styles.fileBubble : ''}`}>
                          <p>{message.text}</p>
                        </div>
                        <div className={styles.msgOutMeta}>
                          <span className={styles.msgTime}>
                            {message.timestamp}
                          </span>
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontVariationSettings: "'FILL' 1",
                            }}
                          >
                            {message.isPending ? "schedule" : "check_circle"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={message.id} className={styles.msgIn}>
                      <img
                        className={styles.msgInAvatar}
                        alt={message.senderName}
                        src={
                          message.senderAvatar ||
                          "/default-avatar.png"
                        }
                      />
                      <div className={styles.msgInBody}>
                        <div className={`${styles.bubbleIn} ${message.isFile ? styles.fileBubble : ''}`}>
                          <p>{message.text}</p>
                        </div>
                        <span className={styles.msgTime}>
                          {message.timestamp}
                        </span>
                      </div>
                    </div>
                  )
                ))}

                <div ref={messagesEndRef}></div>
              </div>

              {/* Input Console */}
              <div className={styles.inputConsole}>
                <div className={styles.inputWrap}>
                  <button className={styles.inputAttach} onClick={() => fileInputRef.current?.click()}>
                    <span className="material-symbols-outlined">add</span>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      hidden 
                      onChange={handleFileUpload}
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                  </button>
                  <input 
                    className={styles.msgInput} 
                    type="text" 
                    placeholder="Type a secure message..."
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage();
                      }
                    }}
                  />
                  <div className={styles.inputActions}>
                    <button className={styles.sendBtn} onClick={handleSendMessage}>
                      <span>Send</span>
                      <span className="material-symbols-outlined">send</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.noConversationSelected}>
              <span className="material-symbols-outlined">chat</span>
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </main>

        {/* Right Pane: Patient Context Sidebar */}
        <aside className={styles.patientSidebar}>
          {selectedConversation ? (
            <>
              <div className={styles.patientProfile}>
                <img className={styles.patientProfilePic} alt={patientProfile.name} src={patientProfile.picture || "/default-avatar.png"}/>
                <h3 className={styles.patientName}>{patientProfile.name || selectedConversation.name}</h3>
              </div>

              <div className={styles.patientDetails}>
                <section>
                  <p className={styles.detailSectionTitle}>Upcoming Events</p>
                  <div className={styles.apptCard}>
                    <div className={styles.apptInner}>
                      <div className={styles.apptIcon}>
                        <span className="material-symbols-outlined">calendar_today</span>
                      </div>
                      <div>
                        <p className={styles.apptTitle}>Next Appointment</p>
                        {patientProfile.nextAppointment?.date && patientProfile.nextAppointment?.time ? (
                          <p className={styles.apptDate}>
                            {patientProfile.nextAppointment.date} • {patientProfile.nextAppointment.time}
                          </p>
                        ) : (
                          <p className={styles.noEvents}>No upcoming events</p>
                        )}
                        <button className={styles.apptManage}>Manage Schedule</button>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <div className={styles.detailSectionHeader}>
                    <p className={styles.detailSectionTitle} style={{ marginBottom: 0 }}>Shared Documents</p>
                    <span className={styles.viewAll} onClick={handleViewAllDocuments}>View All</span>
                  </div>
                  <div className={styles.docList}>
                    {patientProfile.documents && patientProfile.documents.length > 0 ? (
                      patientProfile.documents.map((doc, index) => (
                        <div key={index} className={styles.docItem} onClick={() => handleDownloadDocument(doc)}>
                          <div className={`${styles.docIcon} ${doc.type === 'pdf' ? styles.docIconPdf : styles.docIconImg}`}>
                            <span className="material-symbols-outlined">
                              {doc.type === 'pdf' ? 'picture_as_pdf' : 'image'}
                            </span>
                          </div>
                          <div className={styles.docMeta}>
                            <p className={styles.docName}>{doc.name}</p>
                            <p className={styles.docSize}>{doc.size} • {doc.date}</p>
                          </div>
                          <span className={`material-symbols-outlined ${styles.docDl}`}>download</span>
                        </div>
                      ))
                    ) : (
                      <div className={styles.noDocuments}>
                        <span className="material-symbols-outlined">folder</span>
                        <p>No documents available</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className={styles.patientFooter}>
                <button className={styles.openFileBtn} onClick={handleOpenPatientFile}>
                  <span className="material-symbols-outlined">medical_information</span>
                  Open Patient File
                </button>
              </div>
            </>
          ) : (
            <div className={styles.noPatientSelected}>
              <span className="material-symbols-outlined">medical_information</span>
              <p>Select a patient to view details</p>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
}

export default Chat;