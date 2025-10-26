/**
 * Onboarding Flow
 * Step-by-step guide including calibration
 * Redirects to main app when complete
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Zap, Target, CheckCircle2, ArrowRight, Video, AlertCircle, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { completeOnboarding, completeCalibration } from '@/lib/auth'
import { Calibration } from '@/components/Calibration'

type OnboardingStep = 'welcome' | 'intro' | 'webcam-permission' | 'calibration' | 'complete'

export function OnboardingFlow() {
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [calibrationComplete, setCalibrationComplete] = useState(false)
  const [webcamPermissionGranted, setWebcamPermissionGranted] = useState(false)
  const [webcamPermissionError, setWebcamPermissionError] = useState<string | null>(null)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)

  // Check if user should be here
  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    // If already completed onboarding and calibration, go to main app
    if (userProfile?.onboardingCompleted && userProfile?.calibrationCompleted) {
      navigate('/app')
    }
  }, [user, userProfile, navigate])

  const steps: Array<{ id: OnboardingStep; title: string; progress: number }> = [
    { id: 'welcome', title: 'Welcome', progress: 20 },
    { id: 'intro', title: 'Introduction', progress: 40 },
    { id: 'webcam-permission', title: 'Webcam Access', progress: 60 },
    { id: 'calibration', title: 'Calibration', progress: 80 },
    { id: 'complete', title: 'Complete', progress: 100 }
  ]

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)
  const currentProgress = steps[currentStepIndex]?.progress || 0

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id)
    }
  }

  const requestWebcamPermission = async () => {
    setIsRequestingPermission(true)
    setWebcamPermissionError(null)

    try {
      console.log('[Webcam] Checking if mediaDevices API is available...')
      
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support webcam access. Please use Chrome, Firefox, or Edge.')
      }

      // Check if we're on HTTPS (required for deployed sites)
      if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
        throw new Error('Webcam access requires HTTPS. Please access the site via https://')
      }

      console.log('[Webcam] Requesting camera permission...')
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false 
      })
      
      console.log('[Webcam] Permission granted! Stream received:', stream)
      console.log('[Webcam] Video tracks:', stream.getVideoTracks())
      
      // Permission granted! Stop the stream immediately (we'll request it again during calibration)
      stream.getTracks().forEach(track => {
        console.log('[Webcam] Stopping track:', track.label)
        track.stop()
      })
      
      setWebcamPermissionGranted(true)
      setWebcamPermissionError(null)
      
      console.log('[Webcam] Permission granted successfully!')
      
      // Auto-advance to calibration after a short delay
      setTimeout(() => {
        handleNext()
      }, 1500)
    } catch (error: any) {
      console.error('[Webcam] Permission error:', error)
      console.error('[Webcam] Error name:', error.name)
      console.error('[Webcam] Error message:', error.message)
      
      let errorMessage = 'Failed to access webcam. '
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow webcam access in your browser. Click the camera icon in your address bar and select "Allow".'
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No webcam found. Please connect a webcam to continue.'
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Webcam is already in use. Please close other apps using your camera.'
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += 'Your webcam does not meet the requirements. Try a different camera.'
      } else if (error.name === 'SecurityError') {
        errorMessage += 'Webcam access blocked by browser security. Please check your site permissions.'
      } else {
        errorMessage += error.message || 'Unknown error occurred. Please check your browser permissions.'
      }
      
      setWebcamPermissionError(errorMessage)
      setWebcamPermissionGranted(false)
    } finally {
      setIsRequestingPermission(false)
    }
  }

  const handleCalibrationComplete = async () => {
    setCalibrationComplete(true)
    
    if (user) {
      try {
        await completeCalibration(user.uid)
      } catch (error) {
        console.error('Failed to save calibration completion:', error)
      }
    }
    
    setCurrentStep('complete')
  }

  const handleFinish = async () => {
    if (user) {
      try {
        await completeOnboarding(user.uid)
        navigate('/app')
      } catch (error) {
        console.error('Failed to complete onboarding:', error)
      }
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <Eye className="w-24 h-24 text-blue-400 mx-auto mb-6" />
            </motion.div>

            <h1 className="text-4xl font-bold text-white">
              Welcome to ClientSight!
            </h1>

            <p className="text-xl text-slate-200 max-w-2xl mx-auto">
              {userProfile?.displayName ? `Hi ${userProfile.displayName}! ` : 'Hi! '}
              We're excited to help you build amazing UIs with AI and eye-gaze technology.
            </p>

            <p className="text-slate-300">
              Let's get you set up in just a few steps.
            </p>

            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={handleNext}
            >
              Get Started <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        )

      case 'intro':
        return (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-white">How ClientSight Works</h2>
              <p className="text-slate-300">
                Three revolutionary features working together
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Eye,
                  title: 'Eye-Gaze Tracking',
                  description: 'We track where you look to understand your focus and provide intelligent suggestions'
                },
                {
                  icon: Zap,
                  title: 'AI Generation',
                  description: 'Generate complete landing pages and components using state-of-the-art AI models'
                },
                {
                  icon: Target,
                  title: 'Smart Suggestions',
                  description: 'Get real-time optimization suggestions based on your gaze patterns'
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow border-2 border-slate-700 bg-slate-900">
                    <CardContent className="pt-6 text-center">
                      <feature.icon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="font-bold text-lg mb-2 text-white">{feature.title}</h3>
                      <p className="text-sm text-slate-300">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={handleNext}
              >
                Continue <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )

      case 'webcam-permission':
        return (
          <motion.div
            key="webcam-permission"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="mb-6"
              >
                {webcamPermissionGranted ? (
                  <CheckCircle2 className="w-24 h-24 text-green-400 mx-auto" />
                ) : (
                  <Camera className="w-24 h-24 text-blue-400 mx-auto" />
                )}
              </motion.div>

              <h2 className="text-3xl font-bold mb-4 text-white">
                {webcamPermissionGranted ? 'Webcam Access Granted!' : 'Webcam Access Required'}
              </h2>
              
              <p className="text-slate-200 max-w-2xl mx-auto mb-8">
                {webcamPermissionGranted 
                  ? 'Great! Your webcam is ready for eye-gaze tracking. Proceeding to calibration...'
                  : 'To enable eye-gaze tracking, we need access to your webcam. Your privacy is important - we only use your webcam for real-time gaze detection and never record or store any video.'
                }
              </p>
            </div>

            <Card className="max-w-2xl mx-auto border-2 border-slate-700 bg-slate-900">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-white">Real-time Gaze Tracking</h3>
                      <p className="text-sm text-slate-300">
                        We track where you look on the screen to provide intelligent UI/UX suggestions
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                      <Video className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-white">Privacy First</h3>
                      <p className="text-sm text-slate-300">
                        Video never leaves your device. All processing happens locally in your browser
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-white">Quick Setup</h3>
                      <p className="text-sm text-slate-300">
                        One-time calibration takes just 30 seconds to get started
                      </p>
                    </div>
                  </div>
                </div>

                {webcamPermissionError && (
                  <Alert variant="destructive" className="mt-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{webcamPermissionError}</AlertDescription>
                  </Alert>
                )}

                {!webcamPermissionGranted && (
                  <div className="mt-8 text-center">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={requestWebcamPermission}
                      disabled={isRequestingPermission}
                    >
                      {isRequestingPermission ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                          Requesting Access...
                        </>
                      ) : (
                        <>
                          <Video className="mr-2 w-5 h-5" />
                          Allow Webcam Access
                        </>
                      )}
                    </Button>
                    
                    <p className="text-xs text-slate-500 mt-4">
                      A browser prompt will appear asking for permission
                    </p>
                  </div>
                )}

                {webcamPermissionGranted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-8 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Access Granted - Continuing to Calibration</span>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )

      case 'calibration':
        return (
          <motion.div
            key="calibration"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 text-white">Eye-Gaze Calibration</h2>
              <p className="text-slate-200 max-w-2xl mx-auto">
                To use eye-gaze suggestions, we need to calibrate your eye tracking.
                This takes about 30 seconds and helps us understand your unique gaze patterns.
              </p>
            </div>

            <Card className="max-w-4xl mx-auto border-2 border-slate-700 bg-slate-900">
              <CardContent className="p-8">
                <Calibration 
                  onComplete={handleCalibrationComplete}
                />
              </CardContent>
            </Card>

            {calibrationComplete && (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mb-4"
                >
                  <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto" />
                </motion.div>
                <p className="text-lg font-semibold text-green-400">
                  Calibration Complete!
                </p>
              </div>
            )}
          </motion.div>
        )

      case 'complete':
        return (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <CheckCircle2 className="w-24 h-24 text-green-400 mx-auto mb-6" />
            </motion.div>

            <h1 className="text-4xl font-bold text-white">
              You're All Set!
            </h1>

            <p className="text-xl text-slate-200 max-w-2xl mx-auto">
              Your account is ready. Let's start building amazing UIs with AI!
            </p>

            <div className="space-y-4 max-w-md mx-auto">
              <div className="flex items-center gap-3 p-4 bg-green-900/30 rounded-lg border-2 border-green-500">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span className="text-sm font-medium text-green-300">Account Created</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-900/30 rounded-lg border-2 border-green-500">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span className="text-sm font-medium text-green-300">Eye-Gaze Calibrated</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-900/30 rounded-lg border-2 border-green-500">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span className="text-sm font-medium text-green-300">Ready to Build</span>
              </div>
            </div>

            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 mt-8"
              onClick={handleFinish}
            >
              Enter ClientSight <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-4">
      {/* Header */}
      <div className="container mx-auto pt-8 pb-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Eye className="w-8 h-8 text-blue-400" />
            <span className="text-xl font-bold text-white">
              ClientSight
            </span>
          </div>

          <div className="text-sm text-slate-300">
            Step {currentStepIndex + 1} of {steps.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mt-6">
          <Progress value={currentProgress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-12">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

