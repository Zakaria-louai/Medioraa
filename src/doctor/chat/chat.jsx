import { useState, useEffect, useRef, useMemo } from "react";
import styles from "./chat.module.css";
import { getContacts, getMessages, renameConversation, getAppointments } from "../../api/api.jsx";

// MOCK FALLBACKS (used if API fails during dev)

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

const LIMIT     = 10;  // contacts per page
const MSG_LIMIT = 20;  // messages per page

function mapContact(c, customNames = {}) {
  const user       = c.user ?? {};
  const firstName  = user.first_name ?? "";
  const lastName   = user.last_name  ?? "";
  const userFullName = [firstName, lastName].filter(Boolean).join(" ") || user.username || "Unknown";
  
  let displayName;
  if (customNames[c.id]) {
    displayName = customNames[c.id];
  } else if (c.name && c.name.trim() !== "") {
    displayName = c.name;
  } else {
    displayName = userFullName;
  }

  return {
    id:          c.id,
    name:        displayName,
    originalConversationName: c.name || "",
    userFullName: userFullName,
    avatar:      user.picture ?? "/default-avatar.png",
    lastMessage: c.last_message ?? "",
    lastMessageTime: c.created_at
      ? new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "",
    isOnline:              false,
    unreadCount:           0,
    userId:                user.id,
    username:              user.username,
    conversationCreatedAt: c.created_at ?? "",
    isMock:                false,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const parseDateString = (dateStr) => {
  if (!dateStr) return null;
  const datePart = String(dateStr).split("T")[0];
  const parts = datePart.split("-");
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month - 1, day);
};

const getLocalToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const formatAppointmentDate = (dateStr) => {
  if (!dateStr) return "No date";
  const d = parseDateString(dateStr);
  if (!d) return "Invalid date";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
    year:    "numeric",
  });
};

// ── Component ─────────────────────────────────────────────────────────────────

