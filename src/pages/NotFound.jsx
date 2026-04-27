export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center text-center p-6">
      <div className="text-8xl font-extrabold text-gradient mb-4">404</div>
      <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
      <p className="text-white/40 mb-8 max-w-sm">The page you're looking for doesn't exist or you don't have permission to view it.</p>
      <a href="/" className="btn-primary px-6 py-2.5">← Back to Home</a>
    </div>
  );
}
