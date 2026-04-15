type FilterType = 'all' | 'pending' | 'justified';
type DateFilterType = 'all' | 'today' | 'week' | 'month';

interface FilterButtonsProps {
  dateFilter: DateFilterType;
  setDateFilter: (filter: DateFilterType) => void;
  activeFilter: FilterType;
  setActiveFilter: (filter: FilterType) => void;
  filterStats: {
    totalAll: number;
    totalPending: number;
    totalJustified: number;
  };
}

export default function FilterButtons({
  dateFilter,
  setDateFilter,
  activeFilter,
  setActiveFilter,
  filterStats,
}: FilterButtonsProps) {
  return (
    <>
      {/* Filtros de Data */}
      <div   className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium text-gray-600">Período:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setDateFilter('all')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              dateFilter === 'all'
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              dateFilter === 'today'
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setDateFilter('week')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              dateFilter === 'week'
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Última Semana
          </button>
          <button
            onClick={() => setDateFilter('month')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              dateFilter === 'month'
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Último Mês
          </button>
        </div>
      </div>

      {/* Filtros de Status */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-thin text-gray-800">
          Desempenho por Vendedor
        </h2>
        
        <div className="flex gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Mostrar Tudo ({filterStats.totalAll})
          </button>
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeFilter === 'pending'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pendentes ({filterStats.totalPending})
          </button>
          <button
            onClick={() => setActiveFilter('justified')}    
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeFilter === 'justified'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Justificados ({filterStats.totalJustified})
          </button>
        </div>
      </div>
    </>
  );
}
