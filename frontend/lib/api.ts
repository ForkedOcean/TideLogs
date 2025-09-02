import axios from 'axios'
import { LogEntry, LogFilters, LogResponse, Metrics } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error)

        if (error.code === 'ECONNREFUSED') {
            throw new Error('Unable to connect to TideLogs backend. Please ensure the service is running.')
        }

        if (error.response?.status === 500) {
            throw new Error('Internal server error. Please try again later.')
        }

        throw error
    }
)

export const fetchLogs = async (filters: LogFilters): Promise<LogResponse> => {
    const params = new URLSearchParams()

    if (filters.service) params.append('service', filters.service)
    if (filters.level) params.append('level', filters.level)
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.offset) params.append('offset', filters.offset.toString())

    const response = await apiClient.get(`/logs?${params.toString()}`)
    return response.data
}

export const createLog = async (log: Omit<LogEntry, 'id' | 'timestamp' | 'created_at'>): Promise<LogEntry> => {
    const response = await apiClient.post('/logs', log)
    return response.data
}

export const fetchMetrics = async (): Promise<Metrics> => {
    const response = await apiClient.get('/metrics')
    return response.data
}

export const checkHealth = async (): Promise<any> => {
    const response = await apiClient.get('/health')
    return response.data
}