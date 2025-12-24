// Existing types
export interface GazePoint {
  x: number
  y: number
  timestamp: number
  confidence?: number
}

// ============================================================================
// GAZE TRACKING STATE MACHINE TYPES (AGENT_2)
// ============================================================================

/**
 * Gaze tracking state machine states
 * - idle: Gaze tracking is disabled/not active
 * - calibrating: User is going through calibration flow
 * - tracking: Actively tracking gaze
 * - paused: Tracking temporarily paused (user action)
 * - error: An error occurred (camera denied, WebGazer failed, etc.)
 */
export type GazeStatus = 'idle' | 'calibrating' | 'tracking' | 'paused' | 'error'

/**
 * Gaze session state - single source of truth
 */
export interface GazeSession {
  /** User ID from Firebase Auth */
  userId: string | null
  /** Whether gaze features are enabled (requires auth) */
  isGazeEnabled: boolean
  /** Whether calibration exists and is valid */
  isCalibrated: boolean
  /** Current gaze tracking status */
  gazeStatus: GazeStatus
  /** Calibration accuracy in pixels (e.g., ±78px) */
  calibrationAccuracy?: number
  /** Session start timestamp */
  sessionStart?: number
  /** Total gaze data points collected */
  dataPointsCount: number
  /** Error message if gazeStatus is 'error' */
  error?: string
}

/**
 * Valid state transitions for the gaze state machine
 */
export type GazeStateTransition = 
  | { from: 'idle'; to: 'calibrating' }
  | { from: 'idle'; to: 'tracking' }
  | { from: 'calibrating'; to: 'tracking' }
  | { from: 'calibrating'; to: 'idle' }
  | { from: 'calibrating'; to: 'error' }
  | { from: 'tracking'; to: 'paused' }
  | { from: 'tracking'; to: 'idle' }
  | { from: 'tracking'; to: 'error' }
  | { from: 'paused'; to: 'tracking' }
  | { from: 'paused'; to: 'idle' }
  | { from: 'error'; to: 'idle' }
  | { from: 'error'; to: 'calibrating' }

/**
 * Calibration data structure for persistence
 */
export interface CalibrationData {
  userId: string
  timestamp: number
  accuracy: number
  deviceFingerprint: string
  viewport: { W: number; H: number }
  // WebGazer transformation data
  affine?: { A: [[number, number], [number, number]]; b: [number, number] }
  quad?: { ax: number[]; ay: number[] }
  rbf?: { model: any }
}

export interface ElementLock {
  id: string
  role: string
  bbox: { x: number; y: number; w: number; h: number }
  element: HTMLElement
  originalStyles: Record<string, string>
}

export interface Intent {
  action: 'style.update' | 'text.replace'
  targetProps?: Record<string, string | number>
  newText?: string
}

// ============================================================================
// NEW TYPES FOR CAL HACKS 12.0 SPONSOR INTEGRATIONS
// ============================================================================

// Fetch.ai Agent Types
export interface FetchAIAgent {
  address: string
  name: string
  type: 'component-generator' | 'gaze-optimizer' | 'style-agent' | 'accessibility-agent'
  status: 'idle' | 'processing' | 'error'
}

export interface AgentMessage {
  from: string
  to: string
  payload: {
    type: 'request' | 'response' | 'notification'
    data: any
  }
  timestamp: number
}

export interface ComponentGenerationRequest {
  prompt: string
  gazeContext?: GazeAnalytics
  designTokens?: DesignTokens
  constraints?: string[]
}

export interface ComponentGenerationResponse {
  code: string
  explanation: string
  dependencies: string[]
  componentType: string
  gazeOptimizations?: string[]
  confidence: number
}

export interface GazeOptimizationRequest {
  componentId: string
  gazeData: GazePoint[]
  currentCode: string
}

export interface GazeOptimizationResponse {
  suggestions: OptimizationSuggestion[]
  predictedImpact: number // % improvement
  priority: 'low' | 'medium' | 'high'
}

export interface OptimizationSuggestion {
  issue: string
  recommendation: string
  code?: string
  estimatedImpact: number
  severity: 'low' | 'medium' | 'high'
}

// Component Tree (Enhanced for Cal Hacks)
export interface ComponentNode {
  id: string
  type: string
  name: string
  code: string
  props: Record<string, any>
  children: ComponentNode[]
  
