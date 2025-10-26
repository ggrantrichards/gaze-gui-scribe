type Spec = { kind: string; props: Record<string, any> }

type GeminiModel = { generateContent: (args: any) => Promise<{ response: { text(): string } }> }
let geminiModel: GeminiModel | null = null

async function getModel(): Promise<GeminiModel | null> {
  try {
    const key = import.meta.env.VITE_GEMINI_API_KEY
    if (!key) return null
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(key)
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }) as unknown as GeminiModel
    return geminiModel
  } catch {
    return null
  }
}

function heuristicInfer(promptRaw: string): Spec {
  const p = promptRaw.toLowerCase()
  const textInQuotes = (() => {
    const m = promptRaw.match(/["“”'`](.+?)["“”'`]/)
    return m ? m[1] : undefined
  })()

  if (/\blogin\b|\bsign ?in\b|\bform\b/.test(p)) return { kind: 'form', props: { title: 'Sign in' } }
  if (/\bhero\b|\blanding\b|\bcta\b/.test(p)) return { kind: 'hero', props: {} }
  if (/\b(nav|navbar|top bar|menu)\b/.test(p)) return { kind: 'navbar', props: {} }
  if (/\bfooter\b/.test(p)) return { kind: 'footer', props: {} }
  if (/\btable\b|\bgrid\b/.test(p)) return { kind: 'table', props: {} }
  if (/\bcard\b/.test(p))
    return { kind: 'card', props: { title: textInQuotes || 'Card', body: 'Lorem ipsum' } }
  if (/\bimage\b|\bimg\b|\bphoto\b/.test(p))
    return { kind: 'image', props: { src: 'https://picsum.photos/320/180' } }
  if (/\bbadge\b|\bpill\b/.test(p))
    return { kind: 'badge', props: { text: textInQuotes || 'Badge' } }
  if (/\bavatar\b|\bprofile pic\b/.test(p)) return { kind: 'avatar', props: {} }
  if (/\bmodal\b|\bdialog\b/.test(p))
    return { kind: 'modal', props: { title: textInQuotes || 'Modal', body: 'Body text' } }
  if (/\blist\b|\bitems?\b/.test(p))
    return { kind: 'list', props: { items: ['Item A', 'Item B', 'Item C'] } }
  if (/\binput\b|\bfield\b|\btextbox\b/.test(p))
    return { kind: 'input', props: { placeholder: textInQuotes || 'Type…' } }
  if (/\bbutton\b|\bbtn\b/.test(p))
    return { kind: 'button', props: { text: textInQuotes || 'Button' } }
  if (/\btext\b|\blabel\b|\btitle\b|\bheadline\b/.test(p))
    return { kind: 'text', props: { value: textInQuotes || 'Text' } }

  // fallback guess
  return { kind: 'card', props: { title: textInQuotes || 'Card', body: 'Lorem ipsum' } }
}

export async function inferComponentFromPrompt(prompt: string): Promise<Spec> {
  const model = geminiModel || (await getModel())
  if (!model) return heuristicInfer(prompt)

  try {
    const sys = `Return ONLY minified JSON with keys {"kind": "<component>", "props": {...}}.
Supported kinds: button,input,card,text,image,hero,form,list,badge,avatar,modal,navbar,footer,table.`
    const res = await model.generateContent([
      { role: 'user', parts: [{ text: `${sys}\nPrompt: ${prompt}` }] },
    ])
    const txt = res.response.text().trim()
    const s = txt.indexOf('{'),
      e = txt.lastIndexOf('}')
    if (s >= 0 && e >= s) {
      const parsed = JSON.parse(txt.slice(s, e + 1))
      if (parsed && typeof parsed.kind === 'string') return parsed as Spec
    }
    return heuristicInfer(prompt)
  } catch {
    return heuristicInfer(prompt)
  }
}
