# EDV: explicación de Tax Data Intake Agent y de las 21 células especializadas

## 1. Qué significa “Tax Data Intake Agent”

**Tax Data Intake Agent** se traduce como **Agente de Ingesta y Validación de Datos Fiscales**. No es un agente que “calcula un impuesto” por sí solo. Es la célula que recibe, ordena, normaliza y controla la calidad de la información que después utilizarán los agentes impositivos, contables, financieros y de cumplimiento.

Una analogía útil es la del sistema digestivo y nervioso del organismo EDV: recibe comprobantes, archivos, padrones, extractos, facturas, notas de crédito, percepciones, retenciones y otros documentos; identifica qué es cada cosa; extrae sus datos; detecta errores; registra el origen; y entrega una versión estructurada al resto de las células.

Su misión es evitar que los agentes posteriores calculen sobre información incompleta, duplicada, mal identificada o perteneciente a otro período.

## 2. Qué recibe

El agente puede recibir facturas de compra y venta, notas de crédito y débito, recibos, comprobantes de retenciones y percepciones, archivos CSV o Excel, extractos bancarios, padrones fiscales, constancias de inscripción, información de clientes y proveedores, datos de empleados y documentos enviados por otros sistemas mediante API.

Cada ingreso debe conservar metadatos de procedencia: quién lo cargó, cuándo llegó, qué sistema lo originó, qué período declara representar, a qué empresa o cliente pertenece y qué versión del documento fue recibida.

## 3. Qué hace paso a paso

| Etapa | Función | Resultado |
|---|---|---|
| Recepción | Acepta archivos, documentos o datos de una integración | Entrada registrada |
| Identificación | Determina tipo de comprobante, emisor, receptor y período | Documento clasificado |
| Extracción | Obtiene CUIT, fecha, número, tipo, neto, IVA, total, moneda y referencias | Campos estructurados |
| Normalización | Convierte formatos de fechas, importes, identificadores y monedas a un formato común | Datos comparables |
| Validación formal | Comprueba campos obligatorios, tipos, rangos, CUIT/CUIL, duplicados y consistencia matemática | Estado válido, observado o rechazado |
| Validación contextual | Verifica empresa, período, jurisdicción, cliente, proveedor y relación con el proceso | Contexto asignado |
| Detección de anomalías | Busca facturas repetidas, importes atípicos, fechas incompatibles o documentos cruzados | Señal de riesgo |
| Enriquecimiento | Consulta reglas del ADN, categorías, centros de costo, cuentas o convenios | Datos listos para procesar |
| Derivación | Envía la información al agente responsable | Tarea interagente |
| Auditoría | Conserva la entrada, transformaciones, decisiones y errores | Trazabilidad completa |

## 4. Qué no hace Tax Data Intake Agent

No decide definitivamente si una factura es deducible, no presenta declaraciones juradas, no liquida IVA, no calcula impuesto a las ganancias, no autoriza pagos y no reemplaza el criterio profesional frente a un conflicto de encuadramiento.

Puede proponer una clasificación o marcar una inconsistencia, pero las decisiones de riesgo alto deben pasar por **HITL (Human-in-the-Loop)**. Por ejemplo, si detecta que el CUIT del emisor no coincide con la empresa, si el comprobante pertenece a un período cerrado o si hay dos documentos con el mismo número, la célula debe detener el flujo y solicitar revisión.

## 5. Ejemplo concreto

Supongamos que una empresa carga una factura de compra por $1.210.000. Tax Data Intake Agent identifica al proveedor, comprueba la fecha y el período, separa neto e IVA, verifica que neto más impuesto coincida con el total, detecta si el comprobante ya fue ingresado y lo relaciona con la empresa correcta.

Si todo es consistente, deriva el documento al **VAT & Sales Tax Agent** para el tratamiento del IVA, al **General Ledger Agent** para la propuesta de asiento y al **Accounts Payable Agent** para el circuito de proveedor y pago. Si hay un conflicto, crea una señal de revisión y no permite que el resto de las células utilice el documento como si estuviera confirmado.

