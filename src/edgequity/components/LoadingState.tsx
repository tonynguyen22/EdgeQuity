export default function LoadingState() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 font-sans"
      style={{ background: 'var(--vw-bg-deep)', color: 'var(--vw-text-primary)' }}
    >
      <div className="vw-card px-6 py-5 text-center">
        <p className="text-sm font-medium" style={{ color: 'var(--vw-text-secondary)' }}>
          Loading Edgequity data...
        </p>
      </div>
    </div>
  );
}
