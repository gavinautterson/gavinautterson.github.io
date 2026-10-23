import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcRoot = path.join(root, 'Source Material')
const outDir = path.join(root, 'public', 'work')

const assets = [
  ['Hero Image/Image Sequence_083_0001.jpg', 'website-hero'],
  ['Project Headers/Voxie Tactics.jpg', 'project-voxie-tactics'],
  ['Project Headers/Voxie Survivor.jpg', 'project-voxie-survivor'],
  ['Project Headers/library_hero_3840x1240 1.png', 'project-hyperflora'],
  ['Hyperflora/Hyperflora Grass System.png', 'hyperflora-grass'],
  ['Hyperflora/Bugs GRoup.png', 'hyperflora-bugs'],
  ['Hyperflora/Grub.png', 'hyperflora-grub'],
  ['Hyperflora/Enemy Diorama.png', 'hyperflora-enemy-diorama'],
  ['Hyperflora/Minerals/Hyperflora Minerals.png', 'hyperflora-minerals'],
  ['Hyperflora/Minerals/Economy Minerals Ores In Game Scene View.png', 'hyperflora-ores-ingame'],
  ['Hyperflora/Key Art and Steam Page/Hyperflora Key Art All Steam Cuts.png', 'hyperflora-key-art'],
  ['Featured Project/Game shots (2).png', 'hyperflora-shot-garden'],
  ['Featured Project/Game shots (1).png', 'hyperflora-shot-crystals'],
  ['Featured Project/Main banner.png', 'hyperflora-shot-banner'],
  ['Hyperflora/Interior Areas/Whole Hub.jpg', 'hyperflora-hub'],
  ['Hyperflora/Interior Areas/Greenhouse Area Interior.png', 'hyperflora-greenhouse'],
  ['Hyperflora/Interior Areas/Kitchen Area Interior.png', 'hyperflora-kitchen'],
  ['Hyperflora/Interior Areas/PC Desk Area Interior.png', 'hyperflora-pc-desk'],
  ['Hyperflora/Interior Areas/Workshop Area Interior.png', 'hyperflora-workshop'],
  ['Hyperflora/Biomes/Mossy Temple Tileset.png', 'hyperflora-mossy-tileset'],
  ['Hyperflora/Room Prefabs/Mossy Starter Room_Ortho.png', 'hyperflora-room-starter'],
  ['Hyperflora/Room Prefabs/Mossy Combat Room 1_Ortho.png', 'hyperflora-room-combat-1'],
  ['Hyperflora/Room Prefabs/Mossy Combat Room 2_Ortho.png', 'hyperflora-room-combat-2'],
  ['Hyperflora/Room Prefabs/Mossy Courier Room_Ortho.png', 'hyperflora-room-courier'],
  ['Hyperflora/Room Prefabs/Mossy Extraction Room_Ortho.png', 'hyperflora-room-extraction'],
  ['Hyperflora/Plants/Plant Stages Bluebell.png', 'hyperflora-plant-bluebell'],
  ['Hyperflora/Plants/Plant Stages Helix Lily.png', 'hyperflora-plant-helix-lily'],
  ['Hyperflora/Plants/Plant Stages Lantern.png', 'hyperflora-plant-lantern'],
  ['Hyperflora/Plants/Plant Stages Lupinous.png', 'hyperflora-plant-lupinous'],
  ['Voxie Tactics Environment Level Design/Cave Biome Design.png', 'cave-biome'],
  ['Voxie Tactics Environment Level Design/Dragon Biome Design.png', 'dragon-biome'],
  ['Voxie Tactics Environment Level Design/Forest Biome Design (1).png', 'forest-biome'],
  ['Voxie Tactics Environment Level Design/Grass Biome Level.png', 'grass-biome'],
  ['Voxie Tactics Environment Level Design/Library Biome Design.png', 'library-biome'],
  ['Voxie Tactics Environment Level Design/Sand Biome Design.png', 'sand-biome'],
  ['Voxie Tactics Environment Level Design/Snow Biome Design.png', 'snow-biome'],
  ['Voxie Tactics Environment Level Design/Tavern Biome Shot.png', 'tavern-biome'],
  ['Voxie Tactics Character and Creature Art/Dash.png', 'dash'],
  ['Voxie Tactics Character and Creature Art/Druid.png', 'druid'],
  ['Voxie Tactics Character and Creature Art/Grumbler.png', 'grumbler'],
  ['Voxie Tactics Character and Creature Art/Hawknight.png', 'hawknight'],
  ['Voxie Tactics Character and Creature Art/Knight.png', 'knight'],
  ['Voxie Tactics Character and Creature Art/Pawkit.png', 'pawkit'],
  ['Voxie Tactics Character and Creature Art/Cobra.png', 'cobra'],
  ['Voxie Tactics Character and Creature Art/Croco.png', 'croco'],
  ['Voxie Tactics Character and Creature Art/Miniskele.png', 'miniskele'],
  ['Voxie Tactics Character and Creature Art/Red Dino.png', 'red-dino'],
  ['Voxie Tactics Character and Creature Art/Snail and Slug.png', 'snail-and-slug'],
  ['Voxie Tactics Character and Creature Art/Grass Golems In Game.png', 'grass-golems'],
  ['Voxie Tactics Character and Creature Art/Cave Golems In-Game.png', 'cave-golems'],
  ['Voxie Tactics Character and Creature Art/Shroud.png', 'shroud'],
  ['Voxie Tactics Character and Creature Art/PCB Sword And Shield.png', 'pcb-sword-shield'],
  ['Voxie Tactics Character and Creature Art/Tomes.png', 'tomes'],
  ['Voxie Tactics Character and Creature Art/Toxic Weapon Set.png', 'toxic-weapons'],
  ['Voxie Tactics Character and Creature Art/Weapon Sword and Shield.png', 'sword-and-shield'],
  ['Hyperflora/POtatoe.png', 'potatoe'],
  ['Voxie Survior/Custom Fog Shader.jpg', 'survivor-fog-shader'],
  ['Voxie Survior/Boss Fight Design/Bone Dragon Boss (1).jpg', 'survivor-bone-dragon'],
  ['Voxie Survior/Enemy Groups/Big Damge (4).jpg', 'survivor-enemy-group'],
  ['Voxie Survior/Level Design World Generation/Voxie Survivor_ Cave.png', 'survivor-cave'],
  ['Voxie Survior/Level Design World Generation/Voxie Survivor_ Gloomy Meadows.png', 'survivor-gloomy-meadows'],
  ['Voxie Survior/Level Design World Generation/Voxie Survivor_ Sand.png', 'survivor-sand'],
  ['Voxie Survior/POI Examples/Cave Minecart POI Design.jpg', 'survivor-poi-minecart'],
  ['Voxie Survior/POI Examples/Gloomy Graveyard POI.jpg', 'survivor-poi-graveyard'],
  ['Voxie Survior/POI Examples/Gloomy Witch HUT POI.jpg', 'survivor-poi-witch-hut'],
  ['Voxie Survior/POI Examples/Sand Oasis POI.jpg', 'survivor-poi-oasis'],
]

