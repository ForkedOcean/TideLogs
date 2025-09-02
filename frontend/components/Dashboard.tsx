import { LogEntry, LogFilters, Metrics } from '@/lib/types'
import MetricsCards from './MetricsCards'
import FilterPanel from './FilterPanel'
import LogTable from './LogTable'

interface DashboardProps {
    logs: LogEntry[]
    metrics: Metrics | null
    loading: boolean
    filters: LogFilters
    onFiltersChange: (filters: LogFilters) => void
}

export default function Dashboard({
                                      logs,
                                      metrics,
                                      loading,
                                      filters,
                                      onFiltersChange
                                  }: DashboardProps) {
    return (
        <div className="space-y-6">
            {/* Metrics Overview */}
            <MetricsCards metrics={metrics} loading={loading} />

            {/* Filters */}
            <FilterPanel
                filters={filters}
                onFiltersChange={onFiltersChange}
                metrics={metrics}
            />

            {/* Logs Table */}
            <LogTable logs={logs} loading={loading} />
        </div>
    )
}