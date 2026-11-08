const LS_KEY = 'project-tuner'
const DEFAULTS = { imgFr: 1.1, ratio: 1.8, titleStroke: 7, emStroke: 5 }

function load() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(LS_KEY) || '{}') } } catch { return { ...DEFAULTS } }
}

function save(state) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)) } catch {}
}

function apply(state) {
  const root = document.documentElement
  root.style.setProperty('--project-img-fr', state.imgFr + 'fr')
  root.style.setProperty('--project-img-ratio', String(state.ratio))
  root.style.setProperty('--hero-title-stroke', String(state.titleStroke))
  root.style.setProperty('--hero-em-stroke', String(state.emStroke))
}

export function mountProjectTuner() {
  if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return

  const state = load()
  apply(state)

  const panel = document.createElement('aside')
  panel.className = 'scale-tool'
  panel.innerHTML = `
    <button class="scale-tool-toggle" type="button" aria-expanded="false">Tune cards</button>
    <div class="scale-tool-panel">
      <label class="scale-tool-row scale-tool-gap">
        <span>Image size</span>
        <input type="range" min="0.5" max="3" step="0.05" value="${state.imgFr}" data-key="imgFr">
        <input type="number" min="0.5" max="3" step="0.05" value="${state.imgFr}" data-key="imgFr">
      </label>
      <label class="scale-tool-row">
        <span>Aspect ratio</span>
        <input type="range" min="0.5" max="2.5" step="0.01" value="${state.ratio}" data-key="ratio">
        <input type="number" min="0.5" max="2.5" step="0.01" value="${state.ratio}" data-key="ratio">
      </label>
      <label class="scale-tool-row scale-tool-gap">
        <span>Title stroke</span>
        <input type="range" min="0" max="8" step="0.5" value="${state.titleStroke}" data-key="titleStroke">
        <input type="number" min="0" max="8" step="0.5" value="${state.titleStroke}" data-key="titleStroke">
      </label>
      <label class="scale-tool-row">
        <span>Em stroke</span>
        <input type="range" min="0" max="8" step="0.5" value="${state.emStroke}" data-key="emStroke">
        <input type="number" min="0" max="8" step="0.5" value="${state.emStroke}" data-key="emStroke">
      </label>
      <div class="scale-tool-actions">
        <button type="button" data-action="copy">Copy CSS</button>
        <button type="button" data-action="reset">Reset</button>
      </div>
    </div>
  `
  document.body.append(panel)

  const toggle = panel.querySelector('.scale-tool-toggle')
  toggle.addEventListener('click', () => {
    const open = panel.classList.toggle('is-open')
    toggle.setAttribute('aria-expanded', String(open))
  })

  panel.addEventListener('input', (e) => {
    const input = e.target
    const key = input.dataset.key
    if (!key) return
    const val = Number(input.value)
    if (!Number.isFinite(val)) return
    state[key] = val
    panel.querySelectorAll(`[data-key="${key}"]`).forEach((el) => { if (el !== input) el.value = String(val) })
    apply(state)
    save(state)
  })

  panel.addEventListener('click', (e) => {
    const action = e.target.dataset.action
    if (action === 'copy') {
      const css = `--project-img-fr: ${state.imgFr}fr;\n--project-img-ratio: ${state.ratio};\n--hero-title-stroke: ${state.titleStroke};\n--hero-em-stroke: ${state.emStroke};`
      navigator.clipboard?.writeText(css).catch(() => {})
      e.target.textContent = 'Copied!'
      setTimeout(() => { e.target.textContent = 'Copy CSS' }, 1500)
    }
    if (action === 'reset') {
      Object.assign(state, DEFAULTS)
      panel.querySelectorAll('[data-key]').forEach((el) => { el.value = String(state[el.dataset.key]) })
      apply(state)
      save(state)
    }
  })
}
