# AGENT_1_UI_UX_REFACTOR.md

## Agent 1: UI/UX Refactor Specialist

**Role:** Transform ClientSight from a barebones hackathon project into a polished, professional SaaS UI/UX experience.

**Owner:** Cursor Agent 1 – UI/UX Refactor Specialist  
**Last Updated:** December 23, 2025  
**Status:** Active Development

---

## Overview

ClientSight is a **gaze-driven UI/UX builder and analytics platform**. The current codebase is functionally sound but visually and structurally rough—it looks like a rushed hackathon project, not a production-ready tool.

Your mission: **Redesign the entire user-facing experience** to match the quality and polish of modern SaaS tools (Figma, Framer, v0, Bolt.new) while keeping the existing tech stack and project architecture intact.

---

## Tech Stack (No Changes)

- **React 18** + TypeScript
- **TailwindCSS** (no Material UI, Chakra, or other component libraries)
- **Custom components** (buttons, cards, modals, sidebars, navbars, alerts, panels)
- **Firebase Hosting** (SPA-friendly routing via `index.html` rewrite)
- **WebGazer.js** (gaze tracking, handled by Agent 2)
- **Gemini 3 API** (AI-powered suggestions, handled by Agent 3)

---

## Primary Responsibilities

### 1. Landing Page Redesign

**Current State:** Likely a basic, unpolished marketing page with placeholder content.

**Target State:** A modern, professional landing page that positions ClientSight as a premium developer/designer/researcher tool.

#### Sections to Include:

1. **Hero Section**
   - Compelling headline: "Real-Time Gaze-Driven UI/UX Design & Analytics"
   - Subheadline: Clear, concise value proposition (e.g., "Understand where users actually look. Design with confidence.")
   - Call-to-action buttons:
     - "Sign Up Free" (prominent, primary color)
     - "See Demo" (secondary)
   - Background: subtle animation or video teaser showing gaze tracking in action (no audio autoplay)

2. **How It Works Section**
   - 3–4 step visual flow:
     - Step 1: "Enable Gaze Tracking" (calibrate in <1 minute)
     - Step 2: "AI Analyzes Attention" (real-time heatmaps & engagement metrics)
     - Step 3: "Get Suggestions" (AI recommends UI fixes)
     - Step 4: "Edit & Deploy" (natural language UI builder + code export)
   - Use icons, illustrations, or small animations to explain each step.

3. **Live Demo Teaser**
   - Embedded or linked demo showing:
     - Gaze cursor overlay on a sample website.
     - Live heatmap generation.
     - Natural language command execution (e.g., "Make button blue").
   - Must clearly state: "Real data. No signup required. (This demo shows a sample.)"

4. **Features Highlight Section**
   - Grid or card-based layout (3–4 columns) with:
     - Real-Time Gaze Tracking
     - AI-Driven Suggestions
     - Natural Language Editor
     - Privacy-First (Local Processing)
     - Code Export (React/Vue/HTML)
     - Collaboration (Coming Soon)
   - Each card: icon + headline + 1–2 line description.

5. **For [Segment] Section**
   - Three subsections for target users:
     - **For Developers:** "Iterate on UI faster. AI-powered, gaze-informed."
     - **For Designers:** "Validate designs with real attention data."
     - **For UX Researchers:** "Scale qualitative insights. No lab setup required."
   - Each with a relevant use case or quote.

6. **Pricing / Coming Soon**
   - Clearly state pricing model (freemium, SaaS tiers, etc.) or "Coming Soon."
   - Do not leave users confused about cost.

7. **FAQ Section**
   - 5–7 common questions:
     - "How does eye-tracking work?"
     - "Is my data private?"
     - "What browsers are supported?"
     - "Can I export designs?"
     - "How much does it cost?"
   - Accordion or reveal UI for clean presentation.

8. **Footer**
   - Links: Privacy, Terms, Contact, Docs (if available).
   - Social links (GitHub, Twitter, etc.).
   - Copyright and company info.

---

### 2. In-App Workspace Layout & Design

**Current State:** Unknown, but likely scattered UI controls and unclear gaze status.

**Target State:** A cohesive, intuitive workspace for testing gaze-driven design changes.

