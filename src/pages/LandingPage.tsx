/**
 * Landing Page
 * Professional landing page for ClientSight
 */

import { motion } from 'framer-motion'
import { 
  Eye, Zap, Code, Sparkles, ArrowRight, Github, Twitter, 
  MousePointer2, BarChart3, ShieldCheck, Layout, UserCircle,
  Cpu, CheckCircle2, Globe, Laptop
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
      icon: MousePointer2,
      title: 'Real-Time Gaze Tracking',
      description: 'Webcam-based eye tracking that maps exactly where your users are looking in real-time.'
    },
    {
      icon: Sparkles,
      title: 'AI-Driven Suggestions',
      description: 'Gemini-powered insights recommend UI improvements based on detected attention bottlenecks.'
    },
    {
      icon: Cpu,
      title: 'Natural Language Editor',
      description: 'Modify your UI instantly using conversational commands while focusing on elements with your gaze.'
    },
    {
      icon: ShieldCheck,
      title: 'Privacy-First Architecture',
      description: 'All gaze processing happens locally in the browser. Your camera feed never leaves your device.'
    },
    {
      icon: Code,
      title: 'Clean Code Export',
      description: 'Export your optimized designs directly to React, Vue, or vanilla HTML/CSS with one click.'
    },
    {
      icon: Globe,
      title: 'Browser Native',
      description: 'No heavy software to install. Works directly in modern browsers with a quick calibration.'
    }
  ]

  const steps = [
    {
      number: '01',
      title: 'Enable Gaze Tracking',
      description: 'Grant camera access and complete a quick 5-point calibration in under 60 seconds.',
      icon: Eye
    },
    {
      number: '02',
      title: 'AI Analyzes Attention',
      description: 'Our engine identifies high-dwell areas and elements being ignored by users.',
      icon: BarChart3
    },
    {
      number: '03',
      title: 'Get Intelligent Fixes',
      description: 'AI suggests layout changes, color adjustments, and hierarchy improvements.',
      icon: Sparkles
    },
    {
      number: '04',
      title: 'Edit & Deploy',
      description: 'Apply changes via natural language and export the code to your production app.',
      icon: Zap
    }
  ]

  const segments = [
    {
      role: 'For Developers',
      tagline: 'Iterate on UI faster. AI-powered, gaze-informed.',
      useCase: 'Test new components instantly and see if they capture the expected attention before shipping.',
      icon: Code
    },
    {
      role: 'For Designers',
      tagline: 'Validate designs with real attention data.',
      useCase: 'Move beyond "guessing" where users look. Use actual gaze heatmaps to back your design decisions.',
      icon: Layout
    },
    {
      role: 'For UX Researchers',
      tagline: 'Scale qualitative insights. No lab required.',
      useCase: 'Conduct remote eye-tracking studies at a fraction of the cost of traditional hardware labs.',
      icon: UserCircle
    }
  ]

  const faqs = [
    {
      question: "How does eye-tracking work without special hardware?",
      answer: "ClientSight uses WebGazer.js, a sophisticated machine learning library that transforms your standard webcam into an eye-tracker by analyzing your eye movements relative to the screen."
    },
    {
      question: "Is my camera feed private?",
      answer: "Yes, 100%. All video processing and gaze calculations are performed locally in your browser. No video data or raw images are ever sent to our servers."
    },
    {
      question: "What browsers are supported?",
      answer: "We support all modern browsers that implement the WebRTC API, including Chrome, Firefox, Edge, and Safari (desktop)."
    },
    {
      question: "Can I export my designs?",
      answer: "Absolutely. Once you're happy with the AI-suggested changes, you can export the clean React/TypeScript code or raw CSS directly from the workspace."
    },
    {
      question: "How much does it cost?",
      answer: "ClientSight remains free as it is a demo product to showcase dynamic UI/UX changes through eye tracking. Usage is limited to 3 prompts per day."
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              ClientSight
            </span>
          </motion.div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button 
              className="bg-primary-600 hover:bg-primary-700 text-white"
              onClick={() => navigate('/signup')}
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div {...fadeIn}>
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-8 border border-primary-100">
                <Sparkles className="w-4 h-4" />
                Next-Gen Gaze-Driven Design
              </span>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Real-Time Gaze-Driven <br />
              <span className="text-primary-600">UI/UX Design & Analytics</span>
            </motion.h1>

            <motion.p
              className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Understand where users actually look. Design with confidence. 
              The first AI-powered UI builder that understands your attention patterns.
            </motion.p>

            <motion.div
              className="flex gap-4 justify-center flex-wrap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button 
                size="lg" 
                className="bg-primary-600 hover:bg-primary-700 text-lg px-8 py-6"
                onClick={() => navigate('/signup')}
              >
                Sign Up Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6"
                onClick={() => navigate('/login')}
              >
                See Demo
              </Button>
            </motion.div>
          </div>

          <motion.div
            className="mt-20 relative max-w-5xl mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white p-2">
              <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-lg font-medium">Real-time Gaze Heatmap Overlay</p>
                  <p className="text-slate-300">Cal Hacks 12.0 Project in Action</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full border-4 border-primary-500/50 flex items-center justify-center animate-pulse mb-4 mx-auto">
                    <div className="w-4 h-4 bg-primary-500 rounded-full"></div>
                  </div>
                  <p className="text-slate-400 font-medium">Interactive Demo Preview</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              ClientSight bridges the gap between raw attention data and actionable UI changes in four simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="mb-6 w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center">
                  <step.icon className="w-6 h-6" />
                </div>
                <div className="absolute top-0 right-0 text-4xl font-black text-slate-100 -z-10">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Everything you need to build and validate attention-grabbing interfaces.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-8 hover:shadow-lg transition-shadow border-slate-200">
                <feature.icon className="w-10 h-10 text-primary-600 mb-6" />
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Segments Section */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Designed for the Modern Product Team</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {segments.map((segment, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                  <segment.icon className="w-8 h-8 text-primary-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-primary-400">{segment.role}</h3>
                <p className="text-lg font-medium mb-4">{segment.tagline}</p>
                <p className="text-slate-400 leading-relaxed italic">
                  "{segment.useCase}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-bold py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-primary-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to design with confidence?</h2>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Join thousands of teams building better experiences with real attention data.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-primary-600 hover:bg-slate-50 text-lg px-10 py-8 font-bold"
            onClick={() => navigate('/signup')}
          >
            Start Your Free Session
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-primary-600 rounded flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">ClientSight</span>
              </div>
              <p className="text-slate-500 max-w-sm leading-relaxed mb-6">
                Transforming how teams build and optimize digital experiences by revealing where users actually look and why they engage.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-slate-400 hover:text-primary-600"><Github className="w-5 h-5" /></a>
                <a href="#" className="text-slate-400 hover:text-primary-600"><Twitter className="w-5 h-5" /></a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6">Product</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-primary-600">Features</a></li>
                <li><a href="#" className="hover:text-primary-600">Gaze Tracking</a></li>
                <li><a href="#" className="hover:text-primary-600">AI Suggestions</a></li>
                <li><a href="#" className="hover:text-primary-600">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Legal</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-primary-600">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary-600">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary-600">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm">© 2025 ClientSight. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-success" /> GDPR Compliant</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-success" /> SSL Secure</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
