export type Pt = { x: number; y: number }

export function median(arr: number[]): number {
  if (!arr.length) return 0
  const a = arr.slice().sort((x, y) => x - y)
  const m = Math.floor(a.length / 2)
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2
}

export function mean(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

/**
 * Simple dwell detector:
 * returns true if last K points are within 'radius' of their centroid.
 */
export function isDwelled(points: Pt[], k = 15, radius = 24): boolean {
  if (points.length < k) return false
  const tail = points.slice(-k)
  const cx = mean(tail.map(p => p.x))
  const cy = mean(tail.map(p => p.y))
  for (const p of tail) {
    if (Math.hypot(p.x - cx, p.y - cy) > radius) return false
  }
  return true
}

/**
 * Weighted affine fit raw → target.
 * x' = a x + b y + tx
 * y' = c x + d y + ty
 */
export function fitAffineWeighted(raw: Pt[], tgt: Pt[], w?: number[]) {
  const n = Math.min(raw.length, tgt.length)
  if (n < 3) return { A: [[1, 0], [0, 1]] as [[number, number], [number, number]], b: [0, 0] as [number, number] }

  const W = (w && w.length === n) ? w : new Array(n).fill(1)
  const M: number[][] = new Array(2 * n).fill(0).map(() => new Array(6).fill(0))
  const Y: number[] = new Array(2 * n).fill(0)

  for (let i = 0; i < n; i++) {
    const r = raw[i], t = tgt[i], wi = Math.max(1e-6, W[i])
    M[2 * i + 0] = [wi * r.x, wi * r.y, wi, 0, 0, 0]
    Y[2 * i + 0] = wi * t.x
    M[2 * i + 1] = [0, 0, 0, wi * r.x, wi * r.y, wi]
    Y[2 * i + 1] = wi * t.y
  }
  const Mt = transpose(M)
  const MtM = mul(Mt, M)
  const MtY = mulVec(Mt, Y)
  const s = solve6(MtM, MtY) // [a,b,tx,c,d,ty]
  const A: [[number, number], [number, number]] = [[s[0], s[1]], [s[3], s[4]]]
  const b: [number, number] = [s[2], s[5]]
  return { A, b }
}

/**
 * Optional mild quadratic warp for stubborn corners.
 * x' = a0 + a1 x + a2 y + a3 x^2 + a4 xy + a5 y^2
 * y' = b0 + b1 x + b2 y + b3 x^2 + b4 xy + b5 y^2
 */
export function fitQuadraticWeighted(raw: Pt[], tgt: Pt[], w?: number[]) {
  const n = Math.min(raw.length, tgt.length)
  if (n < 6) return null
  const W = (w && w.length === n) ? w : new Array(n).fill(1)

  const Phi: number[][] = []
  const X: number[] = []
  const Y: number[] = []
  for (let i = 0; i < n; i++) {
    const wi = Math.max(1e-6, W[i])
    const { x, y } = raw[i]
    const phi = [1, x, y, x * x, x * y, y * y].map(v => wi * v)
    Phi.push(phi)
    X.push(wi * tgt[i].x)
    Y.push(wi * tgt[i].y)
  }
  const Phit = transpose(Phi)
  const A = inv(mul(Phit, Phi))
  if (!A) return null
  const ax = mulVec(A, mulVec(Phit, X))
  const ay = mulVec(A, mulVec(Phit, Y))
  return { ax, ay } // two 6-coef vectors
}

export function applyAffine(p: Pt, T: { A: [[number, number], [number, number]]; b: [number, number] }): Pt {
  return {
    x: T.A[0][0] * p.x + T.A[0][1] * p.y + T.b[0],
    y: T.A[1][0] * p.x + T.A[1][1] * p.y + T.b[1],
  }
}

export function applyQuadratic(p: Pt, Q: { ax: number[]; ay: number[] }): Pt {
  const v = [1, p.x, p.y, p.x * p.x, p.x * p.y, p.y * p.y]
  const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0)
  return { x: dot(Q.ax, v), y: dot(Q.ay, v) }
}

