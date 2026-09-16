import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Leaf } from 'lucide-react'

function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="p-8 text-center flex flex-col items-center">
          <div className="bg-earth-900/30 p-3 rounded-full mb-4 border border-earth-700/50">
            <Leaf className="h-8 w-8 text-earth-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Request Access</h1>
          <p className="text-slate-400 text-sm mb-8">
            Darukaa.Earth is currently in closed beta. Please contact our sales team to request a
            demonstration account.
          </p>

          <Link to="/login" className="w-full">
            <Button variant="secondary" className="w-full">
              Return to Sign In
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default RegisterPage
