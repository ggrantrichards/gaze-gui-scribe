# Clientsight

AI-powered UI automation tool that tracks where you're looking and applies natural-language interface changes to the element being viewed.

## Features

✅ **Webcam-Based Gaze Tracking** - Uses WebGazer.js for real-time eye tracking
✅ **5-Point Calibration** - Quick calibration for accurate gaze estimation
✅ **Natural Language Instructions** - Change UI elements with simple commands
✅ **Live Preview** - See changes instantly with full undo support
✅ **Privacy-First** - All processing happens locally in your browser
✅ **Keyboard Shortcuts** - Fast element locking and control

## Quick Start

1. **Grant Permissions**: Allow camera access when prompted
2. **Calibrate**: Click the red dots 5 times each while looking at them
3. **Lock Element**: Look at any element and press `⌘ + ⌥ + G` (Mac) or `Ctrl + Alt + G` (Windows)
4. **Apply Changes**: Type your instruction (e.g., "Make this blue") and press Apply

## Supported Commands

### Color Changes
- "Make this red/blue/green/yellow/purple/orange/pink"
- "Change background to #0894b4"
- "Set color to rgb(255, 100, 50)"

### Size Changes
- "Make font size 20px"
- "Set width to 300px"
- "Change height to 100px"

### Border & Radius
- "Add rounded corners"
- "Set border radius to 8px"
- "Add border 2px"

### Spacing
- "Increase padding by 8"
- "Add padding 16px"

### Text Changes
- "Change text to 'New Label'"
- "Replace text with 'Hello World'"

## Keyboard Shortcuts

- `⌘ + ⌥ + G` - Lock element at gaze point
- `Esc` - Close instruction panel
- Pause/Resume - Toggle gaze tracking
- Undo - Revert last change

## Architecture

```
src/
├── components/
│   ├── Calibration.tsx       # 5-point calibration flow
│   ├── GazeOverlay.tsx        # Visual gaze cursor and element highlight
│   └── InstructionPanel.tsx   # Command input interface
├── hooks/
│   └── useGazeTracker.ts      # WebGazer integration
├── utils/
│   ├── nlpParser.ts           # Natural language → CSS parser
│   └── styleApplier.ts        # Safe CSS application with validation
└── types.ts                    # Zod schemas and TypeScript types
```

## Privacy & Security

- ✅ All camera processing occurs locally in the browser
- ✅ No gaze data or images leave your device
- ✅ Input validation and sanitization on all commands
- ✅ Transactional style updates with full rollback support
- ✅ Allowlisted CSS properties only

## Browser Compatibility

- ✅ Chrome 90+ (Recommended)
- ✅ Safari 15+
- ✅ Firefox 88+
- ✅ Edge 90+

## macOS Privacy Note

When running on macOS, ensure you've granted camera permissions to your browser:
1. System Settings → Privacy & Security → Camera
2. Enable your browser (Chrome/Safari/Firefox)

## Future Electron Integration

This web prototype is designed to be exported to Electron for deeper OS integration:
- System-wide element targeting across all apps
- Native Accessibility API integration
- Enhanced performance with native gaze models
- Persistent settings and calibration profiles

## Performance Targets

- ✅ Camera → gaze point latency: < 60ms
- ✅ Gaze → element lookup: < 30ms
- ✅ Calibration time: < 45s
- ✅ Median accuracy: < 80px

## Troubleshooting

**Gaze tracking is inaccurate**
- Try recalibrating (skip and run calibration again)
- Ensure good lighting on your face
- Position camera at eye level
- Reduce head movement during tracking

**Element won't lock**
- Ensure element is not in an iframe or shadow DOM
- Try zooming in to increase hit target
- Check that gaze tracking is active (not paused)

**Changes don't apply**
- Check browser console for errors
- Ensure element is still in the DOM
- Try simpler commands first

## Development

Built with:
- React 18 + TypeScript
- WebGazer.js (gaze estimation)
- Zod (schema validation)
- TailwindCSS (styling)
- Vite (build tool)

## License

MIT
