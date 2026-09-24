import type {
  CodigoAeropuerto,
  CodigoBienNormalizado,
  CodigoCargoDescuento,
  CodigoConceptoTributario,
  CodigoDetraccion,
  CodigoDocumentoRelacionadoGuia,
  CodigoDocumentoRelacionadoTributario,
  CodigoDocumentoTransporte,
  CodigoElementoAdicional,
  CodigoEntidadAutorizacion,
  CodigoEstadoItem,
  CodigoIndicadorPrimeraVivienda,
  CodigoLeyenda,
  CodigoMedioPago,
  CodigoModalidadTransporte,
  CodigoMoneda,
  CodigoMotivoTraslado,
  CodigoOtroConceptoTributario,
  CodigoPais,
  CodigoPuerto,
  CodigoRegimenPercepcion,
  CodigoRegimenRetencion,
  CodigoSistemaIsc,
  CodigoTarifaServicioPublico,
  CodigoTipoAfectacionIgv,
  CodigoTipoDireccion,
  CodigoTipoDocumento,
  CodigoTipoDocumentoIdentidad,
  CodigoTipoMedidor,
  CodigoTipoNotaCredito,
  CodigoTipoNotaDebito,
  CodigoTipoOperacion,
  CodigoTipoOperacionAnterior,
  CodigoTipoPrecio,
  CodigoTipoPrestamo,
  CodigoTipoServicioPublico,
  CodigoTipoServicioTelecomunicaciones,
  CodigoTipoValorVenta,
  CodigoTributo,
  CodigoUnidadMedidaGre,
} from './codigos.js'

/** Un código de un catálogo, con las propiedades adicionales que tenga ese catálogo. */
export interface Item<C extends string = string> {
  /** Siempre texto: '01' y '1' son códigos distintos. */
  readonly codigo: C
  readonly descripcion: string
}

/**
 * Un catálogo con sus códigos en el orden de la SUNAT. Es la misma forma que
 * devuelve el paquete PHP al convertir un catálogo en JSON, así que también
 * sirve un catálogo que llega de la API.
 */
export interface Catalogo<I extends Item = Item> {
  /** '01', '02', …, '65', 'D-37', 'codigos-retorno'. */
  readonly numero: string
  readonly nombre: string
  /** De dónde salen los datos; ver FUENTES.md del paquete PHP. */
  readonly fuente: string
  readonly items: readonly I[]
}

/** Una opción para un select: `{ value: 'PEN', label: 'sol peruano' }`. */
export interface Opcion<C extends string = string> {
  readonly value: C
  readonly label: string
}

/** El código que admite un catálogo: `CodigoDe<typeof monedas>` es `CodigoMoneda`. */
export type CodigoDe<T extends Catalogo> = T['items'][number]['codigo']

/** El tipo de sus códigos: `ItemDe<typeof monedas>` es `ItemMoneda`. */
export type ItemDe<T extends Catalogo> = T['items'][number]

// Tipos de cada catálogo. Las propiedades adicionales son las de FUENTES.md del
// paquete PHP; las opcionales no están en todos los códigos.

/** 01 · Código de tipo de documento */
export type ItemTipoDocumento = Item<CodigoTipoDocumento>

/** 02 · Monedas (ISO 4217) */
export interface ItemMoneda extends Item<CodigoMoneda> {
  /** Código numérico ISO 4217: '604' para PEN. */
  readonly numerico: string
  /** Decimales de la moneda según ISO 4217. */
  readonly decimales?: number
  /** Símbolo en español de Perú (Unicode CLDR): 'S/', '€'. */
  readonly simbolo?: string
}

/** 03 · Unidades de medida (UN/ECE Rec. 20) */
export interface ItemUnidadMedida extends Item {
  readonly nombre_en: string
  /** La SUNAT todavía acepta las obsoletas y eliminadas. */
  readonly estado: 'vigente' | 'obsoleto' | 'eliminado'
  readonly simbolo?: string
}

/** 04 · Países (ISO 3166-1) */
export interface ItemPais extends Item<CodigoPais> {
  readonly alpha3: string
  readonly numerico: string
}

/** 05 · Tributos y otros conceptos */
export interface ItemTributo extends Item<CodigoTributo> {
  readonly codigo_internacional: 'VAT' | 'EXC' | 'TOX' | 'OTH' | 'FRE'
  /** El nombre corto que va en el XML: 'IGV', 'IVAP', 'ISC'… */
  readonly nombre: string
}

/** 06 · Tipo de documento de identidad */
export type ItemTipoDocumentoIdentidad = Item<CodigoTipoDocumentoIdentidad>

/** 07 · Tipo de afectación del IGV */
export interface ItemTipoAfectacionIgv extends Item<CodigoTipoAfectacionIgv> {
  /** Códigos del catálogo 05 con que se declara el tributo de la línea. */
  readonly tributos: readonly CodigoTributo[]
}

/** 08 · Sistema de cálculo del ISC */
export type ItemSistemaIsc = Item<CodigoSistemaIsc>

/** 09 · Tipo de nota de crédito */
export type ItemTipoNotaCredito = Item<CodigoTipoNotaCredito>

/** 10 · Tipo de nota de débito */
export type ItemTipoNotaDebito = Item<CodigoTipoNotaDebito>

/** 11 · Tipo de valor de venta (resumen diario) */
export type ItemTipoValorVenta = Item<CodigoTipoValorVenta>

/** 12 · Documentos relacionados tributarios */
export type ItemDocumentoRelacionadoTributario = Item<CodigoDocumentoRelacionadoTributario>