## 6. Las 21 células de EDV

EDV se organiza en siete órganos funcionales. Un órgano es un área empresarial; una célula es un agente especializado dentro de esa área.

### Órgano I: Dirección y Coordinación Estratégica

| Agente | Traducción | Responsabilidad principal |
|---|---|---|
| **CEO-Agent** | Agente de Dirección y Orquestación | Recibe objetivos, prioriza tareas, coordina órganos, detecta cuellos de botella y eleva excepciones críticas. No reemplaza al director humano: organiza la ejecución y solicita aprobación cuando corresponde. |
| **DNA-Governor Agent** | Agente Gobernador del ADN Organizacional | Custodia reglas, políticas, procedimientos, memoria institucional y versiones del conocimiento. Controla que los agentes utilicen reglas vigentes y que los cambios queden versionados. |
| **Audit & Compliance Agent** | Agente de Auditoría y Cumplimiento | Revisa trazabilidad, inconsistencias, segregación de funciones, desvíos y señales de fraude o incumplimiento. Puede detener o escalar procesos de riesgo. |

### Órgano II: Área Impositiva y Fiscal

| Agente | Traducción | Responsabilidad principal |
|---|---|---|
| **VAT & Sales Tax Agent** | Agente de IVA y Tributos Indirectos | Calcula débitos y créditos fiscales, organiza libros IVA, analiza compras y ventas y prepara la posición del período. Trabaja sobre información validada por Tax Data Intake Agent. |
| **Corporate Income Tax Agent** | Agente de Impuesto a las Ganancias | Proyecta renta imponible, anticipos, amortizaciones, ajustes y parámetros del impuesto corporativo. Debe elevar tratamientos dudosos o cambios normativos a revisión profesional. |
| **Withholding & Compliance Agent** | Agente de Retenciones, Percepciones y Cumplimiento | Controla retenciones y percepciones, padrones, jurisdicciones, certificados y condiciones aplicables a pagos y cobros. |
| **Tax Data Intake Agent** | Agente de Ingesta y Validación de Datos Fiscales | Prepara la información de entrada. Es el filtro de calidad y procedencia antes de que los demás agentes fiscales calculen. |

### Órgano III: Área Contable y Financiera

| Agente | Traducción | Responsabilidad principal |
|---|---|---|
| **General Ledger Agent** | Agente de Libro Mayor y Asientos | Propone y controla asientos contables, clasifica comprobantes, mantiene diario y mayor y verifica que cada movimiento tenga cuenta y período. |
| **Accounts Receivable Agent** | Agente de Cobranzas y Cuentas Corrientes | Sigue facturas emitidas, saldos de clientes, vencimientos, cobranzas y morosidad. Puede recibir señales de Stripe, Mercado Pago y banca. |
| **Accounts Payable Agent** | Agente de Proveedores y Pagos | Controla facturas de compras, órdenes, vencimientos, autorización de pagos y consistencia de proveedores. No debería ejecutar pagos de alto riesgo sin aprobación. |
| **Treasury & Cash Flow Agent** | Agente de Tesorería y Flujo de Caja | Proyecta liquidez, ingresos, egresos, saldos y necesidades financieras. Usa feeds bancarios para actualizar la posición de caja. |
| **Financial Close & Controls Agent** | Agente de Cierre y Controles Financieros | Ejecuta checklists de cierre, compara subdiarios con libro mayor, detecta diferencias y prepara excepciones para HITL. |

### Órgano IV: Capital Humano y Nómina