  // Gaze analytics
  gazeMetrics?: GazeMetrics
  
  // Blockchain versioning
  blockchainHash?: string
  version?: number
  
  // Vector embeddings
  embedding?: number[]
  similarComponents?: string[] // IDs
  
  // Metadata
  createdAt: number
  updatedAt: number
  createdBy?: 'user' | 'agent'
  agentType?: FetchAIAgent['type']
}

export interface ComponentTree {
  root: ComponentNode
  selectedNode: string | null
  history: ComponentNode[]
  currentVersion: number
}

// Gaze Analytics (Enhanced)
export interface GazeMetrics {
  averageDwellTime: number
  firstFixationTime: number
  revisitCount: number
  skipRate: number
  attentionScore: number  // 0-100
  heatmapData?: HeatmapPoint[]
  
  // Cal Hacks: AppLovin analytics integration
  sessionId?: string
  abTestVariant?: string
}

export interface HeatmapPoint {
  x: number
  y: number
  intensity: number  // 0-1
}

export interface GazeAnalytics {
  topAttentionAreas: string[]
  avgDwellTime: number
  totalFixations: number
  scanpathComplexity: number
}

// Chroma Vector Database Types
export interface ChromaCollection {
  name: string
  metadata: Record<string, any>
}

export interface ComponentEmbedding {
  componentId: string
  embedding: number[]
  metadata: {
    componentType: string
    framework: string
    gazeScore: number
    createdAt: number
  }
}

export interface SimilaritySearchResult {
  componentId: string
  similarity: number
  component: ComponentNode
}

// Design System
export interface DesignTokens {
  colors: {
    primary: ColorScale
    secondary: ColorScale
    neutral: ColorScale
    semantic: SemanticColors
  }
  typography: Typography
  spacing: Record<string, string>
  borderRadius: Record<string, string>
  shadows: Record<string, string>
  breakpoints: Record<string, string>
}

export interface ColorScale {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
  950: string
}

export interface SemanticColors {
  success: string
  warning: string
  error: string
  info: string
}

export interface Typography {
  fontFamily: {
    sans: string
    serif: string
    mono: string
  }
  fontSize: Record<string, string>
  fontWeight: Record<string, number>
  lineHeight: Record<string, number>
}

// Figma Integration Types
export interface FigmaNode {
  id: string
  name: string
  type: string
  children?: FigmaNode[]
  styles?: Record<string, any>
}

export interface FigmaImportResult {
  components: ComponentNode[]
  assets: string[]
  errors?: string[]
}

// Ethereum / Blockchain Types
export interface BlockchainVersion {
  hash: string
  componentId: string
  version: number
  timestamp: number
  author: string
  previousHash?: string
}

export interface SmartContractEvent {
  event: 'ComponentCreated' | 'ComponentUpdated' | 'VersionCreated'
  data: any
  blockNumber: number
  transactionHash: string
}

// AppLovin Analytics Types
export interface AppLovinEvent {
  eventType: string
  componentId?: string
  gazeData?: GazePoint[]
  timestamp: number
  sessionId: string
}

// Multi-modal Interaction
export interface InteractionMode {
  mode: 'gaze' | 'voice' | 'text' | 'hybrid'
  active: boolean
}

export interface VoiceCommand {
  transcript: string
  confidence: number
  intent?: Intent
  targetElement?: HTMLElement
}

// Export & Deployment
export interface ExportOptions {
  format: 'react' | 'vue' | 'svelte' | 'html'
  typescript: boolean
  styling: 'tailwind' | 'css-modules' | 'styled-components'
  includeTests: boolean
  packageManager: 'npm' | 'yarn' | 'pnpm'
}

export interface ExportedProject {
  name: string
  files: Record<string, string>
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  readme: string
}

export interface DeploymentResult {
  url: string
  status: 'building' | 'ready' | 'error'
  buildLogs?: string[]
  error?: string
}

// Cal Hacks Submission Types
export interface ProjectSubmission {
  projectName: string
  techDomain: string // .tech domain
  sponsorTracks: SponsorTrack[]
  demoVideoUrl: string
  githubRepo: string
  description: string
}

export interface SponsorTrack {
  sponsor: 'fetchai' | 'chroma' | 'ethereum' | 'figma' | 'applovin' | 'mlh'
  integration: string
  demoFeature: string
  codeLinks: string[]
}
