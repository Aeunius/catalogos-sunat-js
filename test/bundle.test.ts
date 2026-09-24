import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { expect, test } from 'vitest'

// Lo que hace el bundler de una app (Vite usa esbuild y Rollup): solo debe
// entrar el catálogo que se importa.

async function empaquetar(codigo: string) {
  const resultado = await build({
    stdin: { contents: codigo, resolveDir: fileURLToPath(new URL('../src/', import.meta.url)) },
    bundle: true,
    format: 'esm',
    minify: true,
    splitting: true,
    outdir: 'dist-prueba',
    write: false,
  })

  return resultado.outputFiles.map((f) => ({ ruta: f.path, texto: f.text }))
}

test('importar un catálogo no arrastra los demás', async () => {
  const [salida, ...otros] = await empaquetar(`
    import { descripcion, opciones } from './index.js'
    import monedas from './catalogos/02.js'
    console.log(descripcion(monedas, 'PEN'), opciones(monedas))
  `)

  expect(otros).toHaveLength(0)
  expect(salida?.texto).toContain('sol peruano')
  expect(salida?.texto).not.toContain('Perros') // 25
  expect(salida?.texto).not.toContain('CHACHAPOYAS') // 13
  expect(salida?.texto.length).toBeLessThan(25_000)
})

test('cargar() deja cada catálogo en un archivo aparte', async () => {
  const [principal, ...trozos] = await empaquetar(`
    import { cargar } from './cargar.js'
    cargar('02').then(console.log)
  `)

  expect(principal?.texto).not.toContain('sol peruano')
  expect(principal?.texto.length).toBeLessThan(10_000)
  expect(trozos.some((t) => t.texto.includes('Perros'))).toBe(true)
})
