import axios from 'axios'
import { getToken } from '../Services/auth'

const http = axios.create()

http.interceptors.request.use((config) => {
    const t = getToken()
    if (t) config.headers.Authorization = `Bearer ${t}`
    return config
    })

export default http
