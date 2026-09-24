# Catálogos de la SUNAT para JavaScript

Los catálogos del **Anexo N.° 8** de la facturación electrónica de la SUNAT
para el navegador y Node: tipos de documento, monedas, unidades de medida,
tributos, afectación del IGV, tipos de operación, ubigeo, código de producto
(UNSPSC), detracciones, medios de pago y el resto.

[![ci](https://github.com/Aeunius/catalogos-sunat-js/actions/workflows/ci.yml/badge.svg)](https://github.com/Aeunius/catalogos-sunat-js/actions/workflows/ci.yml)
[![Versión en npm](https://img.shields.io/npm/v/@aeunius/catalogos-sunat.svg)](https://www.npmjs.com/package/@aeunius/catalogos-sunat)
[![Licencia](https://img.shields.io/npm/l/@aeunius/catalogos-sunat.svg)](LICENSE.md)

Es el gemelo de [aeunius/laravel-catalogos-sunat](https://github.com/Aeunius/laravel-catalogos-sunat),
con **los mismos datos**: el frontend y el backend usan exactamente los mismos
códigos, sin copiar JSON a mano ni pedirlos a la API.

- Los 42 catálogos vigentes (01–27 y 51–65), el listado D-37 de la guía de
  remisión y los 2.020 códigos de retorno de la SUNAT.
- Un módulo por catálogo: la app solo incluye los que importa. El 25 (UNSPSC)
  pesa 3,3 MB y no se cuela en una app que solo necesita monedas.
- Tipos para todo: los códigos de los catálogos chicos como uniones
  (`CodigoMoneda = 'AED' | … | 'PEN' | …`) y las propiedades adicionales de
  cada catálogo (el símbolo de la moneda, los comprobantes de un tipo de
  operación…).
- Sin dependencias.

## Instalación

```bash
npm install @aeunius/catalogos-sunat
```

Es un paquete ESM. En Node requiere la versión 22.12 o superior, que también
permite cargarlo con `require()`.

## Uso

Cada catálogo se importa por su número, y las funciones reciben el catálogo:

```ts
import { buscar, descripcion, existe } from '@aeunius/catalogos-sunat'
import tiposDocumento from '@aeunius/catalogos-sunat/catalogos/01'
import monedas from '@aeunius/catalogos-sunat/catalogos/02'
import identidad from '@aeunius/catalogos-sunat/catalogos/06'
import percepciones from '@aeunius/catalogos-sunat/catalogos/22'
import operaciones from '@aeunius/catalogos-sunat/catalogos/51'

descripcion(tiposDocumento, '01')    // 'Factura'
existe(identidad, '6')               // true
existe(operaciones, '0102')          // false: código de 2017, ya no vigente

const pen = buscar(monedas, 'PEN')
pen?.descripcion                     // 'sol peruano'
pen?.simbolo                         // 'S/'
pen?.decimales                       // 2

buscar(percepciones, '01')?.porcentaje     // 2
buscar(operaciones, '0112')?.comprobantes  // ['factura']
```

Los códigos siempre son texto: `'01'` y `'1'` son códigos distintos. Como en
el paquete PHP, también se acepta un número (`existe(identidad, 6)`).

### Catálogos completos

Un catálogo es un objeto con sus códigos en `items`, en el orden de la SUNAT:

```ts
import cargos from '@aeunius/catalogos-sunat/catalogos/53'

cargos.nombre          // 'Códigos de cargos, descuentos y otras deducciones'
cargos.items.length    // 22
cargos.items[0]        // { codigo: '00', descripcion: '…', nivel: 'item' }

const globales = cargos.items.filter((item) => item.nivel === 'global')
```

Es la misma forma que devuelve el paquete PHP al convertir un catálogo en JSON
(`return Catalogos::get('02')`), así que las funciones también sirven con un
catálogo que llega de la API.

### Selects

`opciones()` devuelve `{ value, label }` en el orden del catálogo, listo para
un `<select>`, `q-select` de Quasar o `v-select` de Vuetify:

```ts
import { opciones } from '@aeunius/catalogos-sunat'

opciones(monedas)
// [{ value: 'AED', label: 'dírham de los Emiratos Árabes Unidos' }, …]

opciones(monedas, (m) => `${m.codigo} - ${m.descripcion}`)

// Solo una parte del catálogo: los tipos de operación que admiten boleta.
opciones(operaciones.items.filter((o) => o.comprobantes.includes('boleta')))
```

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { opciones } from '@aeunius/catalogos-sunat'
import monedas from '@aeunius/catalogos-sunat/catalogos/02'
import type { CodigoMoneda } from '@aeunius/catalogos-sunat'

const moneda = ref<CodigoMoneda>('PEN')
const opcionesMoneda = opciones(monedas)
</script>

<template>
  <q-select v-model="moneda" :options="opcionesMoneda" emit-value map-options />
</template>
```

Los catálogos no cambian mientras corre la app, así que no hace falta
envolverlos en `ref` ni `computed`.

### Tipos

`existe()` acota el tipo del código, útil para validar lo que llega de un
formulario o de una URL:

```ts
import type { CodigoMoneda } from '@aeunius/catalogos-sunat'

function cambiarMoneda(entrada: string) {
  if (existe(monedas, entrada)) {
    entrada   // CodigoMoneda
  }
}
```

Hay uniones de códigos para todos los catálogos salvo los grandes (03, 13, 25,
`25-jerarquia` y `codigos-retorno`), cuyos códigos son `string`. Entre ellas:

| Tipo | Catálogo |
|---|---|
| `CodigoTipoDocumento` | 01 Tipo de documento |
| `CodigoMoneda` | 02 Monedas (ISO 4217) |
| `CodigoTipoDocumentoIdentidad` | 06 Tipo de documento de identidad |
| `CodigoTipoAfectacionIgv` | 07 Tipo de afectación del IGV |
| `CodigoTipoOperacion` | 51 Tipo de operación |

Cada catálogo tiene además su tipo de código con sus propiedades (`ItemMoneda`,
`ItemTipoOperacion`, `ItemUbigeo`…), y dos utilidades para sacarlos de un
catálogo: `CodigoDe<typeof monedas>` y `ItemDe<typeof monedas>`. La lista
completa está en [src/tipos.ts](src/tipos.ts).

### Catálogos pesados

El ubigeo (13) y el código de producto (25) son grandes. `cargar()` los trae
con `import()` dinámico: el bundler los deja en un archivo aparte que solo se
descarga cuando se piden.

```ts
import { cargar } from '@aeunius/catalogos-sunat/cargar'

const productos = await cargar('25')
descripcion(productos, '10101502')              // 'Perros'

// Los 6 primeros dígitos de un producto más 00 son su clase.
const jerarquia = await cargar('25-jerarquia')
descripcion(jerarquia, '10101500')              // 'Animales de granja'
```

`cargar()` sirve con cualquier catálogo y conoce su tipo. `disponibles` lista
todos los números. Como el bundler prepara un archivo por cada catálogo que
`cargar()` puede pedir, importa `cargar` solo si lo necesitas.

Los códigos con que responde la SUNAT están en `codigos-retorno`, con su tipo:

```ts
import retorno from '@aeunius/catalogos-sunat/catalogos/codigos-retorno'

const error = buscar(retorno, cdr.codigo)
error?.descripcion   // 'El documento ya fue presentado anteriormente.'
error?.tipo          // 'observacion': el comprobante quedó aceptado
```

<details>
<summary>Catálogos incluidos</summary>

| Módulo | Nombre | Códigos |
|---|---|--:|
| `catalogos/01` | Código de tipo de documento | 40 |
| `catalogos/02` | Código de tipo de monedas | 178 |
| `catalogos/03` | Código de tipo de unidad de medida comercial | 2.136 |
| `catalogos/04` | Código de país | 249 |
| `catalogos/05` | Código de tipos de tributos y otros conceptos | 10 |
| `catalogos/06` | Código de tipo de documento de identidad | 13 |
| `catalogos/07` | Código de tipo de afectación del IGV | 19 |
| `catalogos/08` | Código de tipos de sistema de cálculo del ISC | 3 |
| `catalogos/09` | Códigos de tipo de nota de crédito electrónica | 13 |
| `catalogos/10` | Códigos de tipo de nota de débito electrónica | 5 |
| `catalogos/11` | Códigos de tipo de valor de venta (Resumen diario de boletas y notas) | 5 |
| `catalogos/12` | Código de documentos relacionados tributarios | 11 |
| `catalogos/13` | Código de ubicación geográfica (UBIGEO) | 1.874 |
| `catalogos/14` | Código de otros conceptos tributarios | 12 |
| `catalogos/15` | Códigos de elementos adicionales en la factura y boleta electrónica | 45 |
| `catalogos/16` | Código de tipo de precio de venta unitario | 3 |
| `catalogos/17` | Código de tipo de operación | 20 |
| `catalogos/18` | Código de modalidad de transporte | 2 |
| `catalogos/19` | Código de estado del ítem (resumen diario) | 3 |
| `catalogos/20` | Código de motivo de traslado | 14 |
| `catalogos/21` | Código de documentos relacionados (sólo guía de remisión electrónica) | 6 |
| `catalogos/22` | Código de regimen de percepciones | 3 |
| `catalogos/23` | Código de regimen de retenciones | 2 |
| `catalogos/24` | Código de tarifa de servicios públicos | 49 |
| `catalogos/25` | Código de producto SUNAT | 49.022 |
| `catalogos/25-jerarquia` | Jerarquía del código de producto SUNAT: segmentos, familias y clases | 4.294 |
| `catalogos/26` | Tipo de préstamo (créditos hipotecarios) | 3 |
| `catalogos/27` | Indicador de primera vivienda | 4 |
| `catalogos/51` | Código de tipo de operación | 31 |
| `catalogos/52` | Códigos de leyendas | 15 |
| `catalogos/53` | Códigos de cargos, descuentos y otras deducciones | 22 |
| `catalogos/54` | Códigos de bienes y servicios sujetos a detracciones | 39 |
| `catalogos/55` | Código de identificación del concepto tributario | 120 |
| `catalogos/56` | Código de tipo de servicio público | 7 |
| `catalogos/57` | Código de tipo de servicio públicos - telecomunicaciones | 4 |
| `catalogos/58` | Código de tipo de medidor (recibo de luz) | 2 |
| `catalogos/59` | Medios de Pago | 22 |
| `catalogos/60` | Código de tipo de dirección | 5 |
| `catalogos/61` | Documentos relacionados al transporte de mercancías | 27 |
| `catalogos/62` | Bienes normalizados | 52 |
| `catalogos/63` | Puertos del Perú | 21 |
| `catalogos/64` | Aeropuertos del Perú | 31 |
| `catalogos/65` | Código de unidades de medida (para uso solo para la GRE en DAM o DS) | 97 |
| `catalogos/D-37` | Entidades que emiten autorizaciones especiales para el traslado | 12 |
| `catalogos/codigos-retorno` | Códigos de retorno de la SUNAT: excepciones, rechazos y observaciones | 2.020 |

</details>

## De dónde salen los datos

De [aeunius/laravel-catalogos-sunat](https://github.com/Aeunius/laravel-catalogos-sunat),
que los genera desde los Excel de reglas de validación de la SUNAT y los
estándares a los que remite el anexo (ISO 4217, UN/ECE Rec. 20, ISO 3166-1,
ubigeo del INEI, UNSPSC). El detalle, con versiones y fechas, está en su
[FUENTES.md](https://github.com/Aeunius/laravel-catalogos-sunat/blob/main/FUENTES.md).

Aquí no se generan: `datos/` guarda los JSON de una etiqueta fija del paquete
PHP, la de `config.datos` en `package.json`, y el CI comprueba que no se hayan
tocado.

## Versionado

Cada versión lleva el mismo número que la versión del paquete PHP de la que
salen sus datos: `@aeunius/catalogos-sunat@1.0.0` tiene los datos de
`laravel-catalogos-sunat` `v1.0.0`. Si hay que corregir algo solo en este
paquete, se publica un *patch* y se anota en el [CHANGELOG](CHANGELOG.md).

Sigue el mismo [versionado semántico](https://semver.org/lang/es/) que el
paquete PHP, también en los datos:

| Cambio | Versión |
|---|---|
| Se corrige una descripción | *patch* (1.0.1) |
| La SUNAT agrega códigos o catálogos | *minor* (1.1.0) |
| La SUNAT retira o renumera códigos | *major* (2.0.0) |

Quedan cubiertos por la compatibilidad las funciones, los módulos de cada
catálogo, los nombres de los tipos y los de las propiedades adicionales
(`simbolo`, `comprobantes`, `nivel`, `tipo`…).

## Desarrollo

Todo corre en Docker con la imagen `node:24`; no hace falta Node en el equipo.

```bash
make install     # dependencias
make test        # Vitest
make typecheck   # tsc
make lint        # Biome, sin cambiar nada
make build       # compila a dist/
make datos       # descarga los JSON de la etiqueta de package.json
```

Para pasar a una nueva versión de los datos: cambia `config.datos` en
`package.json`, corre `make datos`, revisa el diff de `datos/` (un código por
línea) y saca la versión con el mismo número.

## Licencia

El código es MIT; ver [LICENSE.md](LICENSE.md). Los catálogos son información
pública de la SUNAT y de los organismos de estandarización citados en el
[FUENTES.md](https://github.com/Aeunius/laravel-catalogos-sunat/blob/main/FUENTES.md)
del paquete PHP.
