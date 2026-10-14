import { ZENODO_RECORDS } from '@/config/citation';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-4 text-sm text-gray-600 flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="font-semibold text-gray-700">Cite on Zenodo:</span>
        {ZENODO_RECORDS.map((record) => (
          <span key={record.doi}>
            {record.label}:{' '}
            <a
              href={`https://doi.org/${record.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
              title={record.title}
            >
              doi:{record.doi}
            </a>
          </span>
        ))}
      </div>
    </footer>
  );
}
