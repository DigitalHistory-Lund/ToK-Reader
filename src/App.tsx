import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { DatabaseProvider } from './context/DatabaseContext';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { ReaderPage } from './pages/ReaderPage';

function App() {
  const basename = import.meta.env.DEV ? '/' : '/ToK-Reader';

  return (
    <ErrorBoundary>
      <DatabaseProvider>
        <BrowserRouter basename={basename}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path=":year/:utteranceId" element={<ReaderPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DatabaseProvider>
    </ErrorBoundary>
  );
}

export default App
