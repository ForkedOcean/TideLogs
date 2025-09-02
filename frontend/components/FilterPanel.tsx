import { LogFilters, Metrics } from '@/lib/types'

interface FilterPanelProps {
    filters: LogFilters
    onFiltersChange: (filters: LogFilters) => void
    metrics: Metrics | null
}

export default function FilterPanel({
                                        filters,
                                        onFiltersChange,
                                        metrics
                                    }: FilterPanelProps) {
    const availableServices = metrics ? Object.keys(metrics.services).sort() : []
    const availableLevels = ['ERROR', 'WARN', 'INFO', 'DEBUG']

    const handleFilterChange = (key: keyof LogFilters, value: string | number) => {
        onFiltersChange({
            [key]: value === '' ? undefined : value
        })
    }

    const clearFilters = () => {
        onFiltersChange({
            service: '',
            level: '',
            limit: 100,
            offset: 0
        })
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                    onClick={clearFilters}
                    className="text-sm text-tide-blue hover:text-blue-600 underline"
                >
                    Clear all
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Service Filter */}
                <div>
                    <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">
                        Service
                    </label>
                    <select
                        id="service"
                        value={filters.service || ''}
                        onChange={(e) => handleFilterChange('service', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tide-blue focus:border-transparent"
                    >
                        <option value="">All services</option>
                        {availableServices.map((service) => (
                            <option key={service} value={service}>
                                {service} ({metrics?.services[service] || 0})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Level Filter */}
                <div>
                    <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                        Level
                    </label>
                    <select
                        id="level"
                        value={filters.level || ''}
                        onChange={(e) => handleFilterChange('level', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tide-blue focus:border-transparent"
                    >
                        <option value="">All levels</option>
                        {availableLevels.map((level) => (
                            <option key={level} value={level}>
                                {level} ({metrics?.levels[level] || 0})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Limit Filter */}
                <div>
                    <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">
                        Limit
                    </label>
                    <select
                        id="limit"
                        value={filters.limit || 100}
                        onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-tide-blue focus:border-transparent"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={500}>500</option>
                    </select>
                </div>

                {/* Quick Actions */}
                <div className="flex items-end">
                    <div className="grid grid-cols-2 gap-2 w-full">
                        <button
                            onClick={() => handleFilterChange('level', 'ERROR')}
                            className="px-3 py-2 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 transition-colors"
                        >
                            Errors Only
                        </button>
                        <button
                            onClick={() => handleFilterChange('level', 'WARN')}
                            className="px-3 py-2 text-xs font-medium text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-md hover:bg-yellow-200 transition-colors"
                        >
                            Warnings+
                        </button>
                    </div>
                </div>
            </div>

            {/* Active Filters Display */}
            {(filters.service || filters.level) && (
                <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-sm text-gray-600">Active filters:</span>
                    {filters.service && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-tide-blue text-white">
              Service: {filters.service}
                            <button
                                onClick={() => handleFilterChange('service', '')}
                                className="ml-1 text-white hover:text-gray-200"
                            >
                ×
              </button>
            </span>
                    )}
                    {filters.level && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-tide-blue text-white">
              Level: {filters.level}
                            <button
                                onClick={() => handleFilterChange('level', '')}
                                className="ml-1 text-white hover:text-gray-200"
                            >
                ×
              </button>
            </span>
                    )}
                </div>
            )}
        </div>
    )
}