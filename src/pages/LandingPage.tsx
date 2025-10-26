/**
 * Landing Page
 * Beautiful landing page with Shadcn UI and Framer Motion
 * Showcases the platform and directs users to sign up or login
 */

import { motion } from 'framer-motion'
import { Eye, Zap, Code, Sparkles, ArrowRight, Github, Twitter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'

export function LandingPage() {
  const navigate = useNavigate()

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const features = [
    {
      icon: Eye,
      title: 'Eye-Gaze Tracking',
      description: 'Revolutionary gaze-based UI/UX suggestions powered by AI'
    },
    {
      icon: Code,
      title: 'AI Code Generation',
      description: 'Generate complete landing pages and components with TypeScript'
    },
    {
      icon: Sparkles,
      title: 'Real-Time Optimization',
      description: 'Get instant suggestions based on where you look'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Stream sections in real-time with multi-LLM support'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Eye className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">
              ClientSight
            </span>
          </motion.div>
          
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button 
              variant="ghost" 
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => navigate('/signup')}
            >
              Get Started <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            {...fadeIn}
            className="mb-6"
          >
            <span className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold shadow-lg">
              🚀 Cal Hacks 12.0 Project
            </span>
          </motion.div>

          <motion.h1
            {...fadeIn}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-6xl md:text-7xl font-bold mb-6 text-white"
          >
            Build UI/UX with Your Eyes
          </motion.h1>

          <motion.p
            {...fadeIn}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl text-slate-200 mb-8 max-w-2xl mx-auto"
          >
            The first AI-powered UI builder that understands where you're looking. 
            Generate beautiful components and get intelligent suggestions with just your gaze.
          </motion.p>

          <motion.div
            {...fadeIn}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6"
              onClick={() => navigate('/signup')}
            >
              Start Building Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6"
              onClick={() => navigate('/login')}
            >
              Watch Demo
            </Button>
          </motion.div>

          <motion.div
            {...fadeIn}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-12"
          >
            <div className="relative w-full max-w-4xl mx-auto aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl overflow-hidden border-4 border-slate-700">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Eye className="w-20 h-20 text-blue-400 mx-auto mb-4 animate-pulse" />
                  <p className="text-slate-300 font-semibold text-lg">Demo Video Placeholder</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 bg-slate-800/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Revolutionary Features
            </h2>
            <p className="text-xl text-slate-300">
              Built for the future of web development
            </p>
          </div>

          <div className="grid md:grid-2 lg:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-slate-700 hover:border-blue-500 bg-slate-900/90 backdrop-blur-sm">
                  <feature.icon className="w-12 h-12 text-blue-400 mb-4" />
                  <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                  <p className="text-slate-300">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 shadow-2xl"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Build the Future?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join developers using eye-gaze technology to create stunning UIs
          </p>
          <Button 
            size="lg" 
            className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6"
            onClick={() => navigate('/signup')}
          >
            Get Started Now
            <Sparkles className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Eye className="w-6 h-6 text-blue-400" />
              <span className="font-semibold text-white">ClientSight</span>
              <span className="text-slate-400">© 2024</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <Github className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <Twitter className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