#### Layout Structure:

┌─────────────────────────────────────────────────────┐
│ Top Bar │
│ (Logo | Workspace Name | User Profile | Settings) │
├─────────────────────────────────────────────────────┤
│ │ │ │
│ │ │ │
│ Left│ Center Canvas │ Right Panel │
│ Sidebar│ (Live Preview, Gaze │ (Status, Suggestions│
│ (Nav) │ Cursor, Heatmap) │ History, Controls) │
│ │ │ │
├─────────────────────────────────────────────────────┤
│ Status Bar │
│ (Gaze Status | Recording | Help) │
└─────────────────────────────────────────────────────┘

#### Left Sidebar
- **Logo** with app name.
- **Main Navigation:**
  - Dashboard / Projects
  - New Project / Import
  - Documentation
  - Settings
  - Logout
- **Project List** (if in project view):
  - Expandable project tree.
  - Quick filters (Recent, Starred, All).

#### Center Canvas
- **Live Preview Area:**
  - Embed or iframe the target website/app being analyzed.
  - Gaze cursor overlay (small, non-intrusive, styled circle + crosshair).
  - Optional heatmap overlay toggle (toggle on/off heatmap visualization).
- **Toolbar Above Canvas:**
  - Zoom controls (100%, fit, zoom in/out).
  - Calibrate / Recalibrate (only visible if logged in).
  - Pause / Resume Tracking.
  - Clear Data / Reset Session.
  - Export (heatmap as PNG, data as CSV).

#### Right Panel (Tabbed)
- **Tab 1: Status & Control**
  - Gaze Status Indicator:
    - 🔴 Red: "Tracking Disabled" (need to enable or permission denied).
    - 🟡 Yellow: "Calibrating" (in process or needs recalibration).
    - 🟢 Green: "Tracking Active" (gaze cursor visible, collecting data).
  - Session Info:
    - Calibration Accuracy: "±78px"
    - Session Duration: "2m 45s"
    - Data Points: "8,432"
  - Quick Controls:
    - "Enable Gaze Tracking" (button, only if disabled).
    - "Recalibrate" (button, always available).
    - "Pause" / "Resume" (toggle).

- **Tab 2: AI Suggestions**
  - Real-time suggestions from Gemini:
    - List of detected issues (e.g., "CTA ignored by 80% of users").
    - Proposed fixes (e.g., "Increase button size to 48px").
    - Apply / Dismiss buttons for each suggestion.
  - Refreshes as new data arrives.

- **Tab 3: Change History**
  - Chronological log of all UI changes made in this session.
  - Each entry: timestamp, element, change (e.g., "Button: color #0894b4"), applied by (user or AI).
  - Undo / Redo buttons.

---

### 3. Professional Visual Design System

**Goal:** Replace "vibe-coded" styling with a consistent, reusable design system.

#### Typography

Define a **Tailwind-based type scale**:

// tailwind.config.ts (typography section)
module.exports = {
theme: {
fontSize: {
'xs': ['11px', { lineHeight: '16px' }],
'sm': ['12px', { lineHeight: '16px' }],
'base': ['14px', { lineHeight: '20px' }],
'md': ['14px', { lineHeight: '20px' }],
'lg': ['16px', { lineHeight: '24px' }],
'xl': ['18px', { lineHeight: '28px' }],
'2xl': ['20px', { lineHeight: '28px' }],
'3xl': ['24px', { lineHeight: '32px' }],
'4xl': ['30px', { lineHeight: '36px' }],
'5xl': ['36px', { lineHeight: '44px' }],
},
fontWeight: {
normal: 400,
medium: 500,
semibold: 600,
bold: 700,
},
},
};

text

#### Color Palette

Use a **primary + neutral + semantic color system**:

