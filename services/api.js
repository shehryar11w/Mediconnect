import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const api = axios.create({
    baseURL: "https://medi-connect-backend-vert.vercel.app/api",
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem("token");
        // console.log(token);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            delete config.headers.Authorization;
            console.warn(
                "No token found, proceeding without Authorization header",
            );
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            AsyncStorage.removeItem("token");
            // router.replace('/startup/onboarding');
        }
        return Promise.reject(error);
    },
);

api.interceptors.request.use((config) => {
    config.headers["x-vercel-protection-bypass"] =
        "eTfvMd64LWUED1q8JKwOki3bREfQzKtW";
    return config;
});
export default api;