function Chat() {
  const [customConversationNames, setCustomConversationNames] = useState(() => {
    const saved = localStorage.getItem('customConversationNames');
    return saved ? JSON.parse(saved) : {};
  });

  const [conversations, setConversations]               = useState([]);
  const [messages, setMessages]                         = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery]                   = useState("");
  const [newMessage, setNewMessage]                     = useState("");
  const [isTyping, setIsTyping]                         = useState(false);
  const [loading, setLoading]                           = useState(false);
  const [loadingMessages, setLoadingMessages]           = useState(false);
  const [loadingAppointment, setLoadingAppointment]     = useState(false);
  const [page, setPage]                                 = useState(1);
  const [hasMore, setHasMore]                           = useState(true);
  const [msgPage, setMsgPage]                           = useState(1);
  const [hasMoreMessages, setHasMoreMessages]           = useState(false);
  const [isEditingName, setIsEditingName]               = useState(false);
  const [editingName, setEditingName]                   = useState("");
  const [isConnected, setIsConnected]                   = useState(false);
  const [patientProfile, setPatientProfile]             = useState({
    name: "",
    picture: "",
    nextAppointment: null,   // null = not yet loaded | false = none found | object = found
    documents: [],
  });

  const messagesEndRef    = useRef(null);
  const fileInputRef      = useRef(null);
  const typingTimeoutRef  = useRef(null);
  const wsRef             = useRef(null);   
  const pingRef           = useRef(null);   
  const currentConvIdRef  = useRef(null);   
  const reconnectTimeoutRef = useRef(null);
  const sentMessageIdsRef = useRef(new Set());

  const getDisplayName = (conversation) => {
    if (!conversation) return "";
    if (conversation.isMock) return conversation.name;
    return customConversationNames[conversation.id] || conversation.name || conversation.userFullName || "Unknown";
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      try {
        const response = await getContacts(page, LIMIT);
        const raw = response.data?.data ?? response.data ?? [];
        const contacts = Array.isArray(raw) ? raw : [];
        const mapped = contacts.map(contact => mapContact(contact, customConversationNames));

        const deduped = Object.values(
          mapped.reduce((acc, contact) => {
            const key = contact.userId;
            if (!acc[key]) {
              acc[key] = contact;
            } else {
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
        if (page === 1) {
          setConversations([MOCK_CONVERSATION]);
        }
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [page, customConversationNames]);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {}, 1000);
  };

  const myDoctorId = localStorage.getItem("doctorId");

  function mapMessage(m) {
    const senderId = m.sender_id;
    const isMine = String(senderId) === String(myDoctorId);
    const sender = m.sender ?? {};

    return {
      id: m.id,
      text: m.body ?? "",
      timestamp: m.created_at
        ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "",
      isSentByMe: isMine,
      isPending: false,
      isRead: m.is_read ?? false,
      senderName: isMine ? "Me" : `${sender.first_name ?? ""} ${sender.last_name ?? ""}`.trim(),
      senderAvatar: isMine ? null : (sender.picture ?? "/default-avatar.png"),
    };
  }

  const fetchMessages = async (convId, pageNum = 1, append = false) => {
    if (!convId) return;
    try {
      if (!append) setLoadingMessages(true);
      const response = await getMessages(convId, pageNum, MSG_LIMIT);
      const raw = response.data?.data ?? response.data ?? [];
      const msgs = (Array.isArray(raw) ? raw : []).map(mapMessage);
      const ordered = pageNum === 1 ? [...msgs].reverse() : msgs;

      if (append) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newOnes = ordered.filter((m) => !existingIds.has(m.id));
          return [...newOnes, ...prev];
        });
      } else {
        setMessages(ordered);
      }

      setHasMoreMessages(msgs.length === MSG_LIMIT);

      if (msgs.length > 0 && pageNum === 1) {
        const latest = msgs[0];
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

  // ── Fetch next appointment for the selected patient ───────────────────────

  const fetchPatientNextAppointment = async (patientUserId) => {
    if (!patientUserId) {
      setPatientProfile((prev) => ({ ...prev, nextAppointment: false }));
      return;
    }

    setLoadingAppointment(true);
    try {
      const res = await getAppointments();
      let data = [];
      if (Array.isArray(res.data?.data)) {
        data = res.data.data;
      } else if (Array.isArray(res.data)) {
        data = res.data;
      }

      const today = getLocalToday();

      // Filter appointments belonging to this patient and scheduled from today onward
      const patientAppointments = data.filter((item) => {
        // Match by patient user id — the API returns item.patient.id
        const patientId = item.patient?.id ?? item.patient_id ?? item.user_id;
        if (String(patientId) !== String(patientUserId)) return false;

        const status = (item.status ?? "").toLowerCase();
        if (status === "canceled" || status === "cancelled") return false;

        const apptDate = parseDateString(item.date);
        if (!apptDate) return false;

        return apptDate >= today;
      });

      // Sort ascending and pick the soonest one
      patientAppointments.sort(
        (a, b) =>
          (parseDateString(a.date)?.getTime() ?? 0) -
          (parseDateString(b.date)?.getTime() ?? 0)
      );

      const next = patientAppointments[0] ?? null;

      if (next) {
        // Extract time — try common field names: time, start_time, appointment_time
        const rawTime =
          next.time ??
          next.start_time ??
          next.appointment_time ??
          (next.date?.includes("T")
            ? new Date(next.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : null);

        setPatientProfile((prev) => ({
          ...prev,
          nextAppointment: {
            date: formatAppointmentDate(next.date),
            time: rawTime ?? "",
            status: next.status ?? "scheduled",
            raw: next,
          },
        }));
      } else {
        // No upcoming appointment found
        setPatientProfile((prev) => ({ ...prev, nextAppointment: false }));
      }
    } catch (err) {
      console.error("Failed to fetch patient appointments:", err);
      setPatientProfile((prev) => ({ ...prev, nextAppointment: false }));
    } finally {
      setLoadingAppointment(false);
    }
  };

  // ── WebSocket ─────────────────────────────────────────────────────────────

  const WS_URL = `wss://mediora-back-2.onrender.com/chat/ws`;

  const wsSend = (payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  };

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

  const connectWS = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      wsRef.current.close();
    }

    const token = localStorage.getItem("token");
    const url = token ? `${WS_URL}?token=${token}` : WS_URL;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WS connected");
      setIsConnected(true);
      wsSend({ type: "ping" });
      startPing();
    };

    ws.onmessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }

      const { type, payload } = data;

      if (type === "ping") return;

      if (type === "message.sent") {
        const convId = payload.conversation_id ?? payload.conv_id;
        const senderId = payload.sender_id;
        const messageId = payload.id ?? payload.message_id;
        
        const isSentByMe = String(senderId) === String(myDoctorId);
        
        if (isSentByMe) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.isPending === true && msg.isSentByMe === true
                ? { ...msg, id: messageId, isPending: false }
                : msg
            )
          );
          return;
        }

        const msg = {
          id: messageId,
          text: payload.body ?? payload.message ?? "",
          timestamp: payload.created_at
            ? new Date(payload.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isSentByMe: false,
          isPending: false,
          isRead: false,
          senderName: payload.sender?.first_name
            ? `${payload.sender.first_name} ${payload.sender.last_name}`.trim()
            : "Patient",
          senderAvatar: payload.sender?.picture ?? "/default-avatar.png",
        };

        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

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
      wsRef.current.onclose = null;
      wsRef.current.close(1000, "cleanup");
      wsRef.current = null;
    }
  };

  useEffect(() => {
    connectWS();
    return () => closeWS();
  }, []);

  // ── Conversation selection ────────────────────────────────────────────────

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

    // Reset profile — nextAppointment: null signals "loading"
    setPatientProfile({
      name:            getDisplayName(conversation),
      picture:         conversation.avatar,
      nextAppointment: null,
      documents:       [],
    });

    // Fetch messages and appointment in parallel
    await Promise.all([
      fetchMessages(conversation.id, 1, false),
      fetchPatientNextAppointment(conversation.userId),
    ]);
  };

  const handleRenameConversation = async () => {
    if (!editingName.trim() || !selectedConversation) return;

    const newName = editingName.trim();
    const conversationId = selectedConversation.id;

    const updatedCustomNames = {
      ...customConversationNames,
      [conversationId]: newName
    };
    
    setCustomConversationNames(updatedCustomNames);
    localStorage.setItem('customConversationNames', JSON.stringify(updatedCustomNames));

    const updatedConversation = { ...selectedConversation, name: newName };
    setSelectedConversation(updatedConversation);

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, name: newName } : conv
      )
    );

    setIsEditingName(false);
    setEditingName("");

    setPatientProfile((prev) => ({ ...prev, name: newName }));

    if (selectedConversation.isMock) return;

    try {
      await renameConversation(conversationId, newName);
    } catch (error) {
      console.error("Failed to rename conversation on server:", error);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || selectedConversation.isMock) return;

    const text      = newMessage.trim();
    const tempId    = `pending_${Date.now()}_${Math.random()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const tempMessage = {
      id: tempId,
      text,
      timestamp,
      isSentByMe: true,
      isPending: true,
      isRead: false,
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

    wsSend({
      type: "message.send",
      payload: {
        conversation_id: selectedConversation.id,
        message: text,
      },
    });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10 MB.`);
        continue;
      }

      const fileId    = `temp_file_${Date.now()}_${Math.random()}`;
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

  const handleDownloadDocument = (doc) => {
    if (doc.url && doc.url !== "#") {
      window.open(doc.url, "_blank");
    } else {
      alert("Document URL not available");
    }
  };

  const handleViewAllDocuments = () => console.log("View all documents");
  const handleOpenPatientFile  = () => console.log("Open patient file for:", patientProfile.name);

  const filteredConversations = useMemo(
    () =>
      conversations.filter((conv) =>
        getDisplayName(conv)?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [conversations, searchQuery, customConversationNames]
  );

  // ── Next-appointment UI helper ────────────────────────────────────────────

  const renderNextAppointment = () => {
    // null  → still loading
    if (patientProfile.nextAppointment === null || loadingAppointment) {
      return (
        <p className={styles.noEvents} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "1rem", animation: "spin 1s linear infinite" }}
          >
            progress_activity
          </span>
          Loading appointment...
        </p>
      );
    }

    // false → loaded but nothing found
    if (patientProfile.nextAppointment === false) {
      return <p className={styles.noEvents}>No upcoming events</p>;
    }

    // object → appointment found
    const { date, time, status } = patientProfile.nextAppointment;
    return (
      <>
        <p className={styles.apptDate}>
          {date}
          {time ? ` • ${time}` : ""}
        </p>
        {status && status.toLowerCase() !== "scheduled" && (
          <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "2px", textTransform: "capitalize" }}>
            {status}
          </p>
        )}
      </>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.chatContainer}>
      {/* Tiny CSS for the loading spinner */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div className={styles.threePane}>
        {/* ── Left: conversation list ── */}
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
                    alt={getDisplayName(conversation)}
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
                    <span className={styles.convName}>{getDisplayName(conversation)}</span>
                    <span className={styles.convTime}>{conversation.lastMessageTime}</span>
                  </div>
                  <p className={styles.convPreview}>{conversation.lastMessage}</p>
                </div>
              </div>
            ))}

            {!loading && filteredConversations.length === 0 && (
              <div className={styles.noResults}>No conversations found</div>
            )}

            {hasMore && !loading && (
              <button
                className={styles.loadMoreBtn}
                onClick={() => setPage((p) => p + 1)}
              >
                Load more
              </button>
            )}

            {loading && page > 1 && (
              <div className={styles.loading}>Loading more...</div>
            )}
          </div>
        </aside>

        {/* ── Center: chat messages ── */}
        <main className={styles.chatMain}>
          {selectedConversation ? (
            <>
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
                        <h2 className={styles.chatName}>{getDisplayName(selectedConversation)}</h2>
                        <button
                          onClick={() => {
                            setEditingName(getDisplayName(selectedConversation));
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

              {isTyping && (
                <div className={styles.typingIndicator}>
                  <span>Patient is typing...</span>
                </div>
              )}

              <div className={styles.msgFeed}>
                <div className={styles.encBanner}>
                  <div className={styles.encPill}>
                    <span className="material-symbols-outlined">encrypted</span>
                    <span className={styles.text}>Messages are end-to-end encrypted</span>
                  </div>
                </div>

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
                    <p>Send a message to {getDisplayName(selectedConversation)}</p>
                  </div>
                )}

                {messages.map((message) => {
                  if (message.isPending === false && message.id && message.id.toString().startsWith('pending_')) {
                    return null;
                  }
                  
                  return message.isSentByMe ? (
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
                  );
                })}

                <div ref={messagesEndRef}></div>
              </div>

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

        {/* ── Right: patient sidebar ── */}
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
                  {patientProfile.name || getDisplayName(selectedConversation)}
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
                        {renderNextAppointment()}
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