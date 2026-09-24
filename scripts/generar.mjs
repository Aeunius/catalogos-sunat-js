// Genera desde datos/ los módulos de src/ que no se editan a mano:
//
// - src/catalogos/<n>.ts: un módulo por catálogo, con los códigos en una lista
//   en el orden del JSON.
// - src/codigos.ts: las uniones de códigos (CodigoMoneda = 'AED' | …).
// - src/cargar.ts: cargar('02') con import() dinámico.
//
//     npm run generar   (lo corren solos test, typecheck y build)

import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'

const DATOS = new URL('../datos/', import.meta.url)
const SRC = new URL('../src/', import.meta.url)

/**
 * Nombre de los tipos de cada catálogo y sus propiedades adicionales, las de
 * FUENTES.md del paquete PHP. Si los datos traen un catálogo o una propiedad
 * que no está aquí, el generador se detiene: hay que tiparlo en src/tipos.ts.
 *
 * `union: false` en los catálogos grandes: su código queda como string.
 */
const CATALOGOS = {
  '01': { tipo: 'TipoDocumento' },
  '02': { tipo: 'Moneda', propiedades: ['numerico', 'decimales', 'simbolo'] },
  '03': { tipo: 'UnidadMedida', propiedades: ['nombre_en', 'estado', 'simbolo'], union: false },
  '04': { tipo: 'Pais', propiedades: ['alpha3', 'numerico'] },
  '05': { tipo: 'Tributo', propiedades: ['codigo_internacional', 'nombre'] },
  '06': { tipo: 'TipoDocumentoIdentidad' },
  '07': { tipo: 'TipoAfectacionIgv', propiedades: ['tributos'] },
  '08': { tipo: 'SistemaIsc' },
  '09': { tipo: 'TipoNotaCredito' },
  10: { tipo: 'TipoNotaDebito' },
  11: { tipo: 'TipoValorVenta' },
  12: { tipo: 'DocumentoRelacionadoTributario' },
  13: { tipo: 'Ubigeo', propiedades: ['provincia', 'departamento', 'capital'], union: false },
  14: { tipo: 'OtroConceptoTributario' },
  15: { tipo: 'ElementoAdicional' },
  16: { tipo: 'TipoPrecio' },
  17: { tipo: 'TipoOperacionAnterior' },
  18: { tipo: 'ModalidadTransporte' },
  19: { tipo: 'EstadoItem' },
  20: { tipo: 'MotivoTraslado' },
  21: { tipo: 'DocumentoRelacionadoGuia' },
  22: { tipo: 'RegimenPercepcion', propiedades: ['porcentaje'] },
  23: { tipo: 'RegimenRetencion', propiedades: ['porcentaje'] },
  24: { tipo: 'TarifaServicioPublico', propiedades: ['servicio'] },
  25: { tipo: 'Producto', union: false },
  '25-jerarquia': { tipo: 'JerarquiaProducto', union: false },
  26: { tipo: 'TipoPrestamo' },
  27: { tipo: 'IndicadorPrimeraVivienda' },
  51: { tipo: 'TipoOperacion', propiedades: ['comprobantes'] },
  52: { tipo: 'Leyenda' },
  53: { tipo: 'CargoDescuento', propiedades: ['nivel'] },
  54: { tipo: 'Detraccion' },
  55: { tipo: 'ConceptoTributario' },
  56: { tipo: 'TipoServicioPublico' },
  57: { tipo: 'TipoServicioTelecomunicaciones' },
  58: { tipo: 'TipoMedidor' },
  59: { tipo: 'MedioPago' },
  60: { tipo: 'TipoDireccion' },
  61: { tipo: 'DocumentoTransporte', propiedades: ['gre'] },
  62: { tipo: 'BienNormalizado', propiedades: ['codigo_producto'] },
  63: { tipo: 'Puerto', propiedades: ['ubigeo'] },
  64: { tipo: 'Aeropuerto', propiedades: ['ubigeo'] },
  65: { tipo: 'UnidadMedidaGre' },
  'D-37': { tipo: 'EntidadAutorizacion', propiedades: ['abreviatura'] },
  'codigos-retorno': { tipo: 'Retorno', propiedades: ['tipo'], union: false },
}

const AVISO = '// Generado por scripts/generar.mjs desde datos/: no editar.'

/**
 * Las claves de "items" en el orden del texto. JSON.parse pone primero las
 * claves que parecen índices ("0", "6", "62") y en orden numérico, así que el
 * orden se lee del texto.
 */
function clavesDeItems(texto) {
  const claves = []
  let profundidad = 0
  let siguenItems = false
  let enItems = false

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]

    if (c === '"') {
      let fin = i + 1
      while (texto[fin] !== '"') fin += texto[fin] === '\\' ? 2 : 1

      const cadena = JSON.parse(texto.slice(i, fin + 1))
      i = fin

      let k = fin + 1
      while (/\s/.test(texto[k])) k++

      if (texto[k] === ':') {
        if (enItems && profundidad === 2) claves.push(cadena)
        if (profundidad === 1 && cadena === 'items') siguenItems = true
      }
    } else if (c === '{' || c === '[') {
      profundidad++
      if (siguenItems && profundidad === 2) {
        enItems = true
        siguenItems = false
      }
    } else if (c === '}' || c === ']') {
      profundidad--
      if (profundidad === 1) enItems = false
    }
  }

  return claves
}

