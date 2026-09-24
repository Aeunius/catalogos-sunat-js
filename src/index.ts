import type { Catalogo, Item, Opcion } from './tipos.js'

export type { Catalogos, NumeroCatalogo } from './cargar.js'
export type * from './codigos.js'
export type * from './tipos.js'

// Un índice por catálogo, creado la primera vez que se busca en él. Buscar en
// el 25 recorriendo sus 49.022 códigos cada vez sería lento.
const indices = new WeakMap<Catalogo, Map<string, Item>>()

function indice<I extends Item>(catalogo: Catalogo<I>): Map<string, I> {
  let mapa = indices.get(catalogo)

  if (!mapa) {
    mapa = new Map(catalogo.items.map((item) => [item.codigo, item]))
    indices.set(catalogo, mapa)
  }

  return mapa as Map<string, I>
}

/**
 * El código con sus propiedades, o undefined si no está en el catálogo.
 *
 *     buscar(monedas, 'PEN')?.simbolo   // 'S/'
 */
export function buscar<I extends Item>(
  catalogo: Catalogo<I>,
  codigo: string | number,
): I | undefined {
  return indice(catalogo).get(String(codigo))
}

/**
 * Si el código está en el catálogo. También acota el tipo:
 *
 *     if (existe(monedas, entrada)) {
 *       entrada   // CodigoMoneda
 *     }
 */
export function existe<I extends Item>(
  catalogo: Catalogo<I>,
  codigo: string | number,
): codigo is I['codigo'] {
  return indice(catalogo).has(String(codigo))
}

/**
 * La descripción del código, o undefined si no está en el catálogo.
 *
 *     descripcion(tiposDocumento, '01')   // 'Factura'
 */
export function descripcion(catalogo: Catalogo, codigo: string | number): string | undefined {
  return buscar(catalogo, codigo)?.descripcion
}

/** Los códigos del catálogo, en su orden. */
export function codigos<I extends Item>(catalogo: Catalogo<I>): I['codigo'][] {
  return catalogo.items.map((item) => item.codigo)
}

/**
 * Las opciones para un select, en el orden del catálogo. La etiqueta es la
 * descripción, salvo que se pase otra:
 *
 *     opciones(monedas)                                    // [{ value: 'AED', label: 'dírham …' }, …]
 *     opciones(monedas, (m) => `${m.codigo} - ${m.descripcion}`)
 *     opciones(operaciones.items.filter((o) => o.comprobantes.includes('boleta')))
 */
export function opciones<I extends Item>(
  catalogo: Catalogo<I> | readonly I[],
  etiqueta: (item: I) => string = (item) => item.descripcion,
): Opcion<I['codigo']>[] {
  const items = 'items' in catalogo ? catalogo.items : catalogo

  return items.map((item) => ({ value: item.codigo, label: etiqueta(item) }))
}
