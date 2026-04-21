// NotFoundPage — friendly 404
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
    <div className="text-7xl">🛸</div>
    <h1 className="mt-6 text-4xl font-bold text-white">404</h1>
    <p className="mt-2 text-slate-400">Aradığın sayfa mood'unu kaybetti.</p>
    <Link to="/" className="btn-primary mt-6">
      Ana Sayfaya Dön
    </Link>
  </div>
);

export default NotFoundPage;
