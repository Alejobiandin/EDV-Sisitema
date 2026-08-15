# EDV: evidencia de cobertura por órgano

## Alcance de la prueba

La prueba `server/organs.integration.test.ts` invoca el caller real del router `organs.catalog` con un contexto autenticado de tipo Socio/CPN. El catálogo se evalúa con datos de prueba estructurados para reproducir la relación entre agentes, tareas y alertas. No se modifican registros persistentes de la base de datos.

El flujo verificado es: consultar el catálogo operativo, resolver las células por órgano, calcular agentes activos, contar tareas en curso, contar tareas pendientes de aprobación y detectar alertas no leídas vinculadas a agentes.

## Cobertura

| Órgano | Código | Células esperadas | Flujo representativo cubierto |
|---|---|---:|---|
| Dirección y Coordinación Estratégica | `executive` | 3 | Lectura de gobierno, coordinación y alertas |
| Área Impositiva y Fiscal | `tax` | 3 | Lectura de agentes fiscales y tareas de cumplimiento |
| Área Contable y Financiera | `finance` | 3 | Lectura de tareas financieras y señales operativas |
| Capital Humano y Nómina | `people` | 3 | Lectura de células de personal y tareas pendientes |
| Área Comercial y Facturación | `commercial` | 3 | Lectura de actividad comercial y facturación |
| Operaciones y Abastecimiento | `operations` | 3 | Lectura de actividad operativa y proveedores |
| Área Legal y Contractual | `legal` | 3 | Lectura de cumplimiento, contratos y vigilancia |

## Aserciones principales

La prueba verifica que el router exponga exactamente siete órganos, que cada órgano tenga tres células, que el total sea de 21 agentes y que existan métricas operativas para actividad, tareas en curso, aprobaciones pendientes y alertas no leídas.

La prueba no pretende demostrar todavía la presentación de una declaración jurada ante un organismo, una liquidación laboral legal o una conexión bancaria productiva. Es una prueba de integración del centro operativo multiagente y de su contrato de observabilidad. Las conexiones externas requieren credenciales, homologación y escenarios adicionales en sandbox.

## Escenarios representativos por órgano

La matriz `shared/organScenarios.ts` define un contrato explícito para cada órgano y la prueba `server/organs.integration.test.ts` verifica que el escenario esté registrado, tenga una entrada identificable, una salida esperada y al menos dos agentes responsables.

| Órgano | Entrada | Salida esperada | Dependencias principales |
|---|---|---|---|
| Dirección | Objetivo empresarial y nivel de riesgo | Prioridad coordinada y escalamiento HITL | CEO-Agent, DNA-Governor, Audit & Compliance |
| Impositivo | Comprobantes fiscales del período | Posición fiscal validada y excepciones | Tax Data Intake, VAT & Sales Tax, Withholding & Compliance |
| Financiero | Movimiento bancario y factura pendiente | Conciliación propuesta y asiento auditable | Accounts Receivable, General Ledger, Treasury |
| Capital Humano | Legajo y novedades laborales | Liquidación de haberes y cargas sociales | Personnel Administration, Payroll Calculation, Social Charges & F.931 |
| Comercial | Servicio prestado y acuerdo comercial | Propuesta de honorarios y comprobante | Pricing & Fee, Invoicing |
| Operaciones | Compra, recepción y existencia | Movimiento de stock y alerta de abastecimiento | Vendor Management, Inventory & Stock |
| Legal | Contrato y cambio normativo | Obligaciones extraídas y regla pendiente de revisión | Contract Intelligence, Regulatory Watch |

Estos escenarios validan el contrato de coordinación y observabilidad de cada órgano. La ejecución productiva de cada uno debe conectarse posteriormente con sus credenciales fiscales, bancarias, laborales, comerciales o legales correspondientes.

## Evidencia de ejecución funcional

Además de verificar el catálogo, `server/organs.integration.test.ts` ejecuta siete casos funcionales mediante `executeOrganScenario`, uno por código de órgano. Cada caso recibe una entrada concreta, produce una salida determinística y emite eventos de entrada y salida.

| Prueba | Entrada verificada | Resultado observado |
|---|---|---|
| `executive` | Riesgo alto | Prioridad urgente y escalamiento HITL |
| `tax` | Período 2026-07 con dos documentos | Dos documentos válidos y cero excepciones |
| `finance` | Crédito bancario de 12.500 contra factura de 12.500 | Conciliación coincidente y evento auditable |
| `people` | Dos empleados con haberes brutos de 100.000 y 80.000 | Total bruto 180.000 y cargas calculadas 41.400 |
| `commercial` | Servicio 100.000 con tasa 1,21 | Propuesta de comprobante por 121.000 y aprobación requerida |
| `operations` | Recepción 100, consumo 90 y mínimo 20 | Stock 10 y alerta de reposición |
| `legal` | Renovación contractual y cambio normativo | Obligación extraída y regla enviada a revisión |

La suite registra estos casos como 15 pruebas dentro del archivo de integración: una consulta del catálogo, siete validaciones de contrato y siete ejecuciones funcionales. Estos escenarios son determinísticos y no alteran la base de datos; sirven como primera capa verificable antes de conectar organismos externos o información productiva.

## Pruebas integradas por router

El archivo `server/organFlows.integration.test.ts` complementa los escenarios determinísticos con siete invocaciones a routers reales de EDV. Las dependencias externas se sustituyen por adaptadores controlados para evitar alterar datos productivos, pero los contratos tRPC y los procedimientos ejecutados son los de la aplicación.

| Órgano | Procedimiento real invocado | Salida verificable |
|---|---|---|
| Dirección | `organs.catalog` | Siete órganos y sus códigos oficiales |
| Impositivo | `agents.executeTask` con `tax_computation` | Tarea fiscal completada |
| Financiero | `banking.createConnection` | Conexión registrada con identificador |
| Capital Humano | `agents.executeTask` con `payroll_liquidation` | Tarea de haberes completada |
| Comercial | `vectorSearch.createInvoice` | Factura de honorarios creada |
| Operaciones | `edvManagement.createClient` | Cliente operativo creado |
| Legal | `vectorSearch.querySemantic` | Regla contractual recuperada desde la memoria |

Cada prueba valida el input mediante el esquema Zod del procedimiento y comprueba la salida del router correspondiente. El entorno usa un contexto Socio/CPN y adaptadores de base de datos controlados; por ello estas pruebas cubren integración de contratos y orquestación, pero no sustituyen la homologación externa ni una prueba con credenciales reales.

## Enlace entre escenarios y routers

La prueba `server/organFlows.integration.test.ts` importa directamente `ORGAN_SCENARIOS` y ejecuta una prueba parametrizada por cada escenario. El `switch` de integración utiliza el `organCode` declarativo para invocar el router representativo y verifica una salida observable específica: catálogo para Dirección, ejecución fiscal para Impositivo, conexión bancaria para Finanzas, liquidación para Capital Humano, factura para Comercial, alta operativa para Operaciones y búsqueda contractual para Legal.

De esta forma, el catálogo de escenarios no es documentación paralela: es la fuente que genera los siete casos integrados. Si se agrega o elimina un órgano del contrato, la matriz de pruebas cambia junto con él y obliga a definir su procedimiento representativo.
