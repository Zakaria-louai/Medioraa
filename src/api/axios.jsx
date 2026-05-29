import axios from "axios";
const refreshApi = axios.create({
  baseURL: "https://mediora-back-2.onrender.com",
  withCredentials: true,
});
const api=axios.create({
    baseURL:"https://mediora-back-2.onrender.com",
    withCredentials:true
})
let auth=null;
export const setAuthContext=(authContext)=>{
    auth=authContext;
}
api.interceptors.request.use((config)=>{
    config.headers = config.headers || {};
    if (!config.headers.Authorization &&!config.url.includes("/auth/signout")){
        const token=localStorage.getItem("token");
    if (token) {config.headers.Authorization=`Bearer ${token}`}}
    return config
})
api.interceptors.response.use(
    (res)=>res,
    async(error)=>{
        if (!error.config) return Promise.reject(error);
        const originalRequest=error.config
        if (error.response?.status===401 && !originalRequest._retry && 
            !originalRequest.url.includes("/auth/verify-email")&&
            !originalRequest.url.includes("/auth/signup")
        &&!originalRequest.url.includes("/auth/signout")
    &&!originalRequest.url.includes("/auth/signin")
&&!originalRequest.url.includes("/auth/forgot-password")
&&!originalRequest.url.includes("/auth/reset-password")
 &&!originalRequest.url.includes("/auth/update-password-with-token")){
            originalRequest._retry=true;
            try {
                const res=await refreshApi.post("/auth/refresh",{},{withCredentials:true})
                console.log(res.data.token)
                const newToken=res.data.token;
                localStorage.setItem("token",newToken)
                auth?.setToken(newToken);
                originalRequest.headers.Authorization=`Bearer ${newToken}`
                return api(originalRequest)
            } catch (err){
                auth?.logout.mutate()
                return Promise.reject(err)
            }
        }
        return Promise.reject(error)
    }
)
export default api;