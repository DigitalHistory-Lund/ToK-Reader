import { YearSelector } from '@/components/home/YearSelector';

export function HomePage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Swedish Parliamentary Debate Reader
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Browse and search Swedish parliamentary debates from 1900 to 1940
        </p>
        <p className="text-sm text-gray-500">
          Select a year to begin searching and reading
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Select a Year
        </h2>
        <YearSelector />
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          About this Reader
        </h3>
        <p className="text-blue-800 text-sm">
          This application allows you to search and read Swedish parliamentary debates
          in context. Each utterance is linked to the previous and next utterances,
          enabling you to follow the flow of debate. Use the search filters to find
          specific content, parties, or tagged utterances.
        </p>
      </div>
    </div>
  );
}
