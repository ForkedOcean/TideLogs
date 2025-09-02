import { Metrics } from '@/lib/types'

interface MetricsCardsProps {
    metrics: Metrics | null
    loading: boolean
}

export default function MetricsCards({ metrics, loading }: MetricsCardsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-6">
                        <div className="animate-pulse">
                            <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (!metrics) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500">Unable to load metrics</p>
            </div>
        )
    }

    const topServices = Object.entries(metrics.services)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)

    const errorCount = metrics.levels.ERROR || 0
    const warnCount = metrics.levels.WARN || 0
    const infoCount = metrics.levels.INFO || 0

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Logs */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">Total Logs</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {metrics.total_logs.toLocaleString()}
                        </p>
                    </div>
                    <div className="ml-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-lg">📊</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Errors */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">Errors</p>
                        <p className="text-3xl font-bold text-red-600">
                            {errorCount.toLocaleString()}
                        </p>
                    </div>
                    <div className="ml-4">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-600 text-lg">🚨</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Warnings */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">Warnings</p>
                        <p className="text-3xl font-bold text-yellow-600">
                            {warnCount.toLocaleString()}
                        </p>
                    </div>
                    <div className="ml-4">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-yellow-600 text-lg">⚠️</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Services */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">Active Services</p>
                        <p className="text-3xl font-bold text-green-600">
                            {Object.keys(metrics.services).length}
                        </p>
                        {topServices.length > 0 && (
                            <div className="mt-2">
                                <p className="text-xs text-gray-500">Top services:</p>
                                {topServices.map(([service, count]) => (
                                    <p key={service} className="text-xs text-gray-600 truncate">
                                        {service}: {count}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="ml-4">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-lg">🔧</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}