import { describe, expect, expectTypeOf, test } from 'vitest'
import { cargar } from '../src/cargar.js'
import tiposDocumento from '../src/catalogos/01.js'
import monedas from '../src/catalogos/02.js'
import identidad from '../src/catalogos/06.js'
import afectacion from '../src/catalogos/07.js'
import ubigeo from '../src/catalogos/13.js'
import percepciones from '../src/catalogos/22.js'
import operaciones from '../src/catalogos/51.js'
import cargos from '../src/catalogos/53.js'
import retorno from '../src/catalogos/codigos-retorno.js'
import {
  buscar,
  type Catalogo,
  type CodigoDe,
  type CodigoMoneda,
  codigos,
  descripcion,
  existe,
  type ItemMoneda,
  opciones,
} from '../src/index.js'

// Los mismos ejemplos del README de aeunius/laravel-catalogos-sunat.

describe('descripcion', () => {
  test('devuelve la descripción del código', () => {
    expect(descripcion(tiposDocumento, '01')).toBe('Factura')
    expect(descripcion(identidad, '6')).toBe('Registro Unico de Contribuyentes')
    expect(descripcion(monedas, 'PEN')).toBe('sol peruano')
  })

  test('undefined si el código no está', () => {
    expect(descripcion(monedas, 'XYZ')).toBeUndefined()
  })
})

describe('existe', () => {
  test('los códigos del catálogo', () => {
    expect(existe(identidad, '6')).toBe(true)
    expect(existe(monedas, 'PEN')).toBe(true)
    expect(existe(monedas, 'XYZ')).toBe(false)
    // Código de 2017, ya no vigente.
    expect(existe(operaciones, '0102')).toBe(false)
  })

  test('acepta números, como el paquete PHP', () => {
    expect(existe(identidad, 6)).toBe(true)
  })

  test("'01' y '1' son códigos distintos", () => {
    expect(existe(tiposDocumento, '01')).toBe(true)
    expect(existe(tiposDocumento, '1')).toBe(false)
    expect(existe(tiposDocumento, 1)).toBe(false)
  })

  test('no confunde las propiedades de Object con códigos', () => {
    expect(existe(monedas, 'constructor')).toBe(false)
    expect(existe(monedas, 'toString')).toBe(false)
  })

  test('acota el tipo del código', () => {
    const entrada: string = 'PEN'

    if (existe(monedas, entrada)) {
      expectTypeOf(entrada).toEqualTypeOf<CodigoMoneda>()
    }
  })
})

describe('buscar', () => {
  test('el código con sus propiedades', () => {
    const pen = buscar(monedas, 'PEN')

    expect(pen).toEqual({
      codigo: 'PEN',
      descripcion: 'sol peruano',
      simbolo: 'S/',
      numerico: '604',
      decimales: 2,
    })
    expectTypeOf(pen).toEqualTypeOf<ItemMoneda | undefined>()
  })

  test('las propiedades de cada catálogo', () => {
    expect(buscar(percepciones, '01')?.porcentaje).toBe(2)
    expect(buscar(operaciones, '0112')?.comprobantes).toEqual(['factura'])
    expect(buscar(operaciones, '0101')?.comprobantes).toEqual(['factura', 'boleta'])
    expect(buscar(afectacion, '17')?.tributos).toEqual(['1016', '9996'])
    expect(buscar(ubigeo, '150101')).toMatchObject({ descripcion: 'LIMA', departamento: 'LIMA' })

    const error = buscar(retorno, '4000')
    expect(error?.descripcion).toBe('El documento ya fue presentado anteriormente.')
    expect(error?.tipo).toBe('observacion')
  })

  test('undefined si el código no está', () => {
    expect(buscar(monedas, 'XYZ')).toBeUndefined()
  })
})

describe('catálogos completos', () => {
  test('nombre y cantidad de códigos', () => {
    expect(cargos.nombre).toBe('Códigos de cargos, descuentos y otras deducciones')
    expect(cargos.items).toHaveLength(22)
  })

  test('se filtran como cualquier arreglo', () => {
    const globales = cargos.items.filter((item) => item.nivel === 'global')

    expect(globales.length).toBeGreaterThan(0)
    expect(globales.every((item) => item.nivel === 'global')).toBe(true)
  })

  test('el código de producto y su jerarquía', async () => {
    const productos = await cargar('25')
    const jerarquia = await cargar('25-jerarquia')

    expect(productos.items).toHaveLength(49022)
    expect(descripcion(productos, '10101502')).toBe('Perros')
    expect(descripcion(jerarquia, '10101500')).toBe('Animales de granja')
  })
})

describe('codigos', () => {
  test('en el orden del catálogo', () => {
    expect(codigos(tiposDocumento).slice(0, 3)).toEqual(['01', '03', '04'])
    expectTypeOf(codigos(monedas)).toEqualTypeOf<CodigoMoneda[]>()
  })
})

describe('opciones', () => {
  test('value y label en el orden del catálogo', () => {
    const lista = opciones(tiposDocumento)

    expect(lista).toHaveLength(tiposDocumento.items.length)
    expect(lista[0]).toEqual({ value: '01', label: 'Factura' })
    expect(lista[1]).toEqual({ value: '03', label: 'Boleta de venta' })
  })

  test('con otra etiqueta', () => {
    const lista = opciones(monedas, (m) => `${m.codigo} - ${m.descripcion}`)

    expect(lista.find((o) => o.value === 'PEN')?.label).toBe('PEN - sol peruano')
  })

  test('de una parte del catálogo', () => {
    const boletas = opciones(operaciones.items.filter((o) => o.comprobantes.includes('boleta')))

    expect(boletas.some((o) => o.value === '0101')).toBe(true)
    expect(boletas.some((o) => o.value === '0112')).toBe(false)
  })
})

test('sirve un catálogo que llega de la API del paquete PHP', () => {
  // return Catalogos::get('02') en Laravel devuelve esta forma.
  const desdeApi: Catalogo = JSON.parse(
    '{"numero":"02","nombre":"Código de tipo de monedas","fuente":"…","items":[{"codigo":"PEN","descripcion":"sol peruano","simbolo":"S/"}]}',
  )

  expect(descripcion(desdeApi, 'PEN')).toBe('sol peruano')
  expect(opciones(desdeApi)).toEqual([{ value: 'PEN', label: 'sol peruano' }])
})

test('CodigoDe saca el tipo del código de un catálogo', () => {
  expectTypeOf<CodigoDe<typeof monedas>>().toEqualTypeOf<CodigoMoneda>()
})

test('cargar rechaza un catálogo que no existe', async () => {
  // @ts-expect-error: '99' no es un número de catálogo.
  await expect(cargar('99')).rejects.toThrow('No existe el catálogo "99"')
  // @ts-expect-error: tampoco una propiedad de Object.
  await expect(cargar('toString')).rejects.toThrow()
})
