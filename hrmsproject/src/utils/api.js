const BASE_URL = "http://localhost:8080";

const api = async (endpoint, options = {}) => {
    const token = localStorage.getItem("token");

    const headers = {
        ...options.headers,
    };

    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    // If it's a relative path, prepend BASE_URL
    const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;

    const response = await fetch(url, config);

    if (response.status === 401) {
        console.warn("Unauthorized access - clearing tokens and redirecting to login");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login";
        }
    }

    return response;
};

export default api;