// tailwind.config.ts (colors section)
module.exports = {
theme: {
colors: {
// Neutrals
'slate-50': '#f8fafc',
'slate-100': '#f1f5f9',
'slate-200': '#e2e8f0',
'slate-300': '#cbd5e1',
'slate-400': '#94a3b8',
'slate-500': '#64748b',
'slate-600': '#475569',
'slate-700': '#334155',
'slate-800': '#1e293b',
'slate-900': '#0f172a',

text
  // Primary (Teal / Blue-Green)
  'primary-50': '#f0fdfa',
  'primary-100': '#ccfbf1',
  'primary-200': '#99f6e4',
  'primary-300': '#5eead4',
  'primary-400': '#2dd4bf',
  'primary-500': '#14b8a6',
  'primary-600': '#0d9488',
  'primary-700': '#0f766e',
  'primary-800': '#115e59',
  'primary-900': '#134e4a',

  // Semantic
  'success': '#10b981',
  'warning': '#f59e0b',
  'error': '#ef4444',
  'info': '#3b82f6',

  // Transparent
  'white': '#ffffff',
  'black': '#000000',
  'transparent': 'transparent',
},
},
};

text

#### Spacing & Sizing

// tailwind.config.ts (spacing section)
module.exports = {
theme: {
spacing: {
'0': '0px',
'1': '4px',
'2': '8px',
'3': '12px',
'4': '16px',
'5': '20px',
'6': '24px',
'8': '32px',
'10': '40px',
'12': '48px',
'16': '64px',
'20': '80px',
'24': '96px',
},
},
};

text

#### Border Radius

module.exports = {
theme: {
borderRadius: {
'none': '0px',
'sm': '4px',
'base': '6px',
'md': '8px',
'lg': '12px',
'xl': '16px',
'full': '9999px',
},
},
};

text

#### Shadows

module.exports = {
theme: {
boxShadow: {
'none': 'none',
'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
'base': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
},
},
};

text

---

### 4. Reusable Component Library

**Goal:** Build a small library of composable, styled components used throughout the app.

#### Components to Create

Each component should:
- Use TypeScript for type safety.
- Accept standard props (className, disabled, loading, etc.).
- Be accessible (ARIA labels, keyboard support, color contrast).
- Work seamlessly with Tailwind classes.

**Button**
// components/Button.tsx
interface ButtonProps {
variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
size?: 'sm' | 'md' | 'lg';
disabled?: boolean;
loading?: boolean;
children: React.ReactNode;
onClick?: () => void;
className?: string;
}

export const Button: React.FC<ButtonProps> = ({
variant = 'primary',
size = 'md',
disabled,
loading,
children,
onClick,
className,
}) => {
// Implementation with Tailwind classes
};

text

**Card**
// components/Card.tsx
interface CardProps {
children: React.ReactNode;
className?: string;
hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hover }) => {
// Implementation with shadow, border, padding via Tailwind
};

text

**Modal**
// components/Modal.tsx
interface ModalProps {
isOpen: boolean;
onClose: () => void;
title?: string;
children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
// Implementation with overlay, center alignment, close button
};

text

**Sidebar / NavBar**
// components/Sidebar.tsx
interface SidebarProps {
items: NavItem[];
activeItem?: string;
onItemClick: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ items, activeItem, onItemClick }) => {
// Implementation with list, hover states, active indicators
};

text

**Status Indicator**
// components/StatusIndicator.tsx
interface StatusIndicatorProps {
status: 'idle' | 'calibrating' | 'tracking' | 'error';
label: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label }) => {
// Implementation with color-coded dot + text
};

text

**Alert / Toast**
// components/Alert.tsx
interface AlertProps {
type: 'info' | 'success' | 'warning' | 'error';
title: string;
message?: string;
onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type, title, message, onDismiss }) => {
// Implementation with icon, color, dismiss button
};

text

---

### 5. Onboarding & First-Time User Experience

**Goal:** Guide new users through the app with clarity and reduce friction.

#### First-Time User Tour

When a logged-in user visits the app for the first time:

1. **Welcome Modal**
   - Title: "Welcome to ClientSight!"
   - Brief explanation of what they can do.
   - Button: "Start Tour" or "Skip"

2. **Step-by-Step Highlights**
   - Step 1: "Left sidebar – navigate projects and settings."
   - Step 2: "Center canvas – preview the website being analyzed."
   - Step 3: "Right panel – view gaze status, suggestions, and change history."
   - Step 4: "Start gaze tracking by clicking 'Enable' and completing calibration."
   - Each step: highlight relevant UI elements with a semi-transparent overlay.
   - Navigation: Previous, Next, Skip buttons.

