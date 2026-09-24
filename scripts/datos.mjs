// Descarga los catálogos de aeunius/laravel-catalogos-sunat en datos/, desde la
// etiqueta fijada en package.json ("config": {"datos": "v1.0.0"}). Los archivos
// se guardan tal cual, para que el diff al cambiar de etiqueta sea el mismo que
// en el paquete PHP.
//
//     npm run datos

import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'

const REPO = 'Aeunius/laravel-catalogos-sunat'
const RUTA = 'resources/catalogos'
const DESTINO = new URL('../datos/', import.meta.url)

const paquete = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const etiqueta = paquete.config?.datos

if (!etiqueta) {
  throw new Error('Falta "config.datos" en package.json: la etiqueta del paquete PHP.')
}

async function descargar(url, opciones = {}) {
  const respuesta = await fetch(url, opciones)

  if (!respuesta.ok) {
    throw new Error(`${url}: ${respuesta.status} ${respuesta.statusText}`)
  }

  return respuesta
}

const cabeceras = { Accept: 'application/vnd.github+json' }
if (process.env.GITHUB_TOKEN) {
  cabeceras.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
}

const listado = await descargar(
  `https://api.github.com/repos/${REPO}/contents/${RUTA}?ref=${etiqueta}`,
  { headers: cabeceras },
).then((r) => r.json())

const archivos = listado
  .filter((entrada) => entrada.type === 'file' && entrada.name.endsWith('.json'))
  .map((entrada) => entrada.name)
  .sort()

if (archivos.length === 0) {
  throw new Error(`No hay catálogos en ${REPO}/${RUTA} en ${etiqueta}.`)
}

await mkdir(DESTINO, { recursive: true })

for (const archivo of archivos) {
  const url = `https://raw.githubusercontent.com/${REPO}/${etiqueta}/${RUTA}/${archivo}`
  const contenido = await descargar(url).then((r) => r.text())

  JSON.parse(contenido) // Que no se guarde a medias.
  await writeFile(new URL(archivo, DESTINO), contenido)
}

// Un catálogo que ya no está en la etiqueta se borra: que el diff lo muestre.
for (const archivo of await readdir(DESTINO)) {
  if (archivo.endsWith('.json') && !archivos.includes(archivo)) {
    await rm(new URL(archivo, DESTINO))
    console.log(`Borrado ${archivo}`)
  }
}

console.log(`${archivos.length} catálogos de ${REPO}@${etiqueta} en datos/`)
