/**
 * Signup Page
 * User registration with email/password or Google
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, Mail, Lock, User as UserIcon, AlertCircle, Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { useNavigate } from 'react-router-dom'
import { signUpWithEmail, signInWithGoogle } from '@/lib/auth'

export function SignupPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const passwordRequirements = [
    { label: 'At least 8 characters', met: formData.password.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(formData.password) },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) }
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const validateForm = () => {
    if (!formData.displayName) {
      setError('Please enter your name')
      return false
    }
    if (!formData.email) {
      setError('Please enter your email')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    if (!passwordRequirements.every(req => req.met)) {
      setError('Password does not meet requirements')
      return false
    }
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service')
      return false
    }
    return true
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) return

    setLoading(true)

    try {
      await signUpWithEmail(formData.email, formData.password, formData.displayName)
      navigate('/onboarding')
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError('')
    setLoading(true)

    try {
      await signInWithGoogle()
      navigate('/onboarding')
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <motion.div 
            className="flex items-center justify-center gap-2 mb-6"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200">
              <Eye className="w-7 h-7 text-white" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Create an account
          </h1>
          <p className="text-slate-500 mt-2">Start your 14-day free trial today</p>
        </div>

        <Card className="shadow-xl border-slate-200 bg-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign up</CardTitle>
            <CardDescription>
              Enter your information to create your account
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-4">
              <Button
                variant="outline"
                className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm"
                onClick={handleGoogleSignup}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSignup} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="displayName">Full Name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  placeholder="John Doe"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="bg-slate-50 border-slate-200"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-slate-50 border-slate-200"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-slate-50 border-slate-200"
                  required
                />
                {formData.password && (
                  <div className="grid gap-1.5 mt-1.5">
                    {passwordRequirements.map((req) => (
                      <div 
                        key={req.label}
                        className={`flex items-center gap-2 text-[11px] ${
                          req.met ? 'text-green-600' : 'text-slate-400'
                        }`}
                      >
                        {req.met ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                        )}
                        {req.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="bg-slate-50 border-slate-200"
                  required
                />
              </div>

              <div className="flex items-start space-x-2 mt-2">
                <Checkbox
                  id="terms"
                  className="mt-1"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <label
                  htmlFor="terms"
                  className="text-xs text-slate-500 leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  By clicking, you agree to our{' '}
                  <a href="#" className="text-primary-600 hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-primary-600 hover:underline">
                    Privacy Policy
                  </a>.
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-100 mt-2"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create account'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 border-t border-slate-50 pt-6">
            <div className="text-sm text-slate-500 text-center">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-primary-600 hover:text-primary-700 font-semibold"
              >
                Sign in
              </button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
