import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useAuth } from "../doctor/contexts/authContext";
export const useUser = () => {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const res = await api.get("/users/me");
      return res.data;
    },
    enabled: false,
    retry: false,
  });
};
export const updateUser = () => {
  return useMutation({
    mutationFn: async ({
      first_name,
      username,
      description,
      clinic_posx,
      clinic_posy,
    }) => {
      const res = await api.patch("/users/me", {
        first_name,
        username,
        description,
        clinic_posx,
        clinic_posy,
      });
      return res.data;
    },
    onError: (err) => {
      console.log("FULL ERROR:", err);
      console.log("RESPONSE:", err.response);
    },
    onSuccess: (data) => console.log(data),
  });
};
export const useProfile = () => {
  return useMutation({
    mutationFn: async (pic) => {
      const res = await api.post("/users/profile", pic);
      return res.data;
    },
    onError: (err) => {
      console.log("FULL ERROR:", err);
      console.log("RESPONSE:", err.response);
    },
    onSuccess: (data) => console.log(data),
  });
};
export const useSchedule = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/doctors/schedule", payload);
      return res.data;
    },
    onError: (err) => {
      console.log("FULL ERROR:", err);
      console.log("RESPONSE:", err.response);
    },
    onSuccess: (data) => console.log(data),
  });
};
export const useFetchTime = (doctor_id, location, enabledExtra) => {
  return useQuery({
    queryKey: ["fetch-schedule", doctor_id],
    queryFn: async () => {
      const res = await api.get(`/doctors/${doctor_id}/schedule`);
      return res.data;
    },
    enabled: !!doctor_id,
    retry: false,
  });
};
export const useRemoveRest = () => {
  return useMutation({
    mutationFn: async (rest_time_id) => {
      const res = await api.delete(`/doctors/schedule/rest/${rest_time_id}`);
    },
    onError: (err) => {
      console.log(err.response);
    },
  });
};
export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: async ({ password, current_password }) => {
      const res = await api.patch("/auth/change-password", {
        password,
        current_password,
      });
      return res.data;
    },
    onError: (err) => {
      console.log("FULL ERROR:", err);
      console.log("RESPONSE:", err.response);
    },
    onSuccess: (data) => console.log(data),
  });
};
export const useDeleteSchedule = () => {
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/doctors/${id}`);
      return res.data;
    },

    onSuccess: (data) => {
      console.log(data.message);
    },

    onError: (err) => {
      console.error("Delete schedule error:", err);
    },
  });
};
export const useRestTime = () => {
  return useMutation({
    mutationFn: async ({ starting_time, finish_time, day_of_week, reason }) => {
      const res = await api.post("/doctors/schedule/rest", {
        starting_time,
        finish_time,
        day_of_week,
        reason,
      });
      return res.data;
    },
    onSuccess: (data) => {
      console.log(data);
    },
    onError: (err) => {
      console.log(err.response);
    },
  });
};
export const useAddService = () => {
  return useMutation({
    mutationFn: async ({ name, price, description }) => {
      const res = await api.post("/doctors/services", {
        name,
        price,
        description,
      });
      return res.data;
    },
    onSuccess: (data) => {
      console.log(data.data);
    },
    onError: (err) => {
      console.log(err.response);
    },
  });
};
export const useFetchService = (doctor_id) => {
  return useQuery({
    queryKey: ["fetch-service", doctor_id],
    queryFn: async () => {
      const res = await api.get(`/doctors/${doctor_id}/services`);
      return res.data;
    },
    enabled: !!doctor_id,
    retry: false,
  });
};
export const useFetchRequests = () => {
  return useQuery({
    queryKey: ["fetch-requests"],
    queryFn: async () => {
      const res = await api.get(`/doctors-approvement/`);
      return res.data;
    },
    enabled: false,
    retry: false,
  });
};
export const useFetchRequest = (request_id) => {
  return useQuery({
    queryKey: ["fetch-request", request_id],
    queryFn: async () => {
      const res = await api.get(`/doctors-approvement/${request_id}`);
      return res.data;
    },
    enabled: !!request_id,
    retry: false,
  });
};
export const useApprove = () => {
  return useMutation({
    mutationFn: async ({ practice_start_date, institution, request_id }) => {
      const res = await api.post(`/doctors-approvement/${request_id}/approve`, {
        institution,
        practice_start_date,
      });
      return res.data;
    },
    onSuccess: (data) => {
      console.log(data.message);
    },
    onError: (err) => {
      console.log(err.response);
    },
  });
};
export const useReject = () => {
  return useMutation({
    mutationFn: async ({ practice_start_date, institution, request_id }) => {
      const res = await api.delete(
        `/doctors-approvement/${request_id}/reject`,
        { institution, practice_start_date },
      );
      return res.data;
    },
    onSuccess: (data) => {
      console.log(data.message);
    },
    onError: (err) => {
      console.log(err.response);
    },
  });
};