| Agente | Traducción | Responsabilidad principal |
|---|---|---|
| **Payroll Calculation Agent** | Agente de Liquidación de Haberes | Calcula sueldos, adicionales, presentismo, antigüedad, horas extra, descuentos y conceptos según legajo, novedades, reglas y convenio aplicable. |
| **Social Charges & F931 Agent** | Agente de Cargas Sociales y F.931 | Calcula bases y contribuciones patronales, seguridad social, obra social, sindicatos y datos preparatorios para las declaraciones correspondientes. |
| **Personnel Administration Agent** | Agente de Administración de Personal | Gestiona legajos, altas, bajas, licencias, vacaciones, ausencias, novedades y documentación de empleados. |

### Órgano V: Comercial y Facturación

| Agente | Traducción | Responsabilidad principal |
|---|---|---|
| **Invoicing Agent** | Agente de Emisión de Facturación | Prepara y emite comprobantes, notas de crédito y notas de débito mediante una integración fiscal autorizada. Requiere credenciales y configuración reales antes de emitir documentos. |
| **Pricing & Fee Agent** | Agente de Tarifas, Honorarios y Contratos Comerciales | Controla acuerdos, precios, honorarios, actualizaciones, servicios realizados y cargos periódicos. Puede generar propuestas de facturación, pero las reglas comerciales sensibles pueden requerir aprobación. |

### Órgano VI: Operaciones y Abastecimiento

| Agente | Traducción | Responsabilidad principal |
|---|---|---|
| **Inventory & Stock Agent** | Agente de Inventario y Activos | Controla entradas, salidas, existencias, valuación, activos y puntos de reposición. |
| **Vendor Management Agent** | Agente de Gestión y Evaluación de Proveedores | Analiza cumplimiento, precios, tiempos, documentación, riesgo y desempeño histórico de proveedores. |

### Órgano VII: Legal y Contractual

| Agente | Traducción | Responsabilidad principal |
|---|---|---|
| **Contract Intelligence Agent** | Agente de Inteligencia Contractual | Lee contratos, identifica obligaciones, vencimientos, cláusulas de riesgo, renovaciones y dependencias comerciales. No sustituye el asesoramiento legal. |
| **Regulatory Watch Agent** | Agente de Vigilancia Normativa | Detecta cambios en normas, resoluciones, convenios y fuentes oficiales; propone actualizaciones del ADN, pero no activa automáticamente una regla crítica sin revisión. |

## 7. Cómo trabajan coordinados

Una tarea empresarial no pasa necesariamente por un solo agente. EDV arma una cadena de trabajo con señales y estados.

Por ejemplo, en una cobranza bancaria, **Tax Data Intake Agent** o el conector bancario recibe y normaliza el movimiento. **Accounts Receivable Agent** busca facturas pendientes compatibles. La persona selecciona o confirma la factura en la pantalla de conciliación. Después, **General Ledger Agent** prepara el asiento, **Treasury & Cash Flow Agent** actualiza la caja y **Audit & Compliance Agent** registra la trazabilidad.

En una liquidación salarial, **Personnel Administration Agent** aporta legajos y novedades; **DNA-Governor Agent** aporta convenio y políticas; **Payroll Calculation Agent** calcula haberes; **Social Charges & F931 Agent** determina cargas; **Audit & Compliance Agent** revisa; y un responsable humano aprueba antes de presentar o pagar.

## 8. Qué significa HITL en EDV

HITL significa **Human-in-the-Loop**, es decir, humano dentro del circuito de decisión. EDV no debe funcionar como una caja negra que ejecuta cualquier orden. Los agentes pueden automatizar tareas repetitivas y de bajo riesgo, pero deben detenerse o pedir aprobación cuando existe impacto legal, fiscal, financiero, laboral o reputacional.

Se recomienda pedir aprobación para pagos, presentación de declaraciones, emisión fiscal real, cambios de reglas del ADN, altas o bajas laborales, excepciones de convenio, diferencias materiales, movimientos bancarios ambiguos y decisiones que no tengan suficiente evidencia.

## 9. Qué significa que los nombres estén en inglés

