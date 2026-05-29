import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import api, { setAuthContext } from "../../api/axios";
import axios from "axios";
import { useEffect } from "react";
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(() => {
  const savedStatus = localStorage.getItem("doctorOnlineStatus");
  return savedStatus !== null ? savedStatus === "true" : true;
});
  //useEffect(()=>{
  //const initAuth=async()=>{
  //if (!token) return;
  //try{
  //const res=await api.post("/auth/refresh")
  //localStorage.setItem("token",res.data.token)
  //setToken(res.data.token)
  // queryClient.invalidateQueries(["user"])
  //} catch {
  //   logout()
  // }
  //}
  //initAuth()
  //},[token,logout,queryClient])
  const navigate = useNavigate();
  const login = useMutation({
    mutationFn: async ({ username, password }) => {
      const formData = new URLSearchParams();
      formData.append("grant_type", "password");
      formData.append("username", username);
      formData.append("password", password);
      const res = await api.post("/auth/signin", formData, {
        //headers: {
        //"Content-Type": "application/x-www-form-urlencoded",
        //},
        withCredentials: true,
      });
      return res.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      setToken(data.token);
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (err) => {
      console.log("FULL ERROR:", err);
      console.log("MESSAGE:", err.message);
      console.log("RESPONSE:", err.response);
    },
  });
  const logout = useMutation({
    mutationFn: async () => {
      const res = await api.delete(
        "/auth/signout",
        {},
        { withCredentials: true },
      );
    },
    onSuccess: (data) => {
      localStorage.removeItem("token");
      setToken(null);
      queryClient.clear();
      navigate("/signin");
    },
    onError: (err) => {
      console.log("FULL ERROR:", err);
      console.log("MESSAGE:", err.message);
      console.log("RESPONSE:", err.response);
    },
  });
  useEffect(() => {
    setAuthContext({ setToken, logout });
  }, [logout]);
  const sendSignupEmail = useMutation({
    mutationFn: async (email) => {
      const res = await api.post("/auth/check-email", { email });
      return res.data;
    },
  });
useEffect(() => {
  localStorage.setItem("doctorOnlineStatus", isOnline);
}, [isOnline]);
  const verifyEmail = useMutation({
    mutationFn: async ({ code, email }) => {
      const res = await api.get("/auth/verify-email", {
        params: { code, email },
      });
      return res.data;
    },
    onError: (err) => {
      console.log("FULL ERROR:", err);
      console.log("MESSAGE:", err.message);
      console.log("RESPONSE:", err.response);
    },
  });

  const uploadDocument = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "doctor_documents");
      const endpoint = "https://api.cloudinary.com/v1_1/ds3r9ls5u/image/upload";

      const res = await axios.post(endpoint, formData);
      const isPDF = file.type === "application/pdf";
      return {
        public_id: res.data.public_id,
        format: res.data.format,
        resource_type: isPDF ? "raw" : "image",
        secure_url: res.data.secure_url,
      };
    },
    onSuccess: (data) => {
      console.log(data);
    },
    onError: (err) => {
      console.log("UPLOAD ERROR:", err.response?.data || err.message);
    },
  });

  const checkUser = useMutation({
    mutationFn: async ({ username }) => {
      const res = await api.post("/auth/check-username", { username });
      return res.data;
    },
    onError: (err) => {
      console.log("FULL ERROR:", err);
      console.log("RESPONSE:", err.response);
    },
  });
  const completeSignup = useMutation({
    mutationFn: async (credentials) => {
      const verifyToken = sessionStorage.getItem("flowToken");

      const res = await api.post("/auth/signup", credentials, {
        headers: {
          Authorization: `Bearer ${verifyToken}`,
        },
      });

      return res.data;
    },

    onSuccess: (data) => {
      setToken(data.token);
      localStorage.setItem("token", data.token);
      sessionStorage.removeItem("currentStep");
      sessionStorage.removeItem("flowToken");
      localStorage.setItem("signPath", true);
    },
    onError: (err) => {
      console.log("FULL ERROR:", err);
      console.log("MESSAGE:", err.message);
      console.log("RESPONSE:", err.response);
    },
  });

  const forgotPassword = useMutation({
    mutationFn: async ({ email }) => {
      const res = await api.post("/auth/forgot-password", { email });
      return res.data;
    },
    onSuccess: (data) => {
      console.log(data.message);
    },
    onError: (err) => {
      console.log("FULL ERROR:", err);
      console.log("RESPONSE:", err.response);
    },
  });
  const resetPassword = useMutation({
    mutationFn: async ({ code }) => {
      const res = await api.post("/auth/reset-password", { code });
      return res.data;
    },
    onSuccess: (data) => {
      console.log(data.message);
      sessionStorage.setItem("resetToken", data.token);
    },
    onError: (err) => {
      console.log("FULL ERROR:", err);
      console.log("RESPONSE:", err.response);
    },
  });
  const updatePassword = useMutation({
    mutationFn: async ({ password }) => {
      const verifyToken = sessionStorage.getItem("resetToken");
      const res = await api.patch("/auth/update-password-with-token", {
        password: password,
        reset_token: verifyToken,
      });
      return res.data;
    },
    onError: (err) => {
      console.log("FULL ERROR:", err);
      console.log("RESPONSE:", err.response);
    },
  });
  const fetchMine = useQuery({
    queryKey: ["fetch-My-Request"],
    queryFn: async () => {
      const res = await api.get("/doctors-approvement/mine");
      return res.data;
    },
    enabled: false,
    retry: false,
  });
  const sendDocuments = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/doctors-approvement/request", payload);
      return res.data;
    },
    onSuccess: (data) => {
      console.log(data.message);
      queryClient.invalidateQueries({ queryKey: ["fetch-My-Request"] });
      localStorage.setItem("signPath", !localStorage.getItem("signPath"));
    },
    onError: (err) => {
      console.log("FULL ERROR:", err);
      console.log("RESPONSE:", err.response);
    },
  });
  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        sendSignupEmail,
        verifyEmail,
        uploadDocument,
        completeSignup,
        forgotPassword,
        resetPassword,
        token,
        setToken,
        checkUser,
        updatePassword,
        fetchMine,
        sendDocuments,
        queryClient,
        isOnline,
        setIsOnline,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
