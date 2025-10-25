export function median(values: number[]): number {
    if (!values.length) return 0
    const a = values.slice().sort((x, y) => x - y)
    const mid = Math.floor(a.length / 2)
    return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2
  }
  
  export function mean(values: number[]): number {
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
  }
  
  export function rollingStd(values: number[]): number {
    if (values.length < 2) return 0
    const m = mean(values)
    return Math.sqrt(mean(values.map(v => (v - m) ** 2)))
  }
  
  export function pixelError(targetPx: { x: number; y: number }, gazePx: { x: number; y: number }) {
    return Math.hypot(targetPx.x - gazePx.x, targetPx.y - gazePx.y)
  }
  