Los nombres en inglés son identificadores técnicos y siguen una convención habitual de arquitectura de software. No significa que EDV esté limitado a operar en inglés ni que los agentes sean servicios externos. Por ejemplo:

| Nombre técnico | Nombre funcional en español |
|---|---|
| Tax Data Intake Agent | Agente de Ingesta y Validación de Datos Fiscales |
| VAT & Sales Tax Agent | Agente de IVA y Tributos Indirectos |
| General Ledger Agent | Agente de Libro Mayor y Asientos |
| Accounts Receivable Agent | Agente de Cobranzas y Cuentas Corrientes |
| Payroll Calculation Agent | Agente de Liquidación de Haberes |
| Regulatory Watch Agent | Agente de Vigilancia Normativa |

La arquitectura puede mostrar ambos nombres: el nombre amigable en español para el usuario y el identificador técnico en inglés para código, trazas, integraciones y documentación.

## 10. Estado actual y límites reales

EDV ya tiene la arquitectura, los routers, las pantallas operativas, el motor determinístico en Python, el motor de razonamiento, el circuito HITL, la auditoría y la base de las 21 células.

Sin embargo, que exista un agente en la arquitectura no significa que ya tenga conexión productiva con todos los organismos externos. Para operar con datos reales todavía deben configurarse credenciales, APIs, certificados, fuentes oficiales, parámetros por empresa, reglas de jurisdicción, escalas salariales vigentes y aprobaciones de uso.

En particular, las escalas del CCT 130/75 no deben quedar grabadas como importes fijos porque cambian mediante acuerdos y circulares. EDV debe guardar la fuente, la versión y la fecha de vigencia, y bloquear o elevar a HITL una liquidación si el parámetro está vencido o no fue validado.

La documentación del CCT 130/75 utilizada por el ADN debe revisarse con un profesional laboral o contable antes de liquidar y presentar información real. El sistema automatiza controles y cálculos configurados; no convierte por sí mismo una interpretación jurídica o fiscal en una decisión válida para todos los casos.

## 11. Resumen de una frase por agente

**CEO-Agent** coordina; **DNA-Governor Agent** custodia la memoria y las reglas; **Audit & Compliance Agent** controla; **VAT & Sales Tax Agent** calcula IVA; **Corporate Income Tax Agent** trabaja ganancias; **Withholding & Compliance Agent** calcula retenciones y percepciones; **Tax Data Intake Agent** prepara y valida los datos fiscales; **General Ledger Agent** propone asientos; **Accounts Receivable Agent** gestiona cobranzas; **Accounts Payable Agent** gestiona proveedores y pagos; **Treasury & Cash Flow Agent** controla liquidez; **Financial Close & Controls Agent** cierra y reconcilia controles; **Payroll Calculation Agent** liquida sueldos; **Social Charges & F931 Agent** calcula cargas sociales; **Personnel Administration Agent** administra empleados; **Invoicing Agent** emite facturación; **Pricing & Fee Agent** controla tarifas y honorarios; **Inventory & Stock Agent** controla inventario; **Vendor Management Agent** evalúa proveedores; **Contract Intelligence Agent** analiza contratos; y **Regulatory Watch Agent** vigila cambios normativos.

## Referencias consultadas

[1] [Argentina.gob.ar — Convención Colectiva de Trabajo N.º 130/75, Empleados de Comercio](https://www.argentina.gob.ar/sites/default/files/mteyss-ese-conveniocolectivodetrabajo-comercio-130-75.pdf).

[2] [FAECYS — Circular de escalas salariales abril 2026-julio 2026, CCT 130/75](https://www.faecys.org.ar/faecys-circular-escalas-salariales-abril-2026-julio-2026-cct-130-75-rama-gremial/).

[3] [InfoLEG — Resolución y convenio articulado con CCT 130/75](https://servicios.infoleg.gob.ar/infolegInternet/anexos/205000-209999/209035/norma.htm).
