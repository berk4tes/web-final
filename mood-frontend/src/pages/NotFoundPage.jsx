// NotFoundPage — friendly 404 in light theme
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
    <div className="text-7xl">🌫️</div>
    <h1 className="mt-6 font-display text-5xl font-semibold text-ink-700">404</h1>
    <p className="mt-2 text-ink-400">This page lost its vibe.</p>
    <Link to="/" className="btn-primary mt-6">
      Back to home
    </Link>
  </div>
);

export default NotFoundPage;