/** 13 · Ubigeo (INEI), en mayúsculas y sin tildes */
export interface ItemUbigeo extends Item {
  readonly provincia: string
  readonly departamento: string
  /** Capital legal del distrito. */
  readonly capital: string
}

/** 14 · Otros conceptos tributarios */
export type ItemOtroConceptoTributario = Item<CodigoOtroConceptoTributario>

/** 15 · Elementos adicionales en la factura y boleta */
export type ItemElementoAdicional = Item<CodigoElementoAdicional>

/** 16 · Tipo de precio de venta unitario */
export type ItemTipoPrecio = Item<CodigoTipoPrecio>

/** 17 · Tipo de operación (el catálogo anterior al 51) */
export type ItemTipoOperacionAnterior = Item<CodigoTipoOperacionAnterior>

/** 18 · Modalidad de transporte */
export type ItemModalidadTransporte = Item<CodigoModalidadTransporte>

/** 19 · Estado del ítem (resumen diario) */
export type ItemEstadoItem = Item<CodigoEstadoItem>

/** 20 · Motivo de traslado */
export type ItemMotivoTraslado = Item<CodigoMotivoTraslado>

/** 21 · Documentos relacionados (guía de remisión) */
export type ItemDocumentoRelacionadoGuia = Item<CodigoDocumentoRelacionadoGuia>

/** 22 · Régimen de percepciones */
export interface ItemRegimenPercepcion extends Item<CodigoRegimenPercepcion> {
  /** En porcentaje: 2 es 2 %. */
  readonly porcentaje: number
}

/** 23 · Régimen de retenciones */
export interface ItemRegimenRetencion extends Item<CodigoRegimenRetencion> {
  /** En porcentaje: 3 es 3 %. */
  readonly porcentaje: number
}

/** 24 · Tarifa de servicios públicos */
export interface ItemTarifaServicioPublico extends Item<CodigoTarifaServicioPublico> {
  readonly servicio: 'agua' | 'gas' | 'luz'
}

/** 25 · Código de producto SUNAT (UNSPSC) */
export type ItemProducto = Item

/** 25-jerarquia · Segmentos, familias y clases del código de producto */
export type ItemJerarquiaProducto = Item

/** 26 · Tipo de préstamo */
export type ItemTipoPrestamo = Item<CodigoTipoPrestamo>

/** 27 · Indicador de primera vivienda */
export type ItemIndicadorPrimeraVivienda = Item<CodigoIndicadorPrimeraVivienda>

/** 51 · Tipo de operación */
export interface ItemTipoOperacion extends Item<CodigoTipoOperacion> {
  /** Los comprobantes en que se puede usar. */
  readonly comprobantes: readonly ('factura' | 'boleta' | 'liquidacion_compra')[]
}

/** 52 · Leyendas */
export type ItemLeyenda = Item<CodigoLeyenda>

/** 53 · Cargos, descuentos y otras deducciones */
export interface ItemCargoDescuento extends Item<CodigoCargoDescuento> {
  readonly nivel: 'item' | 'global'
}

/** 54 · Bienes y servicios sujetos a detracciones */
export type ItemDetraccion = Item<CodigoDetraccion>

/** 55 · Identificación del concepto tributario */
export type ItemConceptoTributario = Item<CodigoConceptoTributario>

/** 56 · Tipo de servicio público */
export type ItemTipoServicioPublico = Item<CodigoTipoServicioPublico>

/** 57 · Tipo de servicio público de telecomunicaciones */
export type ItemTipoServicioTelecomunicaciones = Item<CodigoTipoServicioTelecomunicaciones>

/** 58 · Tipo de medidor */
export type ItemTipoMedidor = Item<CodigoTipoMedidor>

/** 59 · Medios de pago */
export type ItemMedioPago = Item<CodigoMedioPago>

/** 60 · Tipo de dirección */
export type ItemTipoDireccion = Item<CodigoTipoDireccion>

/** 61 · Documentos relacionados al transporte de mercancías */
export interface ItemDocumentoTransporte extends Item<CodigoDocumentoTransporte> {
  /** Las guías en que se puede usar. */
  readonly gre: readonly ('remitente' | 'transportista')[]
}

/** 62 · Bienes normalizados */
export interface ItemBienNormalizado extends Item<CodigoBienNormalizado> {
  /** Código de producto SUNAT (catálogo 25). */
  readonly codigo_producto: string
}

/** 63 · Puertos del Perú */
export interface ItemPuerto extends Item<CodigoPuerto> {
  readonly ubigeo: string
}

/** 64 · Aeropuertos del Perú */
export interface ItemAeropuerto extends Item<CodigoAeropuerto> {
  readonly ubigeo: string
}

/** 65 · Unidades de medida para la GRE (DAM o DS) */
export type ItemUnidadMedidaGre = Item<CodigoUnidadMedidaGre>

/** D-37 · Entidades que emiten autorizaciones especiales para el traslado */
export interface ItemEntidadAutorizacion extends Item<CodigoEntidadAutorizacion> {
  readonly abreviatura: string
}

/** codigos-retorno · Códigos con que responde la SUNAT */
export interface ItemRetorno extends Item {
  /**
   * Según el manual del programador: las excepciones no se procesan, el
   * rechazo no queda registrado y la observación queda aceptada.
   */
  readonly tipo: 'excepcion_sunat' | 'excepcion_contribuyente' | 'rechazo' | 'observacion'
}
