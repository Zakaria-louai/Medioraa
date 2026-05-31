import axios from "axios";

const API = axios.create({
  baseURL: "https://mediora-back-2.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let auth = null;

export const setAuthContext = (authContext) => {
  auth = authContext;
};

// ── Request interceptor: attach Bearer token ──────────────────────────────────
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (
      token &&
      !config.headers.Authorization &&
      !config.url.includes("/auth/signout")
    ) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: auto-refresh on 401 ────────────────────────────────
API.interceptors.response.use(
  (response) => response,

  async (error) => {
    if (!error.config) return Promise.reject(error);

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(
          "https://mediora-back-2.onrender.com/auth/refresh",
          {},
          { withCredentials: true },
        );

        const newToken = refreshResponse.data.token;

        if (newToken) {
          localStorage.setItem("token", newToken);
          localStorage.setItem("authToken", newToken);
          auth?.setToken(newToken);

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return API(originalRequest);
        }
      } catch (refreshError) {
        console.error("Refresh token failed:", refreshError);

        localStorage.removeItem("token");
        localStorage.removeItem("authToken");
        localStorage.removeItem("doctorId");
        localStorage.removeItem("doctorUsername");

        auth?.logout?.mutate?.();

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// ── Auth ──────────────────────────────────────────────────────────────────────

export const login = async (email, password) => {
  try {
    const response = await API.post("/auth/signin", { email, password });
    const { token, doctor_id, username } = response.data;
    if (token)     { localStorage.setItem("token",    token);     localStorage.setItem("authToken", token); }
    if (doctor_id) localStorage.setItem("doctorId",       doctor_id);
    if (username)  localStorage.setItem("doctorUsername",  username);
    return response;
  } catch (error) {
    throw error;
  }
};

// ── Leaves ────────────────────────────────────────────────────────────────────

export const addLeave = async (data) => {
  const doctorId = localStorage.getItem("doctorId");
  return await API.post("/doctors/leaves", { ...data, doctor_id: doctorId });
};

export const getLeave = async () => {
  const doctorId = localStorage.getItem("doctorId");
  return await API.get("/doctors/leaves", { params: { doctor_id: doctorId } });
};

export const deleteLeave = async (id) => {
  const doctorId = localStorage.getItem("doctorId");
  return await API.delete(`/doctors/leaves/${id}`, { params: { doctor_id: doctorId } });
};

export const updateLeave = async (id, data) => {
  return await API.patch(`/doctors/leaves/${id}`, data);
};

// ── Schedule ──────────────────────────────────────────────────────────────────

export const getSchedule = async (doctorId) => {
  return await API.get(`/doctors/${doctorId}/schedule`);
};

// ── Appointments ──────────────────────────────────────────────────────────────

export const getAppointments = async () => {
  try {
    const today = new Date();
    const requests = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const formattedDate =
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0");

      requests.push(
        API.get("/appointments/patients", {
          params: { status: "scheduled", date: formattedDate, page: 1, limit: 50 },
        })
      );
    }

    const responses = await Promise.all(requests);
    const allAppointments = responses.flatMap((res) => res.data?.data || []);
    console.log("ALL APPOINTMENTS:", allAppointments);
    return { data: { data: allAppointments } };
  } catch (error) {
    console.error("Appointments fetch error:", error);
    throw error;
  }
};

// ── Doctors ───────────────────────────────────────────────────────────────────

export const getAllDoctors = async () => {
  return await API.get("/doctors");
};

export const getDoctorFeedback = async (doctorId) => {
  return await API.get(`/doctors/${doctorId}/feedback`);
};

// ── Chat ──────────────────────────────────────────────────────────────────────

/**
 * GET /chat/contacts/latest
 * Returns contacts with their latest message, paginated.
 *
 * @param {number} page  - Page number (1 = most recent LIMIT contacts)
 * @param {number} limit - Number of contacts per page (e.g. 10)
 */
export const getContacts = async (page = 1, limit = 10) => {
  return await API.get("/chat/contacts/latest", {
    params: { page, limit },
  });
};

export default API;

/**
 * GET /chat/conversations/:id/messages
 * Returns paginated messages for a conversation.
 *
 * @param {string} conversationId - The conversation UUID (from contacts endpoint)
 * @param {number} page           - Page number (1 = most recent LIMIT messages)
 * @param {number} limit          - Number of messages per page (e.g. 20)
 */
export const getMessages = async (conversationId, page = 1, limit = 20) => {
  return await API.get(`/chat/conversations/:${conversationId}/messages`, {
    params: { page, limit },
  });
};
export const renameConversation = async (conversationId, name) => {
  return await API.patch(`/chat/conversations/:${conversationId}/`, { name });
};