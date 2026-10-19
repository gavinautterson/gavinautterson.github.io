import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const MODELS = [
  'baby_golem_red',
  'stone_golem_blue',
  'fire_imp',
  'stone_golem_green',
  'baby_golem_blue',
  'stone_golem_boss',
  'baby_golem_green',
  'stone_golem_red',
]

const TALLEST = 58
const MODEL_HEIGHT = 2.2
const SCALE = MODEL_HEIGHT / TALLEST
const GAP = 12 * SCALE
const LOOP_SECONDS = 42

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
      const res = await fetch(`${base}fire_imp.gltf`, { method: 'HEAD' })
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
  wrapper.scale.setScalar(SCALE)
  wrapper.userData = {
    id,
    width: size.x * SCALE,
    height: size.y * SCALE,
    depth: size.z * SCALE,
  }
  return wrapper
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
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50)
  const lookTarget = new THREE.Vector3(0, MODEL_HEIGHT * 0.42, 0)

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
      const gltf = await loader.loadAsync(`${base}${id}.gltf`)
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
      shadow.scale.set(template.userData.width * 0.72, template.userData.depth * 1.15, 1)
      shadow.raycast = () => {}

      const spinner = new THREE.Group()
      spinner.add(template.clone(true))
      pivot.add(shadow, spinner)
      pivot.userData.spinner = spinner
      parade.add(pivot)
      pivots.push(pivot)
    })
  }

  let span = 1

  function layout() {
    const width = root.clientWidth || 1
    const height = root.clientHeight || 1
    const visibleH = MODEL_HEIGHT * 1.3
    camera.aspect = width / height
    camera.fov = 26
    const distance = (visibleH / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    camera.position.set(0, MODEL_HEIGHT * 0.46, distance)
    camera.lookAt(lookTarget)
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(width, height, false)

    const visibleW = visibleH * camera.aspect
    const minSpan = templates.reduce((sum, template) => sum + template.userData.width + GAP, 0)
    const gap = GAP + Math.max(0, visibleW * 1.08 - minSpan) / templates.length
    let cursor = 0
    const xs = templates.map((template) => {
      const half = template.userData.width / 2
      cursor += half
      const x = cursor
      cursor += half + gap
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
    const distance = camera.position.distanceTo(lookTarget)
    const visibleH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance
    return (visibleH * camera.aspect) / Math.max(canvas.clientWidth, 1)
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