/**
 * RANSAC wrapper: robustly fit affine by rejecting outliers.
 * Returns inliers used and the transform.
 */
export function ransacAffine(
  raw: Pt[],
  tgt: Pt[],
  w?: number[],
  thresholdPx = 60,
  maxIter = 120
) {
  const n = Math.min(raw.length, tgt.length)
  if (n < 6) return { inliers: new Array(n).fill(true), T: fitAffineWeighted(raw, tgt, w) }

  let bestInliers: boolean[] = new Array(n).fill(false)
  let bestCount = 0

  for (let it = 0; it < maxIter; it++) {
    // sample 3 pairs
    const idxs = sampleDistinct(n, 3)
    const r3 = idxs.map(i => raw[i])
    const t3 = idxs.map(i => tgt[i])
    const w3 = idxs.map(i => (w ? w[i] : 1))

    const T = fitAffineWeighted(r3, t3, w3)
    const inl = new Array(n).fill(false)
    let count = 0
    for (let i = 0; i < n; i++) {
      const p = applyAffine(raw[i], T)
      const e = Math.hypot(p.x - tgt[i].x, p.y - tgt[i].y)
      if (e <= thresholdPx) { inl[i] = true; count++ }
    }
    if (count > bestCount) { bestCount = count; bestInliers = inl }
    if (bestCount > 0.9 * n) break
  }

  // refit with inliers
  const rInl: Pt[] = []
  const tInl: Pt[] = []
  const wInl: number[] = []
  for (let i = 0; i < n; i++) if (bestInliers[i]) {
    rInl.push(raw[i]); tInl.push(tgt[i]); wInl.push(w ? w[i] : 1)
  }
  const Tfinal = fitAffineWeighted(rInl.length ? rInl : raw, tInl.length ? tInl : tgt, rInl.length ? wInl : w)
  return { inliers: bestInliers, T: Tfinal }
}

// ——— linalg helpers ———

function transpose(A: number[][]): number[][] {
  return A[0].map((_, j) => A.map(row => row[j]))
}
function mul(A: number[][], B: number[][]): number[][] {
  const r = A.length, c = B[0].length, k = B.length
  const out = Array.from({ length: r }, () => new Array(c).fill(0))
  for (let i = 0; i < r; i++)
    for (let j = 0; j < c; j++) {
      let s = 0
      for (let t = 0; t < k; t++) s += A[i][t] * B[t][j]
      out[i][j] = s
    }
  return out
}
function mulVec(A: number[][], x: number[]): number[] {
  return A.map(row => row.reduce((s, v, i) => s + v * x[i], 0))
}
function inv(A: number[][] | null): number[][] | null {
  if (!A) return null
  const n = A.length
  const M = A.map((row, i) => row.concat(...new Array(n).fill(0).map((_, j) => (i === j ? 1 : 0))))
  // Gauss-Jordan
  for (let i = 0; i < n; i++) {
    let p = i
    for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r
    if (Math.abs(M[p][i]) < 1e-9) return null
    if (p !== i) [M[i], M[p]] = [M[p], M[i]]
    const piv = M[i][i]
    for (let j = 0; j < 2 * n; j++) M[i][j] /= piv
    for (let r = 0; r < n; r++) if (r !== i) {
      const f = M[r][i]
      for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[i][j]
    }
  }
  return M.map(row => row.slice(n))
}
function solve6(A: number[][], b: number[]): number[] {
  const n = 6
  const M = A.map((row, i) => row.concat([b[i]]))
  for (let i = 0; i < n; i++) {
    let p = i
    for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r
    const piv = M[p][i] || 1e-9
    if (p !== i) [M[i], M[p]] = [M[p], M[i]]
    for (let j = i; j <= n; j++) M[i][j] /= piv
    for (let r = 0; r < n; r++) if (r !== i) {
      const f = M[r][i]
      for (let j = i; j <= n; j++) M[r][j] -= f * M[i][j]
    }
  }
  return M.map(row => row[n])
}

function sampleDistinct(n: number, k: number) {
  const a = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, k)
}
