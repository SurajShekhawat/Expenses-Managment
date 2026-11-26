import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-extrabold text-slate-900">404</h1>
      <p className="text-sm text-slate-500 mt-2">Page nahi mila.</p>
      <Link 
        href="/" 
        className="mt-4 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition"
      >
        Dashboard par wapas jayein
      </Link>
    </div>
  );
}
