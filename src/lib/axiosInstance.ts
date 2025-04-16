import axios from 'axios';

// Make sure axios.default exists (needed for Hermes)
if (!axios.default && axios.request) {
  // @ts-ignore
  axios.default = axios;
}

// Create a configured instance 
const axiosInstance = axios.create({
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for logging or modifying requests
axiosInstance.interceptors.request.use(
  (config) => {
    // You can modify config here before sending requests
    return config;
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error);
  }
);

// Add response interceptor for handling responses
axiosInstance.interceptors.response.use(
  (response) => {
    // Handle successful responses
    return response;
  },
  (error) => {
    // Handle any errors
    return Promise.reject(error);
  }
);

export default axiosInstance; 