function leerCatalogo(archivo, texto) {
  const datos = JSON.parse(texto)
  const numero = archivo.replace(/\.json$/, '')
  const definicion = CATALOGOS[numero]

  if (!definicion) {
    throw new Error(`${archivo}: catálogo sin tipo en CATALOGOS de scripts/generar.mjs.`)
  }
  if (datos.catalogo !== numero) {
    throw new Error(`${archivo}: dice ser el catálogo "${datos.catalogo}".`)
  }

  const claves = clavesDeItems(texto)
  const esperadas = Object.keys(datos.items)

  if (claves.length !== esperadas.length || new Set(claves).size !== claves.length) {
    throw new Error(`${archivo}: no se pudo leer el orden de los códigos (¿códigos repetidos?).`)
  }

  const permitidas = new Set(['descripcion', ...(definicion.propiedades ?? [])])
  const items = claves.map((codigo) => {
    const item = datos.items[codigo]

    for (const propiedad of Object.keys(item)) {
      if (!permitidas.has(propiedad)) {
        throw new Error(`${archivo}: el código ${codigo} trae "${propiedad}", que no está tipada.`)
      }
    }
    if (typeof item.descripcion !== 'string') {
      throw new Error(`${archivo}: el código ${codigo} no tiene descripción.`)
    }

    return { codigo, ...item }
  })

  return {
    numero,
    ...definicion,
    catalogo: { numero, nombre: datos.nombre, fuente: datos.fuente, items },
  }
}

function literal(valor) {
  return `'${String(valor).replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
}

function moduloCatalogo({ numero, tipo, catalogo }) {
  // JSON.parse de un texto: el motor lo lee más rápido que un literal de
  // objeto, y tsc no tiene que revisar 49.022 objetos del catálogo 25.
  return `${AVISO}

import type { Catalogo, Item${tipo} } from '../tipos.js'

/** ${numero} · ${catalogo.nombre} (${catalogo.items.length} códigos) */
const catalogo: Catalogo<Item${tipo}> = JSON.parse(${JSON.stringify(JSON.stringify(catalogo))})

export default catalogo
`
}

function moduloCodigos(catalogos) {
  const uniones = catalogos
    .filter((c) => c.union !== false)
    .map(
      ({ numero, tipo, catalogo }) =>
        `/** ${numero} · ${catalogo.nombre} */\nexport type Codigo${tipo} =\n${catalogo.items
          .map((item) => `  | ${literal(item.codigo)}`)
          .join('\n')}\n`,
    )

  return `${AVISO}\n\n${uniones.join('\n')}`
}

function moduloCargar(catalogos) {
  const tipos = catalogos.map((c) => `Item${c.tipo}`).join(',\n  ')
  const mapa = catalogos.map((c) => `  ${literal(c.numero)}: Catalogo<Item${c.tipo}>`).join('\n')
  const modulos = catalogos
    .map((c) => `  ${literal(c.numero)}: () => import('./catalogos/${c.numero}.js'),`)
    .join('\n')

  return `${AVISO}

import type {
  Catalogo,
  ${tipos},
} from './tipos.js'

/** Cada número de catálogo con su tipo. */
export interface Catalogos {
${mapa}
}

export type NumeroCatalogo = keyof Catalogos

const modulos: { [N in NumeroCatalogo]: () => Promise<{ default: Catalogos[N] }> } = {
${modulos}
}

/** Los números de catálogo: '01', '02', …, '65', 'D-37', 'codigos-retorno'. */
export const disponibles: readonly NumeroCatalogo[] = [
${catalogos.map((c) => `  ${literal(c.numero)},`).join('\n')}
]

/**
 * Carga un catálogo con import() dinámico: el bundler lo deja en un archivo
 * aparte que solo se descarga al pedirlo. Pensado para los pesados (13, 25);
 * para los demás, mejor importar el módulo directamente.
 *
 *     const productos = await cargar('25')
 */
export async function cargar<N extends NumeroCatalogo>(numero: N): Promise<Catalogos[N]> {
  const modulo = Object.hasOwn(modulos, numero) ? modulos[numero] : undefined

  if (!modulo) {
    throw new Error(\`No existe el catálogo "\${numero}" de la SUNAT.\`)
  }

  return (await modulo()).default
}
`
}

// Por número y no por archivo: '25' antes que '25-jerarquia', aunque
// '25-jerarquia.json' va antes que '25.json'.
const archivos = (await readdir(DATOS))
  .filter((a) => a.endsWith('.json'))
  .sort((a, b) => (a.slice(0, -5) < b.slice(0, -5) ? -1 : 1))
const catalogos = await Promise.all(
  archivos.map(async (a) => leerCatalogo(a, await readFile(new URL(a, DATOS), 'utf8'))),
)

const faltan = Object.keys(CATALOGOS).filter((n) => !catalogos.some((c) => c.numero === n))
if (faltan.length > 0) {
  throw new Error(`Faltan en datos/: ${faltan.join(', ')}. ¿Falta correr npm run datos?`)
}

const destino = new URL('catalogos/', SRC)
await rm(destino, { recursive: true, force: true })
await mkdir(destino, { recursive: true })

for (const catalogo of catalogos) {
  await writeFile(new URL(`${catalogo.numero}.ts`, destino), moduloCatalogo(catalogo))
}
await writeFile(new URL('codigos.ts', SRC), moduloCodigos(catalogos))
await writeFile(new URL('cargar.ts', SRC), moduloCargar(catalogos))

console.log(`${catalogos.length} catálogos generados en src/`)
