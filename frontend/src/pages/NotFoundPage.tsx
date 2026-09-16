import { Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4">
      <div className="flex items-center gap-2 mb-8">
        <Leaf className="h-8 w-8 text-earth-500" />
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight leading-none">
          Darukaa<span className="text-earth-500">.Earth</span>
        </h1>
      </div>

      <div className="text-center max-w-md">
        <h2 className="text-6xl font-bold text-slate-800 mb-4">404</h2>
        <h3 className="text-xl font-semibold text-slate-200 mb-2">Page not found</h3>
        <p className="text-slate-400 mb-8">
          The page you are looking for might have been removed, had its name changed, or is
          temporarily unavailable.
        </p>

        <Link to="/dashboard">
          <Button size="lg" className="w-full sm:w-auto">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
