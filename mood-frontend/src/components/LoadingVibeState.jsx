const LoadingVibeState = ({ message = 'Warming up recommendations...' }) => (
  <div className="mb-loader animate-fade-in">
    <div className="mb-loader-orb" aria-hidden style={{ width: 100, height: 100 }} />
    <p>{message}</p>
  </div>
);

export default LoadingVibeState;
