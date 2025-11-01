import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-xl text-gray-600">Page not found</p>
        <p className="mt-2 text-gray-600">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link to="/dashboard">
            <Button>
              <Home className="mr-2 h-4 w-4" />
              Go back home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}