3. **Completion**
   - Congratulation message.
   - Button: "Take Me to Dashboard" or "Try Demo."

#### In-App Tooltips

Add subtle, non-intrusive tooltips for less obvious controls:
- Hover over icons → show tooltip (e.g., "Recalibrate gaze tracking").
- Use a small `?` icon in headers for quick help links.

---

## Implementation Guidelines

### File Structure

src/
├── components/
│ ├── common/
│ │ ├── Button.tsx
│ │ ├── Card.tsx
│ │ ├── Modal.tsx
│ │ ├── Sidebar.tsx
│ │ ├── StatusIndicator.tsx
│ │ └── Alert.tsx
│ ├── layout/
│ │ ├── Header.tsx
│ │ ├── Footer.tsx
│ │ └── Workspace.tsx
│ ├── pages/
│ │ ├── LandingPage.tsx
│ │ ├── Dashboard.tsx
│ │ ├── AppWorkspace.tsx
│ │ └── NotFound.tsx
│ └── tours/
│ └── OnboardingTour.tsx
├── styles/
│ ├── globals.css
│ └── tailwind.config.ts
├── hooks/
│ ├── useWindowSize.ts
│ └── useTour.ts
└── lib/
└── constants.ts

text

### Styling Rules

- **Use Tailwind classes** for all styling. No inline styles.
- **Avoid `@apply` directive**; instead, use utility classes directly in JSX for clarity.
- **Dark mode support** (optional but encouraged):
  - Add `dark:` prefixes to Tailwind classes.
  - Use `prefers-color-scheme` media query in global CSS.
- **Responsive design**:
  - Mobile-first approach: default styles are mobile, then add `md:`, `lg:`, `xl:` breakpoints.
  - Test on: 375px (mobile), 768px (tablet), 1024px+ (desktop).

### Accessibility

- **Color contrast**: All text must meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text).
- **Keyboard navigation**: All interactive elements must be reachable via Tab.
- **ARIA labels**: Buttons, inputs, and complex components need `aria-label` or `aria-describedby`.
- **Focus indicators**: Always visible (not removed via `outline: none`).

### Performance

- **Code-split**: Use lazy imports for pages (`React.lazy` + `Suspense`).
- **Image optimization**: Compress images, use WebP where supported.
- **Avoid unnecessary re-renders**: Memoize components if they have expensive child logic.

---

## Certainty & Escalation

### High-Confidence Changes

You can proceed with:
- Creating new components for standard UI patterns (buttons, cards, sidebars).
- Updating Tailwind config to define design tokens (colors, spacing, typography).
- Refactoring existing layouts to match the workspace structure described above.

### Low-Confidence Scenarios

**Ask before proceeding if:**
- You are unsure whether to modify an existing component or create a new one.
- You need to understand the current project structure (file paths, existing components).
- You want to confirm the exact landing page sections or workspace layout priorities.

**Escalation questions to ask:**
- "Should I create a new `LandingPage.tsx` component or refactor existing code at `[path]`?"
- "Are there existing components in `components/` that I should reuse or extend, or should I start fresh?"
- "What is the current landing page structure? Should I preserve any sections or completely redesign?"
- "Is there a preferred color scheme or brand guide I should reference?"

---

## Success Criteria

✅ **Completed when:**
- Landing page is visually polished, professional, and matches modern SaaS design standards.
- In-app workspace layout is clear, organized, and functional.
- Design system (colors, typography, spacing, components) is fully defined and implemented.
- All UI components are reusable, accessible, and documented.
- Onboarding tour guides new users without friction.
- App looks and feels like a premium, production-ready tool (not a hackathon project).

---

## Next Steps

1. **Agent 2** will ensure gaze tracking flows seamlessly with the new UI (no random overlays, clean state management).
2. **Agent 3** will ensure Gemini-powered suggestions integrate cleanly into the right panel and respect the design system.
3. All three agents will coordinate on overlaps (e.g., placing gaze status indicator, styling AI-generated suggestions).

---

**End of Agent 1 Document**
