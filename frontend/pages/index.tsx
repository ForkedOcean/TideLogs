import { useState, useEffect } from 'react'
import Head from 'next/head'
import Dashboard from '@/components/Dashboard'
import { LogEntry, LogFilters, Metrics } from '@/lib/types'
import { fetchLogs, fetchMetrics } from '@/lib/api'

export default function Home() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [metrics, setMetrics] = useState<Metrics | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filters, setFilters] = useState<LogFilters>({
        service: '',
        level: '',
        limit: 100,
        offset: 0
    })

    const loadData = async () => {
        try {
            setLoading(true)
            setError(null)

            const [logsResponse, metricsResponse] = await Promise.all([
                fetchLogs(filters),
                fetchMetrics()
            ])

            setLogs(logsResponse.logs)
            setMetrics(metricsResponse)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [filters])

    const handleFiltersChange = (newFilters: LogFilters) => {
        setFilters({ ...filters, ...newFilters, offset: 0 })
    }

    const handleRefresh = () => {
        loadData()
    }

    return (
        <>
            <Head>
                <title>TideLogs - Log Management Dashboard</title>
                <meta name="description" content="Lightweight log management and monitoring system" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <main className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <header className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-4xl font-bold text-tide-dark flex items-center gap-3">
                                    🌊 TideLogs
                                </h1>
                                <p className="text-tide-gray mt-2">
                                    Lightweight log management and monitoring
                                </p>
                            </div>
                            <button
                                onClick={handleRefresh}
                                disabled={loading}
                                className="px-4 py-2 bg-tide-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Loading...' : 'Refresh'}
                            </button>
                        </div>
                    </header>

                    {error && (
                        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    <Dashboard
                        logs={logs}
                        metrics={metrics}
                        loading={loading}
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                    />
                </div>
            </main>
        </>
    )
}