interface ErrorStateProps {
  message: string;
}

export default function ErrorState({ message }: ErrorStateProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 font-sans"
      style={{ background: 'var(--vw-bg-deep)', color: 'var(--vw-text-primary)' }}
    >
      <section className="vw-card max-w-md w-full p-6">
        <h1 className="text-lg font-semibold mb-2">Fundra data could not load</h1>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--vw-text-secondary)' }}>
          {message}
        </p>
      </section>
    </div>
  );
}
