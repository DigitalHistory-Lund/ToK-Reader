import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">
            ToK Reader
          </Link>
          <nav className="flex gap-4">
            <Link to="/" className="hover:text-blue-200">
              Home
            </Link>
          </nav>
        </div>
        <p className="text-sm text-blue-100 mt-1">
          Swedish Parliamentary Debates (1900-1940)
        </p>
      </div>
    </header>
  );
}
