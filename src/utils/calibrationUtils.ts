
export type Pt = { x: number; y: number }

export function median(arr: number[]): number {
  if (!arr.length) return 0
  const a = arr.slice().sort((x, y) => x - y)
  const m = Math.floor(a.length / 2)
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2
}

export function mad(points: Pt[]): number {
  if (!points.length) return 0
  const mx = median(points.map(p => p.x))
  const my = median(points.map(p => p.y))
  const ds = points.map(p => Math.hypot(p.x - mx, p.y - my))
  return median(ds)
}

export function mean(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

/** Simple dwell detector (px space). */
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

/* ---------------- Normalization helpers ---------------- */

export type Viewport = { W: number; H: number }
export function toUnit(p: Pt, v: Viewport): Pt {
  return { x: p.x / v.W, y: p.y / v.H }
}
export function toPx(p: Pt, v: Viewport): Pt {
  return { x: p.x * v.W, y: p.y * v.H }
}

/* ---------------- Affine (existing) ---------------- */

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

export function applyAffine(p: Pt, T: { A: [[number, number], [number, number]]; b: [number, number] }): Pt {
  return {
    x: T.A[0][0] * p.x + T.A[0][1] * p.y + T.b[0],
    y: T.A[1][0] * p.x + T.A[1][1] * p.y + T.b[1],
  }
}

/** Convert affine fitted in unit-space to pixel-space coefficients. */
export function affineUnitToPx(Tu: { A: [[number, number], [number, number]]; b: [number, number] }, v: Viewport) {
  const S = { sx: 1 / v.W, sy: 1 / v.H }
  const D = { dx: v.W, dy: v.H }
  // Apx = D * A * S, bpx = D * b
  const Apx: [[number, number], [number, number]] = [
    [ D.dx * Tu.A[0][0] * S.sx, D.dx * Tu.A[0][1] * S.sy ],
    [ D.dy * Tu.A[1][0] * S.sx, D.dy * Tu.A[1][1] * S.sy ],
  ]
  const bpx: [number, number] = [ D.dx * Tu.b[0], D.dy * Tu.b[1] ]
  return { A: Apx, b: bpx }
}

/* ---------------- Quadratic (existing + conversion) ---------------- */

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
  return { ax, ay } // unit-space coefficients
}

export function applyQuadratic(p: Pt, Q: { ax: number[]; ay: number[] }): Pt {
  const v = [1, p.x, p.y, p.x * p.x, p.x * p.y, p.y * p.y]
  const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0)
  return { x: dot(Q.ax, v), y: dot(Q.ay, v) }
}

/** Convert unit-space quadratic to pixel-space basis [1, x, y, x^2, xy, y^2]. */
export function quadUnitToPx(Q: { ax: number[]; ay: number[] }, v: Viewport) {
  const [a0,a1,a2,a3,a4,a5] = Q.ax
  const [b0,b1,b2,b3,b4,b5] = Q.ay
  const W = v.W, H = v.H
  const ax_px = [
    W*a0,
    a1,
    (W/H)*a2,
    a3 / W,
    a4 / H,
    W * a5 / (H*H)
  ]
  const ay_px = [
    H*b0,
    (H/W)*b1,
    b2,
    H * b3 / (W*W),
    b4 / W,
    b5 / H
  ]
  return { ax: ax_px, ay: ay_px }
}

/* ---------------- RANSAC wrapper (existing) ---------------- */

export function ransacAffine(
  raw: Pt[],
  tgt: Pt[],
  w?: number[],
  threshold = 0.02, // unit-space threshold (≈ 2% of screen)
  maxIter = 120
) {
  const n = Math.min(raw.length, tgt.length)
  if (n < 6) return { inliers: new Array(n).fill(true), T: fitAffineWeighted(raw, tgt, w) }

  let bestInliers: boolean[] = new Array(n).fill(false)
  let bestCount = 0

  for (let it = 0; it < maxIter; it++) {
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
      if (e <= threshold) { inl[i] = true; count++ }
    }
    if (count > bestCount) { bestCount = count; bestInliers = inl }
    if (bestCount > 0.9 * n) break
  }

  const rInl: Pt[] = [], tInl: Pt[] = [], wInl: number[] = []
  for (let i = 0; i < n; i++) if (bestInliers[i]) {
    rInl.push(raw[i]); tInl.push(tgt[i]); wInl.push(w ? w[i] : 1)
  }
  const Tfinal = fitAffineWeighted(rInl.length ? rInl : raw, tInl.length ? tInl : tgt, rInl.length ? wInl : w)
  return { inliers: bestInliers, T: Tfinal }
}

