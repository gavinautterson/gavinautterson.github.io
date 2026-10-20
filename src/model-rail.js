import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const MODELS = [
  'Goblin_Green_Outfit3',
  'Cortex Shield',
  'Cobra',
  'Kitchen',
  'Owl',
  'Zephyr Sword',
  'Thananaut',
  'PC Desk',
  'Mosquito',
  'Potatoe',
  'War Room',
  'Snail',
  'Grub',
  'Tome',
]

const SCALES = {
  Goblin_Green_Outfit3: 0.8,
  'Cortex Shield': 0.8,
  Cobra: 0.55,
  Kitchen: 0.9,
  Owl: 0.55,
  'Zephyr Sword': 0.2,
  Thananaut: 1,
  'PC Desk': 1,
  Mosquito: 0.5,
  Potatoe: 0.6,
  'War Room': 0.95,
  Snail: 0.4,
  Grub: 0.2,
  Tome: 0.4,
}

const MODEL_HEIGHT = 2.2
const LOOP_SECONDS = 60 / 0.7
const DEFAULT_SPACING = 0.89
const TUNE_KEY = 'model-rail-tune'

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function labelFor(id) {
  return id.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function restoreTicker(root) {
  const ticker = document.createElement('div')
  ticker.className = 'ticker'
  ticker.setAttribute('aria-hidden', 'true')
  ticker.innerHTML = `
    <div class="ticker-track">
      <span>Art Direction</span><span><b>Voxel Worlds</b></span><span>Unity 3D</span><span>Style Guides</span><span>Character Art</span><span>Environment Design</span><span>Shaders &amp; VFX</span><span>MagicaVoxel</span><span>Team Leadership</span>
      <span>Art Direction</span><span><b>Voxel Worlds</b></span><span>Unity 3D</span><span>Style Guides</span><span>Character Art</span><span>Environment Design</span><span>Shaders &amp; VFX</span><span>MagicaVoxel</span><span>Team Leadership</span>
    </div>
  `
  root.replaceWith(ticker)
}

async function modelBase() {
  for (const base of ['/models/', '/public/models/']) {
    try {
      const res = await fetch(`${base}Cobra.gltf`, { method: 'HEAD' })
      if (res.ok) return base
    } catch {
      /* try the next root */
    }
  }
  return null
}

function shadowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(64, 64, 10, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function prepareModel(gltf, id) {
  const model = gltf.scene
  model.traverse((obj) => {
    if (!obj.isMesh) return
    obj.castShadow = false
    obj.receiveShadow = false
    obj.frustumCulled = true
  })
  model.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(model)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  model.position.set(-center.x, -box.min.y, -center.z)

  const wrapper = new THREE.Group()
  wrapper.add(model)
  wrapper.userData = {
    id,
    rawWidth: size.x,
    rawHeight: size.y,
    rawDepth: size.z,
  }
  return wrapper
}

function loadTune() {
  try {
    const saved = JSON.parse(localStorage.getItem(TUNE_KEY) || '{}')
    const spacing = Number(saved.spacing)
    const scales = saved.scales && typeof saved.scales === 'object' ? saved.scales : {}
    return {
      spacing: Number.isFinite(spacing) ? Math.min(1, Math.max(0, spacing)) : DEFAULT_SPACING,
      scales,
    }
  } catch {
    return { spacing: DEFAULT_SPACING, scales: {} }
  }
}

function fitModels(templates, scales) {
  templates.forEach((template) => {
    template.userData.baseScale = MODEL_HEIGHT / Math.max(template.userData.rawHeight, 0.001)
    const multiplier = Number(scales[template.userData.id])
    const scale = template.userData.baseScale * (Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1)
    template.scale.setScalar(scale)
    template.userData.width = template.userData.rawWidth * scale
    template.userData.height = template.userData.rawHeight * scale
    template.userData.depth = template.userData.rawDepth * scale
  })
}

function mountTuneTool(templates, scales, spacing, onScale, onSpacing, onReset) {
  const local = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  if (!local) return
  document.querySelector('.scale-tool')?.remove()

  const tool = document.createElement('aside')
  tool.className = 'scale-tool is-open'
  const rows = templates.map((template) => {
    const id = template.userData.id
    const value = scales[id]
    return `
      <label class="scale-tool-row">
        <span>${labelFor(id)}</span>
        <input type="range" min="0.2" max="5" step="0.05" value="${value}" data-id="${id}">
        <input type="number" min="0.2" max="5" step="0.05" value="${value}" data-id="${id}">
      </label>
    `
  }).join('')
  tool.innerHTML = `
    <button class="scale-tool-toggle" type="button" aria-expanded="true">Tune models</button>
    <div class="scale-tool-panel">
      <p>Spacing is how much room is kept for each model’s depth. Scale is the size you already set.</p>
      <label class="scale-tool-row scale-tool-gap">
        <span>Spacing</span>
        <input type="range" min="0" max="1" step="0.01" value="${spacing}" data-gap="1">
        <input type="number" min="0" max="1" step="0.01" value="${spacing}" data-gap="1">
      </label>
      ${rows}
      <div class="scale-tool-actions">
        <button type="button" data-action="copy">Copy values</button>
        <button type="button" data-action="reset">Reset</button>
      </div>
    </div>
  `
  document.body.append(tool)
  const toggle = tool.querySelector('.scale-tool-toggle')
  toggle.addEventListener('click', () => {
    const open = tool.classList.toggle('is-open')
    toggle.setAttribute('aria-expanded', String(open))
  })

  function fieldsFor(id) {
    return [...tool.querySelectorAll('[data-id]')].filter((input) => input.dataset.id === id)
  }

  tool.addEventListener('input', (event) => {
    const input = event.target
    const next = Number(input.value)
    if (!Number.isFinite(next)) return
    if (input.dataset.gap) {
      const gap = Math.min(1, Math.max(0, Number(next.toFixed(2))))
      tool.querySelectorAll('[data-gap]').forEach((other) => {
        if (other !== input) other.value = String(gap)
      })
      onSpacing(gap)
      return
    }
    if (!input.dataset.id) return
    const scale = Math.min(5, Math.max(0.2, Number(next.toFixed(2))))
    fieldsFor(input.dataset.id).forEach((other) => {
      if (other !== input) other.value = String(scale)
    })
    onScale(input.dataset.id, scale)
  })

  tool.querySelector('[data-action="copy"]').addEventListener('click', async () => {
    const gap = Number(tool.querySelector('[data-gap]').value)
    const values = { spacing: gap }
    templates.forEach((template) => {
      const id = template.userData.id
      values[id] = Number(fieldsFor(id).find((item) => item.type === 'number').value)
    })
    await navigator.clipboard.writeText(JSON.stringify(values, null, 2))
    const button = tool.querySelector('[data-action="copy"]')
    button.textContent = 'Copied'
    setTimeout(() => { button.textContent = 'Copy values' }, 1200)
  })

  tool.querySelector('[data-action="reset"]').addEventListener('click', () => {
    tool.querySelectorAll('[data-gap]').forEach((input) => { input.value = String(DEFAULT_SPACING) })
    templates.forEach((template) => {
      const id = template.userData.id
      fieldsFor(id).forEach((input) => { input.value = String(SCALES[id] ?? 1) })
    })
    onReset()
  })
}

export async function mountModelRail(root) {
  const canvas = root.querySelector('canvas')
  const hint = root.querySelector('.model-rail-hint')
  if (!canvas) return

  let renderer
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
  } catch {
    restoreTicker(root)
    return
  }

  const base = await modelBase()
  if (!base) {
    renderer.dispose()
    restoreTicker(root)
    return
  }

  renderer.setClearColor(0x0f0e14, 1)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NoToneMapping

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 80)
  const lookTarget = new THREE.Vector3(0, MODEL_HEIGHT * 0.5, 0)

  scene.add(new THREE.HemisphereLight(0xf7f4ee, 0x241e18, 1.05))
  const key = new THREE.DirectionalLight(0xfff8ef, 1.85)
  key.position.set(3.5, 7.5, 6)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xc5d7ea, 0.55)
  fill.position.set(-5.5, 3.2, 3)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0x7ee8b8, 0.38)
  rim.position.set(-1.5, 4, -5)
  scene.add(rim)

  const parade = new THREE.Group()
  scene.add(parade)

  const loader = new GLTFLoader()
  const loaded = await Promise.all(MODELS.map(async (id) => {
    try {
      const gltf = await loader.loadAsync(`${base}${encodeURIComponent(id)}.gltf`)
      return prepareModel(gltf, id)
    } catch (error) {
      console.warn(`Could not load ${id}.gltf`, error)
      return null
    }
  }))
  const templates = loaded.filter(Boolean)
  if (!templates.length) {
    renderer.dispose()
    restoreTicker(root)
    return
  }

  const tune = loadTune()
  const scales = { ...SCALES, ...tune.scales }
  let spacing = tune.spacing
  fitModels(templates, scales)

  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture(),
    transparent: true,
    depthWrite: false,
  })
  const shadowGeo = new THREE.PlaneGeometry(1, 1)
  const pivots = []

  const spins = new Map()
  templates.forEach((template, index) => {
    spins.set(template.userData.id, {
      yaw: 0,
      pitch: 0,
      vel: 0,
      idle: (index / templates.length) * 0.6,
      speed: 0.18 + (index % 3) * 0.04,
    })
  })

  for (let copy = 0; copy < 2; copy += 1) {
    templates.forEach((template) => {
      const pivot = new THREE.Group()
      pivot.userData.id = template.userData.id
      pivot.userData.copy = copy

      const shadow = new THREE.Mesh(shadowGeo, shadowMat)
      shadow.rotation.x = -Math.PI / 2
      shadow.position.y = 0.015
      const foot = Math.hypot(template.userData.width, template.userData.depth)
      shadow.scale.set(foot * 0.42, foot * 0.26, 1)
      shadow.raycast = () => {}

      const spinner = new THREE.Group()
      const model = template.clone(true)
      spinner.add(model)
      pivot.add(shadow, spinner)
      pivot.userData.spinner = spinner
      pivot.userData.model = model
      pivot.userData.shadow = shadow
      parade.add(pivot)
      pivots.push(pivot)
    })
  }

  let span = 1

  function layout() {
    const width = root.clientWidth || 1
    const height = root.clientHeight || 1
    const mid = MODEL_HEIGHT * 0.5
    const visibleH = MODEL_HEIGHT * 1.05
    const visibleW = visibleH * (width / Math.max(height, 1))
    camera.top = visibleH / 2
    camera.bottom = -visibleH / 2
    camera.left = -visibleW / 2
    camera.right = visibleW / 2
    camera.position.set(0, mid, 14)
    lookTarget.set(0, mid, 0)
    camera.lookAt(lookTarget)
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(width, height, false)

    const pad = MODEL_HEIGHT * 0.05
    const halves = templates.map((template) => {
      const halfWidth = template.userData.width / 2
      const halfSpin = Math.hypot(template.userData.width, template.userData.depth) / 2
      return halfWidth + (halfSpin - halfWidth) * spacing
    })
    let cursor = 0
    const xs = templates.map((_, index) => {
      cursor += halves[index]
      const x = cursor
      cursor += halves[index] + pad
      return x
    })
    span = Math.max(cursor, 0.001)
    const origin = span / 2
    pivots.forEach((pivot, index) => {
      const slot = index % templates.length
      pivot.position.x = xs[slot] - origin + pivot.userData.copy * span
    })
  }

  layout()
  const resize = new ResizeObserver(layout)
  resize.observe(root)

  function persist() {
    const overrides = {}
    templates.forEach((template) => {
      const id = template.userData.id
      if (scales[id] !== SCALES[id]) overrides[id] = scales[id]
    })
    const payload = {}
    if (spacing !== DEFAULT_SPACING) payload.spacing = spacing
    if (Object.keys(overrides).length) payload.scales = overrides
    if (Object.keys(payload).length) localStorage.setItem(TUNE_KEY, JSON.stringify(payload))
    else localStorage.removeItem(TUNE_KEY)
  }

  function applyScale(id) {
    const template = templates.find((item) => item.userData.id === id)
    if (!template) return
    const multiplier = Number(scales[id])
    const scale = template.userData.baseScale * (Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1)
    template.scale.setScalar(scale)
    template.userData.width = template.userData.rawWidth * scale
    template.userData.height = template.userData.rawHeight * scale
    template.userData.depth = template.userData.rawDepth * scale
    const foot = Math.hypot(template.userData.width, template.userData.depth)
    pivots.forEach((pivot) => {
      if (pivot.userData.id !== id) return
      pivot.userData.model.scale.setScalar(scale)
      pivot.userData.shadow.scale.set(foot * 0.42, foot * 0.26, 1)
    })
  }

  mountTuneTool(
    templates,
    scales,
    spacing,
    (id, value) => {
      scales[id] = value
      applyScale(id)
      persist()
      layout()
    },
    (value) => {
      spacing = value
      persist()
      layout()
    },
    () => {
      Object.keys(scales).forEach((id) => { delete scales[id] })
      Object.assign(scales, SCALES)
      spacing = DEFAULT_SPACING
      templates.forEach((template) => applyScale(template.userData.id))
      persist()
      layout()
    },
  )

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const hoverScale = new THREE.Vector3()
  let hoverId = null
  let drag = null
  let scrollX = 0
  let onScreen = true
  let pageVisible = true
  let raf = 0
  const clock = new THREE.Clock()

  function worldPerPixel() {
    return (camera.right - camera.left) / Math.max(canvas.clientWidth, 1)
  }

  function setPointer(event) {
    const rect = canvas.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  function pick(event) {
    setPointer(event)
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(parade.children, true)
    if (!hits.length) return null
    let obj = hits[0].object
    while (obj && obj.userData.id == null) obj = obj.parent
    return obj
  }

  function setHint(id) {
    if (!hint) return
    hint.textContent = id ? labelFor(id) : 'Drag a model to turn it'
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return
    const hit = pick(event)
    drag = {
      type: hit ? 'spin' : 'scrub',
      id: hit?.userData.id ?? null,
      lastX: event.clientX,
      lastY: event.clientY,
    }
    if (hit) {
      const spin = spins.get(hit.userData.id)
      if (spin) spin.vel = 0
    }
    hoverId = hit?.userData.id ?? null
    canvas.setPointerCapture(event.pointerId)
    root.classList.add('is-grabbing')
    setHint(hoverId)
  })

  canvas.addEventListener('pointermove', (event) => {
    if (!drag) {
      const hit = pick(event)
      hoverId = hit?.userData.id ?? null
      setHint(hoverId)
      return
    }
    const dx = event.clientX - drag.lastX
    const dy = event.clientY - drag.lastY
    drag.lastX = event.clientX
    drag.lastY = event.clientY
    if (drag.type === 'scrub') {
      scrollX -= dx * worldPerPixel()
      return
    }
    const spin = spins.get(drag.id)
    if (!spin) return
    spin.yaw += dx * 0.012
    spin.vel = dx * 0.012
    spin.pitch = THREE.MathUtils.clamp(spin.pitch + dy * 0.005, -0.55, 0.4)
  })

  function endDrag() {
    drag = null
    root.classList.remove('is-grabbing')
  }

  canvas.addEventListener('pointerup', endDrag)
  canvas.addEventListener('pointercancel', endDrag)

  function applySpins(dt) {
    const held = drag?.type === 'spin' ? drag.id : null
    spins.forEach((spin, id) => {
      if (!reduceMotion && held !== id) spin.idle += dt * spin.speed
      if (held !== id) {
        spin.yaw += spin.vel
        spin.vel *= Math.exp(-3.4 * dt)
        spin.pitch += (0 - spin.pitch) * Math.min(1, dt * 2.4)
      }
    })
    parade.children.forEach((pivot) => {
      const spin = spins.get(pivot.userData.id)
      const spinner = pivot.userData.spinner
      if (!spin || !spinner) return
      spinner.rotation.y = 0.5 + spin.yaw + spin.idle
      spinner.rotation.x = spin.pitch
      const hovered = hoverId === pivot.userData.id || held === pivot.userData.id
      hoverScale.setScalar(hovered ? 1.045 : 1)
      spinner.scale.lerp(hoverScale, 1 - Math.exp(-8 * dt))
    })
  }

  function tick() {
    raf = requestAnimationFrame(tick)
    if (!onScreen || !pageVisible) return
    const dt = Math.min(clock.getDelta(), 0.05)
    const cruise = reduceMotion ? 0 : span / LOOP_SECONDS
    const speed = drag ? 0 : hoverId ? cruise * 0.22 : cruise
    scrollX = ((scrollX + speed * dt) % span + span) % span
    parade.position.x = -scrollX
    applySpins(dt)
    renderer.render(scene, camera)
  }

  const visibility = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting
    if (onScreen) clock.getDelta()
  })
  visibility.observe(root)

  document.addEventListener('visibilitychange', () => {
    pageVisible = !document.hidden
    if (pageVisible) clock.getDelta()
  })

  root.classList.add('is-ready')
  setHint(null)
  tick()
}