await fs.mkdir(outDir, { recursive: true })

function resized(img, width) {
  return img.clone().rotate().resize({
    width,
    withoutEnlargement: true,
    fit: 'inside',
  })
}

async function writeVariant(img, dest, width, quality) {
  await resized(img, width).webp({ quality, effort: 4 }).toFile(`${dest}.webp`)
  await resized(img, width).jpeg({ quality: Math.max(quality - 2, 72), mozjpeg: true }).toFile(`${dest}.jpg`)
}

for (const [rel, slug] of assets) {
  const input = path.join(srcRoot, rel)
  try {
    await fs.access(input)
  } catch {
    console.warn(`skip ${slug}  (missing ${rel})`)
    continue
  }
  const img = sharp(input, { limitInputPixels: false })
  const dest = path.join(outDir, slug)
  const full = path.join(outDir, `${slug}-full`)
  if (slug === 'website-hero') {
    await writeVariant(img, dest, 1920, 88)
    await writeVariant(img, full, 3840, 90)
  } else {
    await writeVariant(img, dest, 1600, 80)
    await writeVariant(img, full, 2400, 84)
  }
  const { width, height } = await img.metadata()
  console.log(`ok  ${slug}  (${width}x${height})`)
}

const logoPath = path.join(srcRoot, 'Featured Project', 'HyperFlora_gradient_1.svg')
try {
  const svg = await fs.readFile(logoPath, 'utf8')
  const [vbX, vbY, vbW, vbH] = svg.match(/viewBox="([^"]+)"/)[1].split(/[\s,]+/).map(Number)
  const rendered = sharp(Buffer.from(svg)).ensureAlpha()
  const { data, info } = await rendered.raw().toBuffer({ resolveWithObject: true })
  let minX = info.width
  let minY = info.height
  let maxX = 0
  let maxY = 0
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + 3]
      if (alpha < 12) continue
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }
  const padX = (maxX - minX) * 0.02
  const padY = (maxY - minY) * 0.04
  const x = vbX + ((minX - padX) / info.width) * vbW
  const y = vbY + ((minY - padY) / info.height) * vbH
  const w = ((maxX - minX + padX * 2) / info.width) * vbW
  const h = ((maxY - minY + padY * 2) / info.height) * vbH
  const tightened = svg.replace(/viewBox="[^"]+"/, `viewBox="${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}"`)
  await fs.writeFile(path.join(outDir, 'hyperflora-logo.svg'), tightened)
  console.log(`ok  hyperflora-logo.svg  (${Math.round(w)}x${Math.round(h)})`)
} catch (error) {
  console.warn(`skip hyperflora-logo.svg  (${error.message})`)
}

console.log(`\nWrote ${assets.length} pieces to public/work`)
