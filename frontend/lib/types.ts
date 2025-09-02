export interface LogEntry {
    id?: string
    timestamp?: string
    service: string
    level: string
    message: string
    metadata?: any
    created_at?: string
}

export interface LogFilters {
    service?: string
    level?: string
    limit?: number
    offset?: number
}

export interface LogResponse {
    logs: LogEntry[]
    total: number
}

export interface Metrics {
    total_logs: number
    services: Record<string, number>
    levels: Record<string, number>
}

export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG'