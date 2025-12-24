# AGENT_3_WEB_BUILDER_GEMINI.md

## Agent 3: Web Builder & Gemini Integration Engineer

**Role:** Rebuild the web app builder (v0/Bolt.new clone) with Gemini 3 integration, gaze-tracking component editing, live preview, and exportable code generation.

**Owner:** Cursor Agent 3 – Web Builder & Gemini Integration Engineer  
**Last Updated:** December 24, 2025  
**Status:** Active Development

---

## Overview

ClientSight's **web app builder** is the core product differentiator. Users should be able to:

1. **Input a prompt** (text or document upload) describing any website/app they want to build.
2. **Gemini 3 generates full, functional code** for the requested site (landing pages, galleries, dashboards, etc.).
3. **Live visual preview** with gaze tracking integrated.
4. **Gaze-based component editing:** Lock onto any component with eye-tracking, enter a small text prompt to modify it (color, size, shape, etc.).
5. **Export as ZIP** with clean, production-ready code the user can import into an IDE.
6. **Full gaze tracking feature parity** with dashboard (enable/disable, calibrate, camera view, recalibrate).
7. **Live, dynamic updates** as users make changes via gaze + prompts.

This document provides comprehensive guidelines for **rebuilding the web builder from scratch** with a polished UI/UX matching the landing page & dashboard design system.

---

## Tech Stack (No Changes)

- **Frontend:** React 18 + TypeScript
- **Styling:** TailwindCSS (consistent with landing page + dashboard design system)
- **AI Model:** Gemini 3 (via official Google AI SDK)
- **Gaze Tracking:** WebGazer.js (integrated from dashboard)
- **Code Generation:** Gemini 3 → React/HTML/CSS → exportable ZIP
- **Preview:** Embedded iframe or live React component render
- **Data Storage:** Firebase Firestore (projects, sessions, export history)
- **Export:** JSZip library to generate downloadable ZIP files

---

## Primary Responsibilities

### 1. Web Builder UI/UX Redesign

**Current State:** Unknown/incomplete, likely not polished.

**Target State:** Professional, intuitive builder interface matching the design system of the landing page and dashboard.

#### Layout Structure

┌─────────────────────────────────────────────────────────────┐
│ Top Navigation Bar │
│ (Logo | Project Name | Save | Share | Export | Settings) │
├────────────────────────┬──────────────────┬─────────────────┤
│ │ │ │
│ Left Sidebar │ Canvas Preview │ Right Panel │
│ (Project List │ (Live Preview │ (Component │
│ Prompt Input │ of Generated │ Suggestions │
│ History) │ Website) │ Gaze Status │
│ │ │ Component │
│ │ │ Props Editor) │
├────────────────────────┴──────────────────┴─────────────────┤
│ Status Bar │
│ (Generation Status | Gaze Tracking | Save Status) │
└─────────────────────────────────────────────────────────────┘

text

#### Left Sidebar

**Project Management:**
- **Logo** with app name.
- **Current Project Name** (editable, with rename button).
- **Project List** (Recent projects, favorites, all projects).
- **New Project** button.

**Prompt Input Section:**
- **Heading:** "Describe Your Website"
- **Textarea or File Upload:**
  - Text input: Large textarea for typing/pasting prompts.
  - File upload: Drag-and-drop or file input for documents (`.txt`, `.md`, `.pdf` support).
  - Character counter: "0 / 2000" characters.
- **Generation Controls:**
  - "Generate Website" button (primary, prominent).
  - "Clear" button (reset prompt).
- **Advanced Options (collapsible):**
  - Framework preference: React / HTML+CSS / Vue (default: React).
  - Design style: Modern / Minimal / Bold / Corporate.
  - Color scheme: Auto-detect from prompt / Light / Dark / Custom.

**Project History:**
- Recent prompts (last 5–10).
- Quick access to regenerate or modify.

#### Center Canvas (Live Preview)

**Preview Area:**
- Full-screen or adjustable-size preview of the generated website.
- **Gaze Cursor Overlay** (if gaze tracking enabled):
  - Small, non-intrusive circle showing current gaze point.
  - Element highlight when gaze locks on component.
- **Heatmap Toggle** (optional, from dashboard):
  - Show/hide attention heatmap overlay.
- **Zoom Controls:**
  - Zoom in / out / fit-to-screen.
  - Responsive breakpoint selector (mobile 375px, tablet 768px, desktop 1024px+).

**Toolbar Above Canvas:**
- "Recalibrate Gaze" button (only if gaze enabled).
- Pause / Resume Tracking.
- Clear Gaze Data.
- Screenshot / Export Preview as PNG.

#### Right Panel (Tabbed Interface)

**Tab 1: Component Inspector**
- **Selected Component:**
  - Name (e.g., "Hero Button", "Product Card").
  - Element type (button, card, section, etc.).
  - Current styling (color, size, font size, etc.).
- **Edit Controls:**
  - Text input: "Modify this component…" (small prompt field).
  - Quick edit buttons: Change color, size, text, alignment.
  - "Apply Changes" button.
  - "Undo" / "Redo" for this component.

**Tab 2: Suggestions**
- **AI-Driven Component Suggestions:**
  - List of components Gemini recommends based on the page layout.
  - E.g., "Add CTA Button here", "Consider testimonial section", etc.
  - "Insert Component" button for each suggestion.

