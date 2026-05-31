import { useState, useEffect, useRef, useMemo } from "react";
import styles from "./chat.module.css";
import { getContacts, getMessages, renameConversation } from "../../api/api.jsx";

// ─── MOCK FALLBACKS (used if API fails during dev) ───────────────────────────

const MOCK_CONVERSATION = {
  id: "mock-conv-001",
  name: "Test Patient",
  avatar: "/default-avatar.png",
  lastMessage: "This is a test message",
  lastMessageTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  unreadCount: 1,
  isOnline: true,
  isMock: true,
};

const MOCK_MESSAGES = [
  {
    id: "mock-msg-1",
    text: "Hello doctor, I have a question about my medication",
    timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    isSentByMe: false,
    senderName: "Test Patient",
    senderAvatar: "/default-avatar.png",
  },
  {
    id: "mock-msg-2",
    text: "Of course, what would you like to know?",
    timestamp: new Date(Date.now() - 3500000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    isSentByMe: true,
    isPending: false,
  },
  {
    id: "mock-msg-3",
    text: "Is it safe to take this with my other medications?",
    timestamp: new Date(Date.now() - 3400000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    isSentByMe: false,
    senderName: "Test Patient",
    senderAvatar: "/default-avatar.png",
  },
];

const MOCK_PATIENT_PROFILE = {
  name: "Test Patient",
  picture: "/default-avatar.png",
  nextAppointment: { date: "2024-12-15", time: "10:30 AM" },
  documents: [
    { id: "doc1", name: "Lab Results.pdf",  size: "2.4 MB", date: "2024-11-20", type: "pdf", url: "#" },
    { id: "doc2", name: "X-Ray Image.png",  size: "1.8 MB", date: "2024-11-15", type: "img", url: "#" },
    { id: "doc3", name: "Prescription.pdf", size: "856 KB", date: "2024-11-10", type: "pdf", url: "#" },
  ],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const LIMIT     = 10;  // contacts per page
const MSG_LIMIT = 20;  // messages per page

/** Map a raw backend contact object to the shape the UI expects.
 *
 * Response shape:
 * {
 *   id, name, is_group, last_message, created_at,
 *   user: { id, first_name, last_name, username, picture }
 * }
 *
 * The conversation `name` field defaults to "for later" on the backend,
 * so we always derive the display name from user.first_name + user.last_name.
 */
function mapContact(c) {
  const user       = c.user ?? {};
  const firstName  = user.first_name ?? "";
  const lastName   = user.last_name  ?? "";
  const fullName   = [firstName, lastName].filter(Boolean).join(" ") || user.username || "Unknown";

  return {
    id:          c.id,
    name:        fullName,
    avatar:      user.picture ?? "/default-avatar.png",
    lastMessage: c.last_message ?? "",
    lastMessageTime: c.created_at
      ? new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "",
    isOnline:              false,
    unreadCount:           0,
    userId:                user.id,
    username:              user.username,
    conversationCreatedAt: c.created_at ?? "", // used for dedup: keep most recent conversation per user
    isMock:                false,
  };
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

function Chat() {
  const [conversations, setConversations]               = useState([]);
  const [messages, setMessages]                         = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery]                   = useState("");
  const [newMessage, setNewMessage]                     = useState("");
  const [isTyping, setIsTyping]                         = useState(false);
  const [loading, setLoading]                           = useState(false);
  const [loadingMessages, setLoadingMessages]           = useState(false);
  const [page, setPage]                                 = useState(1);
  const [hasMore, setHasMore]                           = useState(true);
  const [msgPage, setMsgPage]                           = useState(1);
  const [hasMoreMessages, setHasMoreMessages]           = useState(false);
  const [isEditingName, setIsEditingName]               = useState(false);
  const [editingName, setEditingName]                   = useState("");
  const [isConnected, setIsConnected]                   = useState(false); // WebSocket connection status
  const [patientProfile, setPatientProfile]             = useState({
    name: "",
    picture: "",
    nextAppointment: { date: "", time: "" },
    documents: [],
  });

  const messagesEndRef    = useRef(null);
  const fileInputRef      = useRef(null);
  const typingTimeoutRef  = useRef(null);
  const wsRef             = useRef(null);   // WebSocket instance
  const pingRef           = useRef(null);   // setInterval for ping keepalive
  const currentConvIdRef  = useRef(null);   // tracks open conversation id
  const reconnectTimeoutRef = useRef(null); // for reconnection

  // ── Auto-scroll to latest message ─────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Fetch contacts from backend ────────────────────────────────────────────
  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      try {
        const response = await getContacts(page, LIMIT);

        // Backend may wrap the array in .data or return it directly
        const raw = response.data?.data ?? response.data ?? [];
        const contacts = Array.isArray(raw) ? raw : [];

        const mapped = contacts.map(mapContact);

        // Deduplicate by userId — same patient may have multiple conversations;
        // keep the entry whose conversation was created most recently.
        const deduped = Object.values(
          mapped.reduce((acc, contact) => {
            const key = contact.userId;
            if (!acc[key]) {
              acc[key] = contact;
            } else {
              // compare by lastMessageTime string isn't reliable; use raw created_at
              // We stored conversationCreatedAt on the mapped object for this purpose
              if (contact.conversationCreatedAt > acc[key].conversationCreatedAt) {
                acc[key] = contact;
              }
            }
            return acc;
          }, {})
        );

        setConversations((prev) =>
          page === 1 ? deduped : [...prev, ...deduped]
        );
        setHasMore(mapped.length === LIMIT);
      } catch (error) {
        console.error("Failed to fetch contacts:", error);
        // Fall back to mock so the UI is never broken during development
        if (page === 1) {
          setConversations([MOCK_CONVERSATION]);
        }
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [page]);

  // ── Input / typing ────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      // typing stopped — could emit socket event here later
    }, 1000);
  };

  // ── Map a raw message from the backend to the UI shape ───────────────────
  // Doctor's id is stored under the key "doctorId" in localStorage
  const myDoctorId = localStorage.getItem("doctorId");

  function mapMessage(m) {
    const senderId   = m.sender_id;
    // Convert both to string for comparison
    const isMine     = String(senderId) === String(myDoctorId);
    const sender     = m.sender ?? {};

    return {
      id:           m.id,
      text:         m.body ?? "",
      timestamp:    m.created_at
        ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "",
      isSentByMe:   isMine,
      isPending:    false,
      isRead:       m.is_read ?? false,
      senderName:   isMine ? "Me" : `${sender.first_name ?? ""} ${sender.last_name ?? ""}`.trim(),
      senderAvatar: isMine ? null : (sender.picture ?? "/default-avatar.png"),
    };
  }

  // ── Fetch messages for a conversation (merges, no duplicates) ────────────
  const fetchMessages = async (convId, pageNum = 1, append = false) => {
    if (!convId) return;
    try {
      if (!append) setLoadingMessages(true);
      const response = await getMessages(convId, pageNum, MSG_LIMIT);
      const raw      = response.data?.data ?? response.data ?? [];
      const msgs     = (Array.isArray(raw) ? raw : []).map(mapMessage);

      const ordered = pageNum === 1 ? [...msgs].reverse() : msgs;

      if (append) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newOnes     = ordered.filter((m) => !existingIds.has(m.id));
          return [...newOnes, ...prev];
        });
      } else {
        setMessages(ordered);
      }

      setHasMoreMessages(msgs.length === MSG_LIMIT);

      if (msgs.length > 0 && pageNum === 1) {
        const latest = msgs[0]; // newest message 
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === convId
              ? { ...conv, lastMessage: latest.text, lastMessageTime: latest.timestamp }
              : conv
          )
        );
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // ── WebSocket ─────────────────────────────────────────────────────────────

  const WS_URL = `wss://mediora-back-2.onrender.com/chat/ws`;

  /** Send a JSON frame — safe even if socket isn't open yet */
  const wsSend = (payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  };

  /** Start ping keepalive — server expects a ping every ~30 s */
  const startPing = () => {
    stopPing();
    pingRef.current = setInterval(() => {
      wsSend({ type: "ping" });
    }, 25000);
  };

  const stopPing = () => {
    if (pingRef.current) {
      clearInterval(pingRef.current);
      pingRef.current = null;
    }
  };

  /** Open (or re-open) the WebSocket connection */
  const connectWS = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      wsRef.current.close();
    }

    const token = localStorage.getItem("token");
    const url   = token ? `${WS_URL}?token=${token}` : WS_URL;
    const ws    = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WS connected");
      setIsConnected(true);
      // Authenticate / announce presence
      wsSend({ type: "ping" });
      startPing();
    };

    ws.onmessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }

      const { type, payload } = data;

      if (type === "ping") {
        // server acknowledged ping — connection is alive
        return;
      }

      if (type === "message.sent") {
        // A message was delivered (sent by us OR by the other party)
        const msg = {
          id:           payload.id ?? payload.message_id,
          text:         payload.body ?? payload.message ?? "",
          timestamp:    payload.created_at
            ? new Date(payload.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isSentByMe:   payload.sender_id === localStorage.getItem("id"),
          isPending:    false,
          isRead:       false,
          senderAvatar: "/default-avatar.png",
        };

        const convId = payload.conversation_id ?? payload.conv_id;

        setMessages((prev) => {
          // Replace optimistic pending message if it exists, otherwise append
          const pendingIdx = prev.findIndex((m) => m.isPending && m.isSentByMe);
          if (pendingIdx !== -1 && msg.isSentByMe) {
            const updated = [...prev];
            updated[pendingIdx] = msg;
            return updated;
          }
          // Avoid duplicates from polling fallback
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        // Update left-panel last message preview
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === convId
              ? { ...conv, lastMessage: msg.text, lastMessageTime: msg.timestamp }
              : conv
          )
        );
      }

      if (type === "error") {
        console.error("WS error from server:", payload);
      }
    };

    ws.onerror = (err) => {
      console.error("WS error:", err);
      setIsConnected(false);
    };

    ws.onclose = (e) => {
      console.log("WS closed:", e.code, e.reason);
      setIsConnected(false);
      stopPing();
      // Auto-reconnect after 3 s unless it was a clean close
      if (e.code !== 1000) {
        reconnectTimeoutRef.current = setTimeout(connectWS, 3000);
      }
    };
  };

  const closeWS = () => {
    stopPing();
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent auto-reconnect on intentional close
      wsRef.current.close(1000, "cleanup");
      wsRef.current = null;
    }
  };

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connectWS();
    return () => closeWS();
  }, []);

  // ── Select conversation ───────────────────────────────────────────────────
  const handleConversationClick = async (conversation) => {
    currentConvIdRef.current = conversation.id;

    setSelectedConversation(conversation);
    setMsgPage(1);
    setMessages([]);

    if (conversation.isMock) {
      setMessages(MOCK_MESSAGES);
      setPatientProfile(MOCK_PATIENT_PROFILE);
      return;
    }

    setPatientProfile({
      name:            conversation.name,
      picture:         conversation.avatar,
      nextAppointment: { date: "", time: "" },
      documents:       [],
    });

    await fetchMessages(conversation.id, 1, false);
  };

  // ── Rename conversation ───────────────────────────────────────────────────
  const handleRenameConversation = async () => {
    if (!editingName.trim() || !selectedConversation) return;

    const previousName = selectedConversation.name;
    const newName      = editingName.trim();

    // Optimistic update — apply immediately so the UI feels instant
    const applyName = (conv) =>
      conv.id === selectedConversation.id ? { ...conv, name: newName } : conv;

    setSelectedConversation((prev) => ({ ...prev, name: newName }));
    setConversations((prev) => prev.map(applyName));
    setIsEditingName(false);
    setEditingName("");

    // Skip API call for mock conversations
    if (selectedConversation.isMock) return;

    try {
      await renameConversation(selectedConversation.id, newName);
    } catch (error) {
      console.error("Failed to rename conversation:", error);
      // Rollback on failure
      const rollback = (conv) =>
        conv.id === selectedConversation.id ? { ...conv, name: previousName } : conv;
      setSelectedConversation((prev) => ({ ...prev, name: previousName }));
      setConversations((prev) => prev.map(rollback));
      alert("Failed to rename conversation. Please try again.");
    }
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || selectedConversation.isMock) return;

    const text      = newMessage.trim();
    const tempId    = `pending_${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Show optimistic bubble immediately
    const tempMessage = {
      id:          tempId,
      text,
      timestamp,
      isSentByMe:  true,
      isPending:   true,
      isRead:      false,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation.id
          ? { ...conv, lastMessage: text, lastMessageTime: timestamp }
          : conv
      )
    );
    setNewMessage("");

    // Send via WebSocket — server will respond with message.sent to confirm
    wsSend({
      type:    "message.send",
      payload: {
        conversation_id: selectedConversation.id,
        message:         text,
      },
    });
  };

  // ── File upload ───────────────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10 MB.`);
        continue;
      }

      const fileId = `temp_file_${Date.now()}_${Math.random()}`;
      const sizeLabel = `${(file.size / 1024).toFixed(2)} KB`;

      setMessages((prev) => [
        ...prev,
        {
          id: fileId,
          text: `📎 ${file.name} (${sizeLabel})`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isSentByMe: true,
          isPending: true,
          isFile: true,
        },
      ]);

      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === fileId
              ? { ...msg, isPending: false, text: `✅ ${file.name} (${sizeLabel})` }
              : msg
          )
        );
      }, 2000);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Documents ─────────────────────────────────────────────────────────────
  const handleDownloadDocument = (doc) => {
    if (doc.url && doc.url !== "#") {
      window.open(doc.url, "_blank");
    } else {
      alert("Document URL not available");
    }
  };

  const handleViewAllDocuments = () => console.log("View all documents");
  const handleOpenPatientFile  = () => console.log("Open patient file for:", patientProfile.name);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filteredConversations = useMemo(
    () =>
      conversations.filter((conv) =>
        conv.name?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [conversations, searchQuery]
  );

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className={styles.chatContainer}>
      <div className={styles.threePane}>

        {/* ── Left Pane: Conversation List ── */}
        <aside className={styles.convList}>
          <div className={styles.convSearch}>
            <div className={styles.searchWrap}>
              <span className="material-symbols-outlined">search</span>
              <input
                type="text"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.convScroll}>
            {/* WebSocket Connection Status - Green when connected */}
            {selectedConversation && !selectedConversation.isMock && (
              <div className={`${styles.connectionStatus} ${isConnected ? styles.connected : styles.disconnected}`}>
                <span className={styles.statusDotSmall}></span>
                <span>{isConnected ? "Connected (Secure)" : "Connecting to secure chat..."}</span>
              </div>
            )}

            {loading && page === 1 && (
              <div className={styles.loading}>Loading conversations...</div>
            )}

            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`${styles.convItem} ${
                  selectedConversation?.id === conversation.id ? styles.active : ""
                }`}
                onClick={() => handleConversationClick(conversation)}
              >
                <div className={styles.convAvatar}>
                  <img
                    alt={conversation.name}
                    src={conversation.avatar || "/default-avatar.png"}
                  />
                  {conversation.isOnline === true  && <div className={styles.onlineDot}></div>}
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
                  <p className={styles.convPreview}>{conversation.lastMessage}</p>
                </div>
              </div>
            ))}

            {!loading && filteredConversations.length === 0 && (
              <div className={styles.noResults}>No conversations found</div>
            )}

            {/* Load more button */}
            {hasMore && !loading && (
              <button
                className={styles.loadMoreBtn}
                onClick={() => setPage((p) => p + 1)}
              >
                Load more
              </button>
            )}

            {/* Loading spinner for subsequent pages */}
            {loading && page > 1 && (
              <div className={styles.loading}>Loading more...</div>
            )}
          </div>
        </aside>

        {/* ── Center Pane: Chat Window ── */}
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
                            if (e.key === "Enter")  handleRenameConversation();
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

                {/* Load older messages */}
                {hasMoreMessages && !loadingMessages && (
                  <div className={styles.loadOlderWrap}>
                    <button
                      className={styles.loadOlderBtn}
                      onClick={() => {
                        const nextPage = msgPage + 1;
                        setMsgPage(nextPage);
                        fetchMessages(selectedConversation.id, nextPage, true);
                      }}
                    >
                      Load older messages
                    </button>
                  </div>
                )}
                {loadingMessages && (
                  <div className={styles.loadOlderWrap}>
                    <span className={styles.loadingMsgs}>Loading messages...</span>
                  </div>
                )}

                {messages.length === 0 && (
                  <div className={styles.welcomeMessage}>
                    <span className="material-symbols-outlined">chat</span>
                    <h4>Start a conversation</h4>
                    <p>Send a message to {selectedConversation.name}</p>
                  </div>
                )}

                {messages.map((message) =>
                  message.isSentByMe ? (
                    <div key={message.id} className={styles.msgOut}>
                      <div className={styles.msgOutBody}>
                        <div className={`${styles.bubbleOut} ${message.isFile ? styles.fileBubble : ""}`}>
                          <p>{message.text}</p>
                        </div>
                        <div className={styles.msgOutMeta}>
                          <span className={styles.msgTime}>{message.timestamp}</span>
                          <span
                            className="material-symbols-outlined"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            {message.isPending
                              ? "schedule"
                              : message.isRead
                              ? "done_all"
                              : "check_circle"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={message.id} className={styles.msgIn}>
                      <img
                        className={styles.msgInAvatar}
                        alt={message.senderName}
                        src={message.senderAvatar || "/default-avatar.png"}
                      />
                      <div className={styles.msgInBody}>
                        <div className={`${styles.bubbleIn} ${message.isFile ? styles.fileBubble : ""}`}>
                          <p>{message.text}</p>
                        </div>
                        <span className={styles.msgTime}>{message.timestamp}</span>
                      </div>
                    </div>
                  )
                )}

                <div ref={messagesEndRef}></div>
              </div>

              {/* Input Console */}
              <div className={styles.inputConsole}>
                <div className={styles.inputWrap}>
                  <button
                    className={styles.inputAttach}
                    onClick={() => fileInputRef.current?.click()}
                  >
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
                      if (e.key === "Enter") handleSendMessage();
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

        {/* ── Right Pane: Patient Context Sidebar ── */}
        <aside className={styles.patientSidebar}>
          {selectedConversation ? (
            <>
              <div className={styles.patientProfile}>
                <img
                  className={styles.patientProfilePic}
                  alt={patientProfile.name}
                  src={patientProfile.picture || "/default-avatar.png"}
                />
                <h3 className={styles.patientName}>
                  {patientProfile.name || selectedConversation.name}
                </h3>
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
                            {patientProfile.nextAppointment.date} •{" "}
                            {patientProfile.nextAppointment.time}
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
                    <p className={styles.detailSectionTitle} style={{ marginBottom: 0 }}>
                      Shared Documents
                    </p>
                    <span className={styles.viewAll} onClick={handleViewAllDocuments}>
                      View All
                    </span>
                  </div>
                  <div className={styles.docList}>
                    {patientProfile.documents && patientProfile.documents.length > 0 ? (
                      patientProfile.documents.map((doc, index) => (
                        <div
                          key={index}
                          className={styles.docItem}
                          onClick={() => handleDownloadDocument(doc)}
                        >
                          <div
                            className={`${styles.docIcon} ${
                              doc.type === "pdf" ? styles.docIconPdf : styles.docIconImg
                            }`}
                          >
                            <span className="material-symbols-outlined">
                              {doc.type === "pdf" ? "picture_as_pdf" : "image"}
                            </span>
                          </div>
                          <div className={styles.docMeta}>
                            <p className={styles.docName}>{doc.name}</p>
                            <p className={styles.docSize}>
                              {doc.size} • {doc.date}
                            </p>
                          </div>
                          <span className={`material-symbols-outlined ${styles.docDl}`}>
                            download
                          </span>
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