import axios from "axios"

const api = axios.create({
    baseURL: import.meta.env.VITE_SERVER_URL,
    withCredentials: true
})

const readCookie = (name) => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
    return match ? decodeURIComponent(match[1]) : null
}

api.interceptors.request.use((config) => {
    if (config.method && config.method.toLowerCase() !== "get") {
        const csrfToken = readCookie("csrf")
        if (csrfToken) {
            config.headers["x-csrf-token"] = csrfToken
        }
    }
    return config
})

export default api