**Tab 3: Gaze Status & Control**
- **Gaze Status Indicator:**
  - 🔴 Red: "Tracking Disabled"
  - 🟡 Yellow: "Calibrating"
  - 🟢 Green: "Tracking Active" + current accuracy.
- **Controls:**
  - "Enable Gaze Tracking" button (if disabled).
  - "Recalibrate" button.
  - "Pause" / "Resume" toggle.
  - "Camera View" button (show webcam feed for user to see where they're looking).
- **Calibration Info:**
  - Accuracy: "±78px"
  - Session duration.
  - Data points collected.

**Tab 4: Export & Download**
- **Export Options:**
  - "Download as ZIP" (primary).
  - "Copy Code to Clipboard".
  - "Export as GitHub Repo" (future).
- **ZIP Contents Preview:**
  - List of files to be included (index.html, styles.css, components/, etc.).
- **Deployment Options:**
  - "Deploy to Vercel" (future integration).
  - "Deploy to Netlify" (future integration).

#### Top Navigation Bar

- **Logo** (clickable, returns to dashboard).
- **Project Name** with edit icon.
- **Save Status:** "All changes saved" (green) or "Saving…" (yellow) or "Error" (red).
- **Share Button:** Generate shareable preview link.
- **Export Button:** Quick access to export/download.
- **Settings Icon:** Project settings, framework preferences, color scheme.
- **User Profile / Logout.**

#### Status Bar (Bottom)

- **Generation Status:** "Generating website…" with progress or "Ready".
- **Gaze Status:** Current gaze mode (idle, calibrating, tracking, paused).
- **File Size:** "Current project: 45 KB".
- **Help Icon:** Quick help / keyboard shortcuts.

---

### 2. Gemini 3 Integration for Website Generation

**Goal:** Use Gemini 3 to generate complete, production-ready website code from user prompts.

#### Prompt Architecture

Design a **hierarchical, multi-step prompt system** that guides Gemini to produce consistent, high-quality code.

**System Prompt (Context):**

// prompts/systemPrompt.ts
export const SYSTEM_PROMPT = `You are an expert web developer and UI/UX designer. Your task is to generate production-ready website code based on user descriptions.

CONSTRAINTS:

Generate React components using React 18 + TypeScript.

Use ONLY TailwindCSS for styling (no inline styles, no CSS files, no other CSS libraries).

Make components reusable, with clear prop interfaces.

Ensure responsive design (mobile-first, breakpoints at 640px, 768px, 1024px+).

Use semantic HTML and accessibility best practices (WCAG 2.1 AA).

Export components as default exports, named correctly.

Create a root `App.tsx` that imports and renders all components.

Include a `tailwind.config.ts` with color palette and spacing tokens.

Include a `globals.css` for base styles.

OUTPUT FORMAT:
Return a JSON object with structure:
{
"components": [
{
"filename": "Button.tsx",
"content": "React component code here"
},
...
],
"config": {
"filename": "tailwind.config.ts",
"content": "Tailwind config here"
},
"styles": {
"filename": "globals.css",
"content": "Global CSS here"
},
"app": {
"filename": "App.tsx",
"content": "Root component here"
},
"metadata": {
"title": "Website Title",
"description": "Brief description",
"framework": "react",
"colors": ["primary", "secondary", "accent"],
"components_created": ["Button", "Card", "Header", ...]
}
}

DESIGN SYSTEM:
Use this color palette for all components:

Primary: #14b8a6 (teal)

Secondary: #1e293b (slate)

Accent: #0d9488 (teal-dark)

Background: #f8fafc (slate-50)

Text: #0f172a (slate-900)

Use consistent spacing: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px.
Use consistent border radius: 4px (sm), 6px (base), 8px (md), 12px (lg).

QUALITY CHECKS:

All components have TypeScript interfaces for props.

All interactive elements are accessible (buttons, inputs, etc.).

No hardcoded text (all content passed via props).

Code is formatted, commented, and clean.`;

text

**User Prompt Template:**

// prompts/generateWebsite.ts
export function createGenerateWebsitePrompt(
userDescription: string,
options?: {
framework?: 'react' | 'html' | 'vue';
style?: 'modern' | 'minimal' | 'bold' | 'corporate';
scheme?: 'light' | 'dark' | 'auto';
}
): string {
return `Generate a complete website based on this description:

${userDescription}

OPTIONS:

Framework: ${options?.framework || 'react'}

Design Style: ${options?.style || 'modern'}

Color Scheme: ${options?.scheme || 'light'}

Requirements:

Create all necessary components for the described website.

Ensure layout is responsive and matches the described use case.

Include a header/navigation if relevant.

Include a footer if relevant.

Add sample content/images where needed (use placeholder images).

Make sure all interactive elements (buttons, forms, etc.) have proper styling and hover states.

Return the complete JSON structure as specified in the system prompt.`;
}

text

#### Multi-Step Generation Flow

// hooks/useWebsiteGeneration.ts
export interface GenerationPhase {
phase: 'idle' | 'parsing' | 'generating_structure' | 'generating_components' | 'finalizing' | 'complete';
progress: number; // 0-100
message: string;
error?: string;
}

export function useWebsiteGeneration() {
const [state, setState] = React.useState<GenerationPhase>({
phase: 'idle',
progress: 0,
message: 'Ready to generate',
});
const [generatedCode, setGeneratedCode] = React.useState<{
components: Array<{ filename: string; content: string }>;
config: { filename: string; content: string };
styles: { filename: string; content: string };
app: { filename: string; content: string };
metadata: any;
} | null>(null);

async function generateWebsite(prompt: string, options?: any) {
try {
// Phase 1: Parse & validate input
setState({ phase: 'parsing', progress: 10, message: 'Parsing your prompt…' });
const validatedPrompt = validateAndCleanPrompt(prompt);

text
  // Phase 2: Generate structure
  setState({ phase: 'generating_structure', progress: 30, message: 'Planning page structure…' });
  const structurePrompt = `Based on this request, outline the page structure (sections, components, layout):
${validatedPrompt}

Respond with a brief JSON outline of sections and key components.`;

text
  const structureResponse = await callGemini({
    prompt: structurePrompt,
    temperature: 0.7,
    maxOutputTokens: 1024,
  });

  // Phase 3: Generate components
  setState({ phase: 'generating_components', progress: 60, message: 'Generating components…' });
  const fullPrompt = createGenerateWebsitePrompt(validatedPrompt, options);
  const response = await callGemini({
    prompt: fullPrompt,
    temperature: 0.7,
    maxOutputTokens: 8192, // Large token limit for full site
  });

  // Phase 4: Parse & validate response
  setState({ phase: 'finalizing', progress: 85, message: 'Validating generated code…' });
  const parsed = parseGeminiResponse(response.text);
  
  // Validate TypeScript syntax (optional, advanced)
  validateTypeScriptSyntax(parsed);

  setGeneratedCode(parsed);

  setState({ phase: 'complete', progress: 100, message: 'Website generated successfully!' });
} catch (error) {
  setState({
    phase: 'idle',
    progress: 0,
    message: 'Error',
    error: (error as Error).message,
  });
}
}

return { state, generatedCode, generateWebsite };
}

function validateAndCleanPrompt(prompt: string): string {
// Remove extra whitespace, normalize line breaks, etc.
return prompt.trim().replace(/\s+/g, ' ');
}

function parseGeminiResponse(text: string): any {
// Extract JSON from response (Gemini may wrap it in markdown code blocks)
const jsonMatch = text.match(/(?:json)?\s*([\s\S]*?)
const jsonStr = jsonMatch ? jsonMatch : text;
​
return JSON.parse(jsonStr);
}

function validateTypeScriptSyntax(parsed: any): boolean {
// Optional: use a TypeScript parser library to validate syntax
// For now, just check structure
if (!parsed.components || !parsed.app || !parsed.config) {
throw new Error('Invalid response structure');
}
return true;
}

text

#### Streaming & Incremental Rendering (Optional Enhancement)

For large websites, stream components as they're generated:

// Advanced: Stream components as Gemini generates
export async function* streamWebsiteGeneration(prompt: string) {
const fullPrompt = createGenerateWebsitePrompt(prompt);

// Use Gemini's streaming API (if available in SDK)
const stream = await model.generateContentStream({
contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
});

for await (const chunk of stream.stream) {
yield chunk.text(); // Yield partial text as it arrives
}
}

text

---

### 3. Gaze-Based Component Editing

**Goal:** Users can lock onto any component in the preview with their gaze, then enter a small text prompt to modify it in real-time.

#### Component Detection & Highlighting

// utils/componentDetection.ts
export interface DetectedComponent {
id: string;
name: string;
type: string; // 'button', 'card', 'section', etc.
element: HTMLElement;
bbox: DOMRect;
gazeLockedAt?: number; // timestamp when gaze locked
}

export function detectComponents(rootElement: HTMLElement): DetectedComponent[] {
const components: DetectedComponent[] = [];
const selector = '[data-component], button, [role="button"], .card, header, nav, section, footer';

rootElement.querySelectorAll(selector).forEach((el, idx) => {
const bbox = el.getBoundingClientRect();
if (bbox.width > 0 && bbox.height > 0) { // Only visible elements
components.push({
id: component-${idx},
name: el.getAttribute('data-component-name') || el.className || el.tagName,
type: el.getAttribute('data-component-type') || el.tagName.toLowerCase(),
element: el as HTMLElement,
bbox,
});
}
});

return components;
}

export function getComponentAtGazePoint(
gazeX: number,
gazeY: number,
components: DetectedComponent[]
): DetectedComponent | null {
for (const comp of components) {
if (
gazeX >= comp.bbox.left &&
gazeX <= comp.bbox.right &&
gazeY >= comp.bbox.top &&
gazeY <= comp.bbox.bottom
) {
return comp;
}
}
return null;
}

text

#### Gaze Lock & Component Selection

// hooks/useComponentGazeLock.ts
export function useComponentGazeLock(previewIframeRef: React.RefObject<HTMLIFrameElement>) {
const { session: gazeSession } = useGaze();
const [detectedComponents, setDetectedComponents] = React.useState<DetectedComponent[]>([]);
const [lockedComponent, setLockedComponent] = React.useState<DetectedComponent | null>(null);
const [gazeLockDuration, setGazeLockDuration] = React.useState(0);

const GAZE_LOCK_THRESHOLD_MS = 500; // Lock after 500ms of continuous gaze

React.useEffect(() => {
if (!previewIframeRef.current || gazeSession.gazeStatus !== 'tracking') return;

text
// Get iframe document & detect components
const iframeDoc = previewIframeRef.current.contentDocument;
if (!iframeDoc) return;

const comps = detectComponents(iframeDoc.body);
setDetectedComponents(comps);

// Listen to gaze position updates (via gaze context or custom event)
const handleGazeUpdate = (event: CustomEvent) => {
  const { x, y } = event.detail;
  const comp = getComponentAtGazePoint(x, y, comps);

  if (comp) {
    // Update lock duration
    if (lockedComponent?.id === comp.id) {
      setGazeLockDuration((prev) => prev + 50); // Update every 50ms
      if (gazeLockDuration >= GAZE_LOCK_THRESHOLD_MS) {
        // Lock achieved
        comp.gazeLockedAt = Date.now();
        highlightComponent(comp, iframeDoc);
      }
    } else {
      // New component
      setLockedComponent(comp);
      setGazeLockDuration(0);
    }
  } else {
    setLockedComponent(null);
    setGazeLockDuration(0);
  }
};

window.addEventListener('gazeupdated', handleGazeUpdate as any);
return () => window.removeEventListener('gazeupdated', handleGazeUpdate as any);
}, [gazeSession.gazeStatus, previewIframeRef, lockedComponent, gazeLockDuration]);

function highlightComponent(comp: DetectedComponent, doc: Document) {
// Remove previous highlight
doc.querySelectorAll('.gaze-locked').forEach((el) => el.classList.remove('gaze-locked'));

text
// Highlight current component
comp.element.classList.add('gaze-locked');
comp.element.style.outline = '3px solid #14b8a6';
comp.element.style.outlineOffset = '2px';
}

return { lockedComponent, detectedComponents, gazeLockDuration };
}

text

#### Component Editing Prompt Panel

// components/ComponentEditPanel.tsx
interface ComponentEditPanelProps {
component: DetectedComponent | null;
onApplyEdit: (edit: string) => Promise<void>;
isLoading?: boolean;
}

export const ComponentEditPanel: React.FC<ComponentEditPanelProps> = ({
component,
onApplyEdit,
isLoading,
}) => {
const [editPrompt, setEditPrompt] = React.useState('');

const handleApply = async () => {
if (!editPrompt.trim() || !component) return;
await onApplyEdit(editPrompt);
setEditPrompt('');
};

if (!component) {
return (
<div className="p-4 text-slate-500 text-sm">
Lock onto a component with your gaze to edit it.
</div>
);
}

return (
<div className="p-4 border-t">
<h3 className="font-semibold text-sm mb-2">Edit Component</h3>
<p className="text-xs text-slate-600 mb-3">
Component: <span className="font-mono">{component.name}</span>
</p>

text
  <textarea
    value={editPrompt}
    onChange={(e) => setEditPrompt(e.target.value)}
    placeholder="E.g., 'Make button blue', 'Increase font size', 'Change text to Submit'"
    className="w-full p-2 border rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
    rows={3}
    disabled={isLoading}
  />

  <div className="flex gap-2 mt-3">
    <Button
      onClick={handleApply}
      disabled={!editPrompt.trim() || isLoading}
      loading={isLoading}
      className="flex-1"
    >
      Apply Edit
    </Button>
    <Button
      variant="outline"
      onClick={() => setEditPrompt('')}
      disabled={isLoading}
      className="flex-1"
    >
      Clear
    </Button>
  </div>
</div>
);
};

text

#### Gemini-Powered Component Modification

// services/componentModificationService.ts
export async function modifyComponentWithGaze(
componentCode: string,
componentName: string,
editPrompt: string
): Promise<string> {
const prompt = `You are a React component modifier. Given a component and a modification request, return ONLY the modified component code (no explanations).

Original Component:
```tsx
${componentCode}
```

Component Name: ${componentName}

Modification Request: ${editPrompt}

IMPORTANT:

Maintain the component's existing prop interface.

Preserve all existing functionality.

Use only TailwindCSS for styling changes.

Return ONLY the complete modified component code in a code block.

Do NOT include explanations or markdown outside the code block.`;

const response = await callGemini({
prompt,
temperature: 0.5, // Lower temp for more deterministic output
maxOutputTokens: 2048,
});

// Extract code from response (may be wrapped in code block)
const codeMatch = response.text.match(/(?:tsx|jsx)?\s*([\s\S]*?)
return codeMatch ? codeMatch.trim() : response.text.trim();
​
}

text

#### Live Update in Preview

// hooks/useComponentLiveUpdate.ts
export function useComponentLiveUpdate(
previewIframeRef: React.RefObject<HTMLIFrameElement>,
generatedCode: any
) {
const [isUpdating, setIsUpdating] = React.useState(false);

async function applyComponentEdit(
component: DetectedComponent,
editPrompt: string,
allComponents: any
) {
try {
setIsUpdating(true);

text
  // Find component in generated code
  const componentFile = allComponents.components.find(
    (c: any) => c.filename.includes(component.name)
  );
  if (!componentFile) throw new Error('Component source not found');

  // Modify via Gemini
  const modifiedCode = await modifyComponentWithGaze(
    componentFile.content,
    component.name,
    editPrompt
  );

  // Update in memory
  componentFile.content = modifiedCode;

  // Re-render in preview iframe
  const iframeDoc = previewIframeRef.current?.contentDocument;
  if (iframeDoc) {
    // This is simplified; real implementation would require a module bundler
    // or re-rendering the entire component tree
    updateComponentInPreview(iframeDoc, component.name, modifiedCode);
  }

  setIsUpdating(false);
} catch (error) {
  console.error('Failed to apply edit:', error);
  setIsUpdating(false);
}
}

return { applyComponentEdit, isUpdating };
}

function updateComponentInPreview(doc: Document, componentName: string, newCode: string) {
// This is a simplified placeholder
// In a real implementation, you'd need to:
// 1. Re-compile the component (e.g., using @babel/standalone or a bundler)
// 2. Update the module in the iframe's context
// 3. Re-render the component

// For now, just log
console.log(Updated ${componentName} in preview:, newCode);
}

text

---

### 4. Export as ZIP with Production-Ready Code

**Goal:** Generate a downloadable ZIP file with clean, organized project structure.

#### ZIP File Structure

website-project.zip
├── public/
│ └── index.html # Entry point
├── src/
│ ├── components/
│ │ ├── Header.tsx
│ │ ├── Hero.tsx
│ │ ├── Footer.tsx
│ │ └── ...
│ ├── App.tsx # Root component
│ ├── index.tsx # React render entry
│ └── globals.css # Global styles
├── tailwind.config.ts # TailwindCSS config
├── tsconfig.json # TypeScript config
├── package.json # Dependencies
├── README.md # Project documentation
└── .gitignore # Git ignore rules

text

#### Export Service

// services/exportService.ts
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface ExportOptions {
projectName: string;
includeReadme?: boolean;
includeGitignore?: boolean;
framework?: 'react' | 'html' | 'vue';
}

export async function exportProjectAsZip(
generatedCode: any,
options: ExportOptions
): Promise<void> {
const zip = new JSZip();

// Create folder structure
const srcFolder = zip.folder('src');
const componentsFolder = srcFolder?.folder('components');
const publicFolder = zip.folder('public');

// Add components
generatedCode.components.forEach((comp: any) => {
componentsFolder?.file(comp.filename, comp.content);
});

// Add root files
srcFolder?.file('App.tsx', generatedCode.app.content);
srcFolder?.file('globals.css', generatedCode.styles.content);
srcFolder?.file('index.tsx', generateIndexFile());

// Add config files
zip.file('tailwind.config.ts', generatedCode.config.content);
zip.file('tsconfig.json', generateTsConfig());
zip.file('package.json', generatePackageJson(generatedCode.metadata));

// Add public files
publicFolder?.file(
'index.html',
generateHtmlEntry(generatedCode.metadata.title)
);

// Add documentation
if (options.includeReadme) {
zip.file('README.md', generateReadme(generatedCode.metadata));
}

if (options.includeGitignore) {
zip.file('.gitignore', generateGitignore());
}

// Generate and download ZIP
const blob = await zip.generateAsync({ type: 'blob' });
saveAs(blob, ${options.projectName || 'website'}.zip);
}

function generateIndexFile(): string {
return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
<React.StrictMode>
<App />
</React.StrictMode>
);`;
}

function generatePackageJson(metadata: any): string {
return JSON.stringify(
{
name: metadata.title?.toLowerCase().replace(/\s+/g, '-') || 'website',
version: '1.0.0',
description: metadata.description || 'A website generated with ClientSight',
type: 'module',
scripts: {
dev: 'vite',
build: 'tsc && vite build',
preview: 'vite preview',
},
dependencies: {
react: '^18.2.0',
'react-dom': '^18.2.0',
},
devDependencies: {
'@types/react': '^18.2.0',
'@types/react-dom': '^18.2.0',
'@vitejs/plugin-react': '^4.0.0',
typescript: '^5.0.0',
vite: '^4.0.0',
tailwindcss: '^3.3.0',
'postcss': '^8.4.0',
'autoprefixer': '^10.4.0',
},
},
null,
2
);
}

function generateTsConfig(): string {
return JSON.stringify(
{
compilerOptions: {
target: 'ES2020',
useDefineForClassFields: true,
lib: ['ES2020', 'DOM', 'DOM.Iterable'],
module: 'ESNext',
skipLibCheck: true,
esModuleInterop: true,
allowSyntheticDefaultImports: true,
strict: true,
resolveJsonModule: true,
isolatedModules: true,
moduleResolution: 'bundler',
noEmit: true,
jsx: 'react-jsx',
},
include: ['src'],
references: [{ path: './tsconfig.node.json' }],
},
null,
2
);
}

function generateHtmlEntry(title: string): string {
return `<!doctype html>

<html lang="en"> <head> <meta charset="UTF-8" /> <meta name="viewport" content="width=device-width, initial-scale=1.0" /> <title>${title || 'Website'}</title> </head> <body> <div id="root"></div> <script type="module" src="/src/index.tsx"></script> </body> </html>`; }
function generateReadme(metadata: any): string {
return `# ${metadata.title || 'Website'}

${metadata.description ? ${metadata.description}\n\n : ''}## Getting Started

This project was generated with ClientSight.

Installation
```bash
npm install
```

Development
```bash
npm run dev
```

Open http://localhost:5173 to view in browser.

Build
```bash
npm run build
```

Deployment
Deploy the `dist` folder to any static hosting (Vercel, Netlify, GitHub Pages, etc.).

Components
${metadata.components_created?.map((c: string) => - ${c}).join('\n') || '- Custom components'}

Technologies
React 18

TypeScript

TailwindCSS

Vite

Generated with ❤️ by ClientSight`;
}

function generateGitignore(): string {
return `# Logs
logs
.log
npm-debug.log
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

Dependencies
node_modules
.pnp
.pnp.js

Production
dist
dist-ssr

Misc
.DS_Store
.env
.env.local
.env.*.local

Editor directories and files
.vscode
.idea
*.suo
.ntvs
*.njsproj
*.sln
*.sw?`;
}

text

#### Export UI Component

// components/ExportPanel.tsx
interface ExportPanelProps {
generatedCode: any;
isExporting?: boolean;
onExport: () => Promise<void>;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
generatedCode,
isExporting,
onExport,
}) => {
const [projectName, setProjectName] = React.useState('my-website');
const [includeReadme, setIncludeReadme] = React.useState(true);
const [includeGitignore, setIncludeGitignore] = React.useState(true);

const handleExport = async () => {
await exportProjectAsZip(generatedCode, {
projectName,
includeReadme,
includeGitignore,
});
};

return (
<div className="p-4 space-y-4">
<div>
<label className="block text-sm font-medium mb-2">Project Name</label>
<input
type="text"
value={projectName}
onChange={(e) => setProjectName(e.target.value)}
className="w-full px-3 py-2 border rounded text-sm"
placeholder="my-website"
/>
</div>

text
  <div className="space-y-2">
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={includeReadme}
        onChange={(e) => setIncludeReadme(e.target.checked)}
      />
      <span className="text-sm">Include README.md</span>
    </label>
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={includeGitignore}
        onChange={(e) => setIncludeGitignore(e.target.checked)}
      />
      <span className="text-sm">Include .gitignore</span>
    </label>
  </div>

  <div className="border-t pt-4">
    <h4 className="text-sm font-semibold mb-2">Files to Export:</h4>
    <ul className="text-xs text-slate-600 space-y-1">
      <li>✓ {generatedCode.components?.length || 0} React components</li>
      <li>✓ TailwindCSS configuration</li>
      <li>✓ TypeScript config</li>
      <li>✓ package.json with dependencies</li>
      {includeReadme && <li>✓ README.md</li>}
      {includeGitignore && <li>✓ .gitignore</li>}
    </ul>
  </div>

  <Button
    onClick={handleExport}
    disabled={isExporting}
    loading={isExporting}
    className="w-full"
  >
    Download as ZIP
  </Button>

  <Button variant="secondary" className="w-full">
    Copy Code to Clipboard
  </Button>
</div>
);
};

text

---

### 5. Full Gaze Tracking Feature Parity

**Goal:** Gaze tracking in the web builder has 100% feature parity with the dashboard.

#### Features

✅ **Enable / Disable Gaze Tracking**
- Checkbox or toggle button in right panel Tab 3.
- Only available to authenticated users.
- Only shows when gaze permission is granted.

✅ **Calibration**
- "Calibrate" button triggers 5-point calibration flow.
- Calibration state is saved (Agent 2 handles persistence).
- "Recalibrate" button available at any time.

✅ **Live Gaze Cursor**
- Small circle overlay showing current gaze point.
- Visible in canvas when tracking is enabled.
- Non-intrusive, subtle styling.

✅ **Camera View**
- "Show Camera" button reveals live webcam feed (small window in corner of canvas).
- User can see themselves and verify tracking accuracy.
- Toggle on/off.

✅ **Pause / Resume Tracking**
- "Pause" pauses gaze collection (cursor disappears).
- "Resume" continues.
- Useful while user is reading or not interacting.

✅ **Status Indicator**
- Color-coded status (🔴 disabled, 🟡 calibrating, 🟢 tracking).
- Displays current accuracy (±Xpx).
- Session info (time elapsed, data points).

#### Implementation

All gaze tracking logic comes from the `GazeContext` (Agent 2). The web builder just consumes it:

// components/WebBuilderGazePanel.tsx
export const WebBuilderGazePanel: React.FC = () => {
const { session, enableGaze, disableGaze, startCalibration, pauseTracking, resumeTracking } =
useGaze();
const { user } = useAuth();
const [showCamera, setShowCamera] = React.useState(false);

if (!user) return null; // Gaze only for authenticated users

return (
<div className="p-4 border-t space-y-4">
<div>
<h3 className="font-semibold text-sm mb-3">Gaze Tracking</h3>

text
    {/* Status */}
    <StatusIndicator status={session.gazeStatus} label={getStatusLabel(session.gazeStatus)} />

    {/* Controls */}
    <div className="space-y-2 mt-3">
      {session.gazeStatus === 'idle' && (
        <>
          <Button onClick={enableGaze} className="w-full">
            Enable Gaze Tracking
          </Button>
          <Button onClick={startCalibration} variant="secondary" className="w-full">
            Calibrate Now
          </Button>
        </>
      )}

      {['tracking', 'paused'].includes(session.gazeStatus) && (
        <>
          {session.gazeStatus === 'tracking' && (
            <Button onClick={pauseTracking} variant="secondary" className="w-full">
              Pause
            </Button>
          )}
          {session.gazeStatus === 'paused' && (
            <Button onClick={resumeTracking} className="w-full">
              Resume
            </Button>
          )}
          <Button onClick={disableGaze} variant="outline" className="w-full">
            Disable Gaze
          </Button>
          <Button onClick={startCalibration} variant="secondary" className="w-full">
            Recalibrate
          </Button>
        </>
      )}

      {session.gazeStatus === 'calibrating' && (
        <p className="text-sm text-slate-500">Calibration in progress…</p>
      )}

      {session.gazeStatus === 'error' && (
        <Alert type="error" title="Gaze Error" message={session.error} />
      )}
    </div>

    {/* Camera View Toggle */}
    {['tracking', 'paused'].includes(session.gazeStatus) && (
      <label className="flex items-center gap-2 mt-3 cursor-pointer">
        <input
          type="checkbox"
          checked={showCamera}
          onChange={(e) => setShowCamera(e.target.checked)}
        />
        <span className="text-sm">Show Camera View</span>
      </label>
    )}

    {/* Camera Feed */}
    {showCamera && <WebcamFeed />}

    {/* Info */}
    {session.calibrationAccuracy && (
      <p className="text-xs text-slate-500 mt-3">
        Accuracy: ±{session.calibrationAccuracy}px
      </p>
    )}
  </div>
</div>
);
};

text

---

### 6. Extensive Testing & Validation

**Critical:** Gaze tracking + web builder must work seamlessly in real-time.

#### Test Matrix

| Feature | Desktop | Tablet | Mobile | Status |
|---------|---------|--------|--------|--------|
| **Prompt Input** | ✅ | ✅ | ✅ | |
| **Gemini Generation** | ✅ | ✅ | ✅ | |
| **Live Preview** | ✅ | ✅ | ✅ | |
| **Gaze Calibration** | ✅ | N/A | N/A | (webcam needed) |
| **Gaze Cursor** | ✅ | N/A | N/A | |
| **Component Detection** | ✅ | ✅ | ✅ | |
| **Gaze Lock** | ✅ | N/A | N/A | |
| **Component Edit** | ✅ | ✅ | ✅ | |
| **Live Update** | ✅ | ✅ | ✅ | |
| **Export ZIP** | ✅ | ✅ | ✅ | |

#### Manual Testing Checklist

**Prompt Input & Generation:**
- [ ] Text prompt input works and accepts long text (2000+ chars).
- [ ] File upload works (drag-and-drop, click to select).
- [ ] Generation status progresses through phases (parsing → structure → components → complete).
- [ ] Generated components are rendered in preview.
- [ ] Error handling displays user-friendly messages.

**Gaze Tracking Integration:**
- [ ] Gaze cursor appears in preview when tracking enabled.
- [ ] Cursor position matches actual gaze point (±80px acceptable).
- [ ] Pause/resume works (cursor disappears/reappears).
- [ ] Recalibration flow is smooth.
- [ ] Camera view shows live webcam feed.
- [ ] All gaze controls match dashboard feature parity.

**Component Editing:**
- [ ] Gaze lock activates after ~500ms of continuous gaze on a component.
- [ ] Locked component is visually highlighted (outline + color).
- [ ] Edit prompt panel appears for locked component.
- [ ] Edit prompts are correctly parsed by Gemini.
- [ ] Component code is modified correctly.
- [ ] Live update reflects changes in preview immediately.
- [ ] Multiple rapid edits don't break the system.

**Export:**
- [ ] ZIP file downloads without errors.
- [ ] ZIP structure is correct (folders, files).
- [ ] Generated code is valid React + TypeScript.
- [ ] Package.json has all required dependencies.
- [ ] README.md is comprehensive and helpful.
- [ ] Extracted project can be imported into an IDE and run locally.

**Performance:**
- [ ] Gaze tracking latency <60ms (camera to cursor).
- [ ] Component detection <100ms.
- [ ] Gemini API calls complete in <10 seconds (typical).
- [ ] No memory leaks (test with DevTools).
- [ ] Preview remains smooth even with large websites.

**Stability:**
- [ ] No console errors during normal usage.
- [ ] No unexpected state resets.
- [ ] Session persists across page reloads.
- [ ] Error recovery is graceful.

#### Automated Testing (Optional, Advanced)

// tests/webBuilder.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebsiteGeneration } from '@/hooks/useWebsiteGeneration';
import { detectComponents, getComponentAtGazePoint } from '@/utils/componentDetection';

describe('Web Builder', () => {
describe('Website Generation', () => {
it('should generate website from prompt', async () => {
const { result } = renderHook(() => useWebsiteGeneration());

text
  act(() => {
    result.current.generateWebsite('Create a landing page for a coffee shop');
  });

  await waitFor(() => {
    expect(result.current.generatedCode).toBeDefined();
    expect(result.current.state.phase).toBe('complete');
  });

  expect(result.current.generatedCode?.components.length).toBeGreaterThan(0);
});

it('should handle generation errors gracefully', async () => {
  const { result } = renderHook(() => useWebsiteGeneration());

  act(() => {
    result.current.generateWebsite(''); // Empty prompt
  });

  await waitFor(() => {
    expect(result.current.state.error).toBeDefined();
  });
});
});

describe('Component Detection', () => {
it('should detect components in DOM', () => {
const div = document.createElement('div');
div.innerHTML = '<button data-component="true">Click me</button>';

text
  const components = detectComponents(div);
  expect(components.length).toBeGreaterThan(0);
});

it('should find component at gaze point', () => {
  const components = [
    {
      id: 'btn-1',
      name: 'Button',
      type: 'button',
      element: document.createElement('button'),
      bbox: new DOMRect(10, 10, 100, 50),
    },
  ];

  const comp = getComponentAtGazePoint(50, 35, components);
  expect(comp?.id).toBe('btn-1');
});
});
});

text

---

## Implementation Guidelines

### File Structure (Complete Web Builder)

src/
├── components/
│ ├── WebBuilder/
│ │ ├── WebBuilderLayout.tsx # Main layout
│ │ ├── PromptInput.tsx # Left sidebar prompt input
│ │ ├── Canvas.tsx # Center preview
│ │ ├── CanvasToolbar.tsx # Canvas controls
│ │ ├── RightPanel.tsx # Right tabbed panel
│ │ │ ├── ComponentInspector.tsx # Tab 1
│ │ │ ├── SuggestionsPanel.tsx # Tab 2
│ │ │ ├── GazeControlPanel.tsx # Tab 3
│ │ │ └── ExportPanel.tsx # Tab 4
│ │ └── StatusBar.tsx # Bottom status bar
│ ├── ComponentEditPanel.tsx # Gaze-locked component editor
│ └── WebcamFeed.tsx # Camera view
├── hooks/
│ ├── useWebsiteGeneration.ts # Gemini generation
│ ├── useComponentGazeLock.ts # Gaze-based locking
│ ├── useComponentLiveUpdate.ts # Live component edits
│ └── useWebBuilderState.ts # Web builder state mgmt
├── services/
│ ├── geminiService.ts # Gemini API (from Agent 3)
│ ├── componentModificationService.ts # Component editing via Gemini
│ └── exportService.ts # ZIP export
├── prompts/
│ ├── systemPrompt.ts # System context for Gemini
│ ├── generateWebsite.ts # Website generation prompt
│ └── modifyComponent.ts # Component modification prompt
├── utils/
│ ├── componentDetection.ts # Component finding
│ ├── gazeUtils.ts # Gaze-related helpers
│ └── codeValidation.ts # TypeScript syntax validation
├── pages/
│ └── WebBuilderPage.tsx # Route entry point
└── tests/
└── webBuilder.test.ts # Automated tests

text

### State Management Pattern

Use React Context + `useReducer` for web builder state:

// contexts/WebBuilderContext.tsx
interface WebBuilderState {
projectId: string;
projectName: string;
prompt: string;
generatedCode: any;
lockedComponent: DetectedComponent | null;
history: Array<{ timestamp: number; action: string; code: any }>;
unsavedChanges: boolean;
}

interface WebBuilderContextType {
state: WebBuilderState;
dispatch: React.Dispatch<WebBuilderAction>;
generateWebsite: (prompt: string) => Promise<void>;
lockComponent: (component: DetectedComponent) => void;
editComponent: (prompt: string) => Promise<void>;
exportAsZip: (options: ExportOptions) => Promise<void>;
undo: () => void;
redo: () => void;
}

export const WebBuilderContext = React.createContext<WebBuilderContextType | null>(null);

export function useWebBuilder() {
const ctx = React.useContext(WebBuilderContext);
if (!ctx) throw new Error('useWebBuilder outside WebBuilderProvider');
return ctx;
}

text

---

## Certainty & Escalation

### High-Confidence Changes

You can proceed with:
- Building the web builder layout and components.
- Integrating Gemini 3 for website generation.
- Implementing component detection and gaze locking.
- Creating the export/ZIP functionality.
- Connecting gaze tracking from `GazeContext`.

### Low-Confidence Scenarios

**Ask before proceeding if:**
- You need to understand how the **preview iframe rendering** works (how to safely inject/render React components in an iframe).
- You need clarity on **live component updates** (should components be re-rendered in-place, or should the entire preview refresh?).
- You need to confirm the **Gemini API rate limits and token budgets** for large websites.
- You need to know if there's an existing **project database schema** in Firebase (for saving projects).
- You need to clarify the **keyboard shortcut** for component locking (current proposal: gaze lock only, no keyboard shortcut to avoid conflicts).

**Escalation questions:**
- "What's the target website size/complexity? (E.g., simple 3-section landing, or complex multi-page app?)"
- "Should users be able to edit generated components post-generation, or is it create-once-and-export?"
- "Is there a max timeout for Gemini generation? (E.g., if >15 seconds, cancel and show error?)"
- "Should projects be auto-saved to Firebase, or only on explicit export?"
- "What's the preferred way to handle live component rendering in iframe? (Shadow DOM, Web Components, React portals?)"

---

## Success Criteria

✅ **Completed when:**
- Web builder UI matches the design system (landing page + dashboard consistency).
- Gemini 3 generates production-ready website code from user prompts.
- Gaze tracking is fully integrated:
  - ✓ Enable/disable gaze.
  - ✓ Calibrate/recalibrate.
  - ✓ Live gaze cursor in preview.
  - ✓ Camera view toggle.
  - ✓ Pause/resume tracking.
- Gaze-based component editing works:
  - ✓ Gaze lock activates after ~500ms on component.
  - ✓ Component is visually highlighted.
  - ✓ Edit prompt panel appears.
  - ✓ Gemini generates modified component code.
  - ✓ Preview updates live (no page refresh).
- Export generates valid, importable ZIP with:
  - ✓ All components, config, styles.
  - ✓ package.json with correct dependencies.
  - ✓ TypeScript and Tailwind config.
  - ✓ README and .gitignore.
- **Extensive testing** confirms:
  - ✓ No console errors.
  - ✓ Gaze latency <60ms.
  - ✓ Component detection <100ms.
  - ✓ No memory leaks.
  - ✓ Graceful error handling.
  - ✓ Multiple edits don't break system.

---

## Next Steps

1. **Agent 2** ensures gaze tracking context is properly exported and available to web builder.
2. **Agent 4** sets up Firebase Hosting for the web builder + project persistence.
3. All agents coordinate on:
   - End-to-end user flow (sign up → web builder → generate → edit via gaze → export → deploy).
   - Gaze tracking stability across all pages (landing, dashboard, web builder).
   - Performance & reliability at scale.

---

**End of Agent 3 Document**