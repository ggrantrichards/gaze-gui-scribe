/**
 * Local AI Client (Fallback for Fetch.ai agents)
 * 
 * For Cal Hacks development: Uses OpenAI API directly
 * For production demo: Replace with actual Fetch.ai agent calls
 * 
 * This abstraction allows us to:
 * 1. Develop quickly with OpenAI
 * 2. Demonstrate agent architecture
 * 3. Easily swap to Fetch.ai agents later
 */

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Generate component using OpenAI GPT-4
 * Wrapped to look like Fetch.ai agent for Cal Hacks demo
 */
export async function generateWithOpenAI(
  userPrompt: string,
  systemPrompt: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY

  if (!apiKey) {
    console.warn('No OpenAI API key found, using mock generation')
    return generateMockComponent(userPrompt)
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''

    // Extract code block if wrapped in markdown
    const codeMatch = content.match(/```(?:tsx?|jsx?)?\n([\s\S]*?)```/)
    return codeMatch ? codeMatch[1].trim() : content.trim()
  } catch (error) {
    console.error('OpenAI generation failed:', error)
    return generateMockComponent(userPrompt)
  }
}

/**
 * Mock component generation for development without API key
 */
function generateMockComponent(prompt: string): string {
  const lowercasePrompt = prompt.toLowerCase()

  // Button
  if (lowercasePrompt.includes('button')) {
    return `export function Button({ children, onClick, variant = 'primary' }: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}) {
  const baseStyles = "px-6 py-3 rounded-lg font-semibold transition-all duration-200"
  const variantStyles = variant === 'primary'
    ? "bg-blue-600 hover:bg-blue-700 text-white"
    : "bg-gray-200 hover:bg-gray-300 text-gray-900"

  return (
    <button
      onClick={onClick}
      className={\`\${baseStyles} \${variantStyles}\`}
    >
      {children}
    </button>
  )
}`
  }

  // Login form
  if (lowercasePrompt.includes('login') || lowercasePrompt.includes('form')) {
    return `import { useState } from 'react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Login:', { email, password })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Login</h2>
      
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div className="mb-6">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
      >
        Sign In
      </button>
    </form>
  )
}`
  }

  // Card
  if (lowercasePrompt.includes('card')) {
    return `export function Card({ title, description, imageUrl }: {
  title: string
  description: string
  imageUrl?: string
}) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 text-gray-900">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  )
}`
  }

  // Hero section
  if (lowercasePrompt.includes('hero')) {
    return `export function Hero() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-6">
          Build Better UIs with Eye-Tracking AI
        </h1>
        <p className="text-xl mb-8 opacity-90">
          Understand where users actually look, not just where they click
        </p>
        <div className="flex gap-4 justify-center">
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Get Started
          </button>
          <button className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </div>
  )
}`
  }

  // Default fallback
  return `export function Component() {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">
        ${capitalizeFirstLetter(prompt)}
      </h2>
      <p className="text-gray-600">
        This is a placeholder component. Add your OpenAI API key to generate custom components.
      </p>
    </div>
  )
}`
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

