# Changelog

Todos los cambios importantes de este paquete se registran aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el
proyecto usa [versionado semántico](https://semver.org/lang/es/). Cada versión
indica de qué etiqueta de
[laravel-catalogos-sunat](https://github.com/Aeunius/laravel-catalogos-sunat)
salen sus datos; el CHANGELOG de ese paquete dice a qué versión del Anexo N.° 8
corresponden.

## [Sin publicar]

## [1.0.0] - 2026-09-23

Primera versión. Datos: `laravel-catalogos-sunat` v1.0.0 (Excel de reglas de
validación CPE y GRE de la SUNAT del 21-04-2025; ubigeo del INEI, Límites 2015).

### Agregado

- Los 42 catálogos del Anexo N.° 8 vigente (01–27 y 51–65), el listado D-37,
  la jerarquía del código de producto (`25-jerarquia`) y los códigos de retorno
  de la SUNAT, un módulo por catálogo en `@aeunius/catalogos-sunat/catalogos/*`.
- `descripcion()`, `existe()`, `buscar()`, `codigos()` y `opciones()`, que
  también sirven con un catálogo devuelto por la API del paquete PHP.
- `cargar()` y `disponibles` en `@aeunius/catalogos-sunat/cargar`, para traer
  un catálogo con `import()` dinámico.
- Uniones de códigos (`CodigoMoneda`, `CodigoTipoDocumento`…) para todos los
  catálogos salvo 03, 13, 25, `25-jerarquia` y `codigos-retorno`, y el tipo de
  cada catálogo con sus propiedades adicionales (`ItemMoneda`,
  `ItemTipoOperacion`…).

[Sin publicar]: https://github.com/Aeunius/catalogos-sunat-js/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Aeunius/catalogos-sunat-js/releases/tag/v1.0.0