/* ---------------- RBF fallback (unit-space) ---------------- */

export type RBFModel = {
  centers: Pt[]
  wx: number[]; wy: number[]
  ax: [number, number, number]; ay: [number, number, number] // affine tail: c0 + c1 x + c2 y
  sigma: number
}

/** Fit simple Gaussian RBF: f(p) = sum_i w_i exp(-||p-c_i||^2 / (2σ^2)) + a0 + a1 x + a2 y */
export function fitRBFWeightedNormalized(raw: Pt[], tgt: Pt[], w?: number[], sigma = 0.12): RBFModel | null {
  const n = Math.min(raw.length, tgt.length)
  if (n < 6) return null
  const W = (w && w.length === n) ? w : new Array(n).fill(1)
  const Phi = new Array(n).fill(0).map(() => new Array(n + 3).fill(0)) // n RBFs + 3 affine
  for (let i = 0; i < n; i++) {
    const wi = Math.max(1e-6, W[i])
    for (let j = 0; j < n; j++) {
      const r = Math.hypot(raw[i].x - raw[j].x, raw[i].y - raw[j].y)
      Phi[i][j] = wi * Math.exp(- (r*r) / (2 * sigma * sigma))
    }
    // affine tail
    Phi[i][n + 0] = wi * 1
    Phi[i][n + 1] = wi * raw[i].x
    Phi[i][n + 2] = wi * raw[i].y
  }
  const Phit = transpose(Phi)
  const G = mul(Phit, Phi)
  const invG = inv(G)
  if (!invG) return null
  const X = mulVec(Phit, tgt.map((t,i)=> (W[i]||1)*t.x))
  const Y = mulVec(Phit, tgt.map((t,i)=> (W[i]||1)*t.y))
  const solX = mulVec(invG, X)
  const solY = mulVec(invG, Y)
  return {
    centers: raw.slice(),
    wx: solX.slice(0, n),
    wy: solY.slice(0, n),
    ax: [solX[n+0], solX[n+1], solX[n+2]] as [number,number,number],
    ay: [solY[n+0], solY[n+1], solY[n+2]] as [number,number,number],
    sigma
  }
}

export function applyRBF(p: Pt, M: RBFModel): Pt {
  const k = (c: Pt) => Math.exp(- ( (p.x-c.x)*(p.x-c.x) + (p.y-c.y)*(p.y-c.y) ) / (2 * M.sigma * M.sigma))
  let fx = M.ax[0] + M.ax[1]*p.x + M.ax[2]*p.y
  let fy = M.ay[0] + M.ay[1]*p.x + M.ay[2]*p.y
  for (let i = 0; i < M.centers.length; i++) {
    const K = k(M.centers[i])
    fx += M.wx[i] * K
    fy += M.wy[i] * K
  }
  return { x: fx, y: fy }
}

/* ---------------- Transform composition ---------------- */

export type Affine = { A: [[number,number],[number,number]], b: [number,number] }
export type Quad = { ax: number[]; ay: number[] }

export type TransformChain = {
  affine?: Affine
  quad?: Quad
  rbf?: { model: RBFModel, viewport: Viewport } // RBF fitted in unit-space, applied by normalizing
  viewport: Viewport
}

export function applyChainPixel(p_px: Pt, T: TransformChain): Pt {
  const v = T.viewport
  let p: Pt = { ...p_px }
  if (T.affine) p = applyAffine(p, T.affine)
  if (T.quad)   p = applyQuadratic(p, T.quad)
  if (T.rbf)    p = toPx(applyRBF(toUnit(p, v), T.rbf.model), v)
  return {
    x: clamp(p.x, 0, v.W),
    y: clamp(p.y, 0, v.H)
  }
}

/* ---------------- linalg helpers (existing) ---------------- */

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
