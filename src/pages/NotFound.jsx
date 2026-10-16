import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AuroraBackground, Logo } from '../components/ui';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <AuroraBackground intensity="strong" />
      <div className="mb-10"><Logo size={40} /></div>
      <p className="font-display text-[9rem] font-extrabold leading-none tracking-tighter text-gradient-animated">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-white">Page not found</h1>
      <p className="mb-8 mt-2 max-w-sm text-white/45">The page you're looking for doesn't exist or you don't have permission to view it.</p>
      <Link to="/" className="btn-primary px-6 py-3"><ArrowLeft size={16} /> Back to Home</Link>
    </div>
  );
}
