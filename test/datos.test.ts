import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { cargar, disponibles } from '../src/cargar.js'

// Los datos vienen tal cual del paquete PHP (npm run datos). Aquí se revisa
// que estén todos, con la forma esperada, y que los módulos generados los
// reproduzcan sin perder ni reordenar códigos.

const DATOS = new URL('../datos/', import.meta.url)

interface Json {
  catalogo: string
  nombre: string
  fuente: string
  items: Record<string, { descripcion: string }>
}

const archivos = readdirSync(DATOS).filter((a) => a.endsWith('.json'))
const texto = (numero: string): string => readFileSync(new URL(`${numero}.json`, DATOS), 'utf8')

// El paquete PHP escribe un código por línea; así se lee el orden sin JSON.parse.
const ordenDelJson = (numero: string): string[] =>
  [...texto(numero).matchAll(/^ {4}"([^"]+)":/gm)].map((m) => m[1] as string)

test('están los 45 catálogos del paquete PHP', () => {
  const numeros = archivos.map((a) => a.replace(/\.json$/, '')).sort()

  expect(numeros).toHaveLength(45)
  expect(numeros).toEqual(
    [
      ...Array.from({ length: 27 }, (_, i) => String(i + 1).padStart(2, '0')),
      '25-jerarquia',
      ...Array.from({ length: 15 }, (_, i) => String(i + 51)),
      'D-37',
      'codigos-retorno',
    ].sort(),
  )
  // En el orden de los archivos, no con '10'…'65' antes que '01'.
  expect(disponibles).toEqual(numeros)
})

describe.each(archivos.map((a) => a.replace(/\.json$/, '')))('catálogo %s', (numero) => {
  const json: Json = JSON.parse(texto(numero))

  test('tiene número, nombre, fuente y códigos con descripción', () => {
    expect(json.catalogo).toBe(numero)
    expect(json.nombre).toBeTypeOf('string')
    expect(json.nombre).not.toBe('')
    expect(json.fuente).toBeTypeOf('string')
    expect(json.fuente).not.toBe('')
    expect(Object.keys(json.items).length).toBeGreaterThan(0)

    for (const item of Object.values(json.items)) {
      expect(item.descripcion).toBeTypeOf('string')
      expect(item.descripcion).not.toBe('')
    }
  })

  test('el módulo tiene los mismos códigos y datos', async () => {
    const catalogo = await cargar(numero as (typeof disponibles)[number])

    expect(catalogo.numero).toBe(numero)
    expect(catalogo.nombre).toBe(json.nombre)
    expect(catalogo.fuente).toBe(json.fuente)
    expect(catalogo.items).toHaveLength(Object.keys(json.items).length)

    for (const { codigo, ...resto } of catalogo.items) {
      expect(codigo).toBeTypeOf('string')
      expect(resto).toEqual(json.items[codigo])
    }
  })

  test('los códigos van en el orden del JSON', async () => {
    const catalogo = await cargar(numero as (typeof disponibles)[number])

    expect(catalogo.items.map((i) => i.codigo)).toEqual(ordenDelJson(numero))
  })
})

test('no reordena los códigos que parecen números', async () => {
  // Con Object.keys() el 01 empezaría por '11', '12', '13'.
  const tipos = await cargar('01')

  expect(tipos.items.slice(0, 3).map((i) => i.codigo)).toEqual(['01', '03', '04'])
})
