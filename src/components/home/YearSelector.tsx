import { Link } from 'react-router-dom';
import { AVAILABLE_YEARS } from '@/types/app';

export function YearSelector() {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
      {AVAILABLE_YEARS.map((year) => (
        <Link
          key={year}
          to={`/search?year=${year}`}
          className="bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-500 rounded-lg p-4 text-center font-semibold text-gray-700 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
        >
          {year}
        </Link>
      ))}
    </div>
  );
}
