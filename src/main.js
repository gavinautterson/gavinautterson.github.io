import { works, picture, detectWorkRoot, WORK } from './work-data.js'

const page = document.body.dataset.page || 'home'

const nav = document.querySelector('.nav')
const toggle = document.querySelector('.nav-toggle')

window.addEventListener('scroll', () => {
  nav?.classList.toggle('is-scrolled', window.scrollY > 20)
}, { passive: true })

toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open')
  toggle.setAttribute('aria-expanded', String(open))
})

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => nav.classList.remove('is-open'))
})

function tileFrame(item) {
  if (item.size === 'wide') return ' is-wide'
  if (item.size === 'square' || item.project === 'hyperflora') return ' is-square'
  return ''
}

function mountGallery(selector, list) {
  const root = document.querySelector(selector)
  if (!root) return []
  root.innerHTML = list.map((item, i) => `
    <button class="tile${tileFrame(item)}" type="button" data-index="${i}" data-project="${item.project}" data-kind="${item.kind}" aria-label="Open ${item.title}">
      ${picture(item.id, { eager: i < 9, alt: item.title })}
      <div class="tile-meta">
        <h3>${item.title}</h3>
        <span>${item.projectLabel}</span>
      </div>
    </button>
  `).join('')
  return list
}

function mountBento(selector, list) {
  const root = document.querySelector(selector)
  if (!root) return []
  root.innerHTML = list.map((item, i) => `
    <button class="tile" type="button" data-index="${i}" aria-label="Open ${item.title}">
      ${picture(item.id, { eager: i < 6, alt: item.title })}
      <div class="tile-meta">
        <h3>${item.title}</h3>
        <span>${item.projectLabel}</span>
      </div>
    </button>
  `).join('')
  return list
}

const lightbox = document.createElement('div')
lightbox.className = 'lightbox'
lightbox.innerHTML = `
  <button class="lb-btn lb-close" type="button" aria-label="Close">×</button>
  <button class="lb-btn lb-prev" type="button" aria-label="Previous">‹</button>
  <figure class="lightbox-stage">
    <img alt="">
    <figcaption></figcaption>
  </figure>
  <button class="lb-btn lb-next" type="button" aria-label="Next">›</button>
`
document.body.append(lightbox)

const lbImg = lightbox.querySelector('img')
const lbCap = lightbox.querySelector('figcaption')
let activeList = []
let activeIndex = 0

function show(i) {
  const item = activeList[i]
  if (!item) return
  activeIndex = i
  lbImg.src = `${WORK}/${item.id}-full.webp`
  lbImg.onerror = () => { lbImg.src = `${WORK}/${item.id}-full.jpg` }
  lbImg.alt = item.title
  lbCap.innerHTML = `<strong>${item.title}</strong>${item.caption} · ${item.projectLabel}`
}

function openLightbox(list, index) {
  activeList = list
  show(index)
  lightbox.classList.add('is-open')
  document.body.classList.add('lb-lock')
}

function closeLightbox() {
  lightbox.classList.remove('is-open')
  document.body.classList.remove('lb-lock')
}

lightbox.querySelector('.lb-close').addEventListener('click', closeLightbox)
lightbox.querySelector('.lb-prev').addEventListener('click', () => {
  show((activeIndex - 1 + activeList.length) % activeList.length)
})
lightbox.querySelector('.lb-next').addEventListener('click', () => {
  show((activeIndex + 1) % activeList.length)
})
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox()
})
window.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('is-open')) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowLeft') show((activeIndex - 1 + activeList.length) % activeList.length)
  if (e.key === 'ArrowRight') show((activeIndex + 1) % activeList.length)
})

function bindTiles(container, list) {
  container?.addEventListener('click', (e) => {
    const tile = e.target.closest('[data-index]')
    if (!tile) return
    const visible = [...container.querySelectorAll('[data-index]:not(.is-hidden)')]
    const visList = visible.map((el) => list[Number(el.dataset.index)])
    const clicked = list[Number(tile.dataset.index)]
    openLightbox(visList, visList.indexOf(clicked))
  })
}

await detectWorkRoot()

if (WORK === '/public/work') {
  const toPublic = (value) =>
    value.replaceAll('/public/work/', '/work/').replaceAll('/work/', '/public/work/')
  document.querySelectorAll('source[srcset], img[src], link[href], meta[content]').forEach((el) => {
    for (const attr of ['srcset', 'src', 'href', 'content']) {
      const value = el.getAttribute(attr)
      if (value?.includes('/work/')) el.setAttribute(attr, toPublic(value))
    }
  })
  document.querySelectorAll('link[rel="icon"]').forEach((el) => {
    if (el.getAttribute('href') === '/favicon.svg') el.setAttribute('href', '/public/favicon.svg')
  })
}

if (page === 'home') {
  const featuredOrder = [
    'hyperflora-grass',
    'hyperflora-minerals',
    'hyperflora-room-starter',
    'hyperflora-grub',
    'forest-biome',
    'grass-biome',
    'cave-biome',
    'tavern-biome',
    'library-biome',
    'sand-biome',
    'grumbler',
    'toxic-weapons',
    'survivor-poi-minecart',
    'survivor-poi-oasis',
    'survivor-bone-dragon',
  ]
  const featured = featuredOrder.map((id) => works.find((w) => w.id === id)).filter(Boolean)
  const bento = document.querySelector('#featured')
  mountBento('#featured', featured)
  bindTiles(bento, featured)

  const galleryList = works
  const gallery = document.querySelector('#gallery')
  mountGallery('#gallery', galleryList)
  bindTiles(gallery, galleryList)

  document.querySelectorAll('.filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter').forEach((b) => b.classList.remove('is-on'))
      btn.classList.add('is-on')
      const key = btn.dataset.filter
      gallery.querySelectorAll('.tile').forEach((tile) => {
        const match = key === 'all' || tile.dataset.project === key || tile.dataset.kind === key
        tile.classList.toggle('is-hidden', !match)
      })
    })
  })
}

if (page === 'voxie' || page === 'hyperflora' || page === 'survivor') {
  const list = works.filter((w) => w.project === page)
  const gallery = document.querySelector('#gallery')
  mountGallery('#gallery', list)
  bindTiles(gallery, list)
}
