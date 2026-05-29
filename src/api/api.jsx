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

API.interceptors.response.use(
  (response) => response,

  async (error) => {
    if (!error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(
          "https://mediora-back-2.onrender.com/auth/refresh",
          {},
          {
            withCredentials: true,
          },
        );

        const newToken = refreshResponse.data.token;

        if (newToken) {
          localStorage.setItem("authToken", newToken);
          auth?.setToken(newToken);

          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          return API(originalRequest);
        }
      } catch (refreshError) {
        console.error("Refresh token failed:", refreshError);

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

export const addLeave = async (data) => {
  const doctorId = localStorage.getItem("doctorId");
  const response = await API.post("/doctors/leaves", {
    ...data,
    doctor_id: doctorId,
  });
  return response;
};

export const getLeave = async () => {
  const doctorId = localStorage.getItem("doctorId");
  const response = await API.get("/doctors/leaves", {
    params: { doctor_id: doctorId },
  });
  return response;
};

export const deleteLeave = async (id) => {
  const doctorId = localStorage.getItem("doctorId");
  const response = await API.delete(`/doctors/leaves/${id}`, {
    params: { doctor_id: doctorId },
  });
  return response;
};

export const updateLeave = async (id, data) => {
  const response = await API.patch(`/doctors/leaves/${id}`, data);
  return response;
};

export const getSchedule = async (doctorId) => {
  return await API.get(`/doctors/${doctorId}/schedule`);
};

export const getAppointments = async () => {
  try {
    const today = new Date();
    const requests = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const formattedDate = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
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

export const getAllDoctors = async () => {
  return await API.get("/doctors");
};

export const getDoctorFeedback = async (doctorId) => {
  return await API.get(`/doctors/${doctorId}/feedback`);
};

export const login = async (email, password) => {
  try {
    const response = await API.post("/auth/signin", { email, password });
    const { token, doctor_id, username } = response.data;
    if (token) localStorage.setItem("authToken", token);
    if (doctor_id) localStorage.setItem("doctorId", doctor_id);
    if (username) localStorage.setItem("doctorUsername", username);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getChatContacts = async (page = 1, limit = 10) => {
  const response = await API.get("/chat/contacts/latest", { params: { page, limit } });
  return response.data;
};

export const getConversationMessages = async (conversationId) => {
  console.log("API CALL:", `/chat/conversations/${conversationId}/messages`);

  const res = await API.get(
    `/chat/conversations/${conversationId}/messages`
  );

  return res.data;
};
export const patchConversation = async (conversationId, name) => {
  const res = await API.patch(
    `/chat/conversations/${conversationId}`,
    {
      name,
    }
  );

  return res.data;
};
export default API;