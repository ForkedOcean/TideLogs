import { LogEntry } from '@/lib/types'

interface LogTableProps {
    logs: LogEntry[]
    loading: boolean
}

const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
        case 'ERROR':
            return 'bg-red-100 text-red-800 border-red-200'
        case 'WARN':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'INFO':
            return 'bg-blue-100 text-blue-800 border-blue-200'
        case 'DEBUG':
            return 'bg-gray-100 text-gray-800 border-gray-200'
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200'
    }
}

const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
}

const formatMetadata = (metadata: any) => {
    if (!metadata || Object.keys(metadata).length === 0) return null
    return JSON.stringify(metadata, null, 2)
}

export default function LogTable({ logs, loading }: LogTableProps) {
    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="grid grid-cols-5 gap-4">
                                <div className="h-4 bg-gray-300 rounded"></div>
                                <div className="h-4 bg-gray-300 rounded"></div>
                                <div className="h-4 bg-gray-300 rounded"></div>
                                <div className="h-4 bg-gray-300 rounded"></div>
                                <div className="h-4 bg-gray-300 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Recent Logs</h2>
                <p className="text-sm text-gray-600 mt-1">
                    {logs.length} logs found
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Service
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Message
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Metadata
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {logs.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                No logs found. Try adjusting your filters or send some logs to get started.
                            </td>
                        </tr>
                    ) : (
                        logs.map((log, index) => (
                            <tr key={log.id || index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {log.timestamp ? formatTimestamp(log.timestamp) : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {log.service}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getLevelColor(log.level)}`}>
                      {log.level}
                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                                    <div className="truncate" title={log.message}>
                                        {log.message}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {formatMetadata(log.metadata) ? (
                                        <details className="cursor-pointer">
                                            <summary className="text-tide-blue hover:text-blue-600">
                                                View JSON
                                            </summary>
                                            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded max-w-xs overflow-auto">
                          {formatMetadata(log.metadata)}
                        </pre>
                                        </details>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}