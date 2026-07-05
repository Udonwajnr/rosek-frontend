// "use server"
import axios from "axios";
// Create an Axios instance
const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true, // Ensures cookies (refresh token) are sent with requests
});

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true; // Mark the request as retry to prevent loops

      try {
        // Attempt to get a new access token using the refresh token
        const refreshResponse = await axios.post(
          "http://localhost:8000/api/hospital/refresh-token",
          {},
          { withCredentials: true }, // Ensure cookies are sent with this request
        );

        const newAccessToken = refreshResponse.data.accessToken; // Fix: Correctly set the access token

        // Store the new access token in localStorage
        localStorage.setItem("accessToken", newAccessToken); // Use a different key for access token

        // Update the Authorization header for the failed request
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        // Retry the original request with the new access token
        return api(originalRequest);
      } catch (refreshError) {
        // Handle refresh token failure (e.g., redirect to login)
        console.error("Refresh token failed:", refreshError);
        localStorage.removeItem("_id"); // Remove only the access token
        localStorage.removeItem("accessToken"); // Remove only the access token
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
