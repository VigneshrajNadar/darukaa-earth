import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Card, CardContent } from '@/components/ui/Card'
import { Leaf } from 'lucide-react'

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('demo@darukaa-earth.local')
  const [password, setPassword] = useState('demo_password')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(email, password)
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to login')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center space-y-2 mb-8 flex flex-col items-center">
            <div className="bg-earth-900/30 p-3 rounded-full mb-2 border border-earth-700/50">
              <Leaf className="h-8 w-8 text-earth-500" />
            </div>
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
              Darukaa<span className="text-earth-500">.Earth</span>
            </h1>
            <p className="text-slate-400 text-sm">Sign in to your account</p>
          </div>

          {error && (
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            <Button type="submit" className="w-full mt-6" isLoading={isSubmitting}>
              Sign In
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-earth-500 hover:text-earth-400 font-medium">
              Request access
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage
