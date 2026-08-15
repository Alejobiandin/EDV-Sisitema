# EDV — Guía funcional y estado real de publicación

## 1. Respuesta directa

**EDV no es solamente una maqueta visual.** Es una aplicación web full-stack con frontend React, backend Node/Express con procedimientos tRPC, base de datos MySQL/TiDB mediante Drizzle ORM, autenticación, persistencia de tareas, motor Python para cálculos determinísticos, agentes especializados, aprobación humana, exportación de reportes y pruebas automatizadas.

Sin embargo, tampoco debe considerarse todavía un producto contable completamente listo para operar sin configuración. **Al publicar se ejecutará la aplicación**, pero algunas funciones dependen de variables de entorno, datos reales, disponibilidad del runtime Python y configuración de servicios externos. Además, determinados módulos actualmente son demostrativos o de integración preliminar y no deben presentarse como firma digital legal, conciliación bancaria real o liquidación normativa definitiva sin una etapa adicional de producción.

## 2. Qué es EDV

EDV significa **EDV · Sistema Organizacional Cognitivo**. Su concepto central es representar un estudio contable como un organismo digital:

| Concepto EDV | Función en el sistema |
|---|---|
| Organismo | La plataforma completa y su centro de mando. |
| Órganos | Áreas funcionales como impuestos, contabilidad, nómina y cargas sociales. |
| Células | Agentes especializados que ejecutan tareas concretas. |
| ADN Organizacional | Reglas, políticas, procedimientos y memoria institucional. |
| Señales | Notificaciones, auditoría, estados de tareas y solicitudes HITL. |
| Memoria | Datos maestros, documentos, reglas, políticas y memoria vectorial. |
| Supervisión humana | Aprobación o rechazo explícito de tareas sensibles. |

La finalidad no es que un modelo de lenguaje decida libremente sobre la contabilidad. EDV combina **cálculo determinístico**, memoria organizacional, razonamiento asistido por LLM y control humano.

## 3. Qué aparece al ingresar al sitio

### 3.1 Visión general: Centro de Mando EDV

La ruta principal `/` muestra el estado operativo de la organización digital. Incluye métricas de células activas, tareas en curso, alertas sin leer y cantidad de entradas del ADN Organizacional. También muestra el porcentaje de disponibilidad de las células y un resumen de tareas pendientes, aprobadas, rechazadas y en revisión.

El panel permite enviar una tarea a una célula seleccionando el agente, el tipo de cálculo, el cliente, el período y los datos de entrada. Para impuestos se pueden informar ventas gravadas y compras con crédito fiscal. Para nómina se pueden informar sueldo base y horas suplementarias. La pantalla también permite seleccionar un empleado precargado desde los maestros EDV.

### 3.2 Células especializadas

La versión actual contiene cuatro células principales:

| Célula | Responsabilidad |
|---|---|
| Célula Impositiva | Determinación fiscal, especialmente cálculo de IVA. |
| Célula Contable | Revisiones y clasificación contable general. |
| Célula de Nómina | Liquidaciones de sueldos y deducciones. |
| Célula de Cargas Sociales | Contribuciones patronales y obligaciones relacionadas con nómina. |

Cada agente tiene identidad, especialidad, órgano, estado operativo y capacidad de recibir tareas. El backend registra la ejecución y permite observar el estado desde el dashboard.

### 3.3 Motor de tareas

Una tarea entra por `agents.executeTask`. El motor realiza, en términos generales, estas etapas:

1. Valida la célula y los datos de entrada.
2. Verifica que `clientId` y `employeeId`, cuando se informan, existan realmente en los maestros EDV.
3. Recupera reglas y políticas del ADN Organizacional.
4. Ejecuta el cálculo determinístico en Python.
5. Consulta el contexto institucional para enriquecer el razonamiento.
6. Determina si el resultado requiere revisión humana.
7. Persiste la tarea, la ejecución, el resultado, las señales y la auditoría.
8. Deja la tarea aprobada, rechazada, completada o pendiente de aprobación según corresponda.

## 4. Cálculos implementados

### 4.1 Determinación de IVA

El motor Python calcula débito fiscal sobre ventas gravadas, crédito fiscal sobre compras y saldo del período. Las tasas se consultan desde reglas del ADN Organizacional cuando están disponibles; si no, utiliza parámetros demostrativos de respaldo.

### 4.2 Liquidación de sueldos

El motor calcula sueldo bruto, horas suplementarias, aportes jubilatorios, obra social, aporte convencional, deducciones totales y sueldo neto. También calcula contribuciones patronales y el total de cargas del empleador.

### 4.3 Cargas sociales

La célula de cargas sociales utiliza la liquidación salarial para determinar contribuciones patronales y parámetros laborales. Las reglas son configurables, pero los porcentajes iniciales son demostrativos y deben actualizarse con normativa vigente antes de utilizar EDV como sistema profesional de liquidación.

### 4.4 Motor Python

El archivo `server/python/engine.py` recibe JSON por entrada estándar y devuelve JSON por salida estándar. `server/pythonBridge.ts` inicia el proceso Python, envía la tarea y procesa la respuesta. Si Python no inicia o devuelve una respuesta inválida, el puente evita que el resultado se considere confiable y eleva el caso para revisión.

> Importante: una liquidación calculada por EDV no reemplaza la revisión de un profesional matriculado ni la validación normativa correspondiente.

## 5. ADN Organizacional y memoria

EDV administra reglas, políticas y workflows institucionales desde los routers `dna`, `documents` y `vectorSearch`. El ADN puede contener:

- reglas fiscales y laborales;
- políticas internas del estudio;
- criterios de aprobación;
- workflows operativos;
- documentos de referencia;
- parámetros de cálculo;
- historial y memoria de decisiones.

La tabla `edv_vector_memory` permite guardar fragmentos y sus embeddings en formato JSON para búsqueda semántica. La versión actual tiene una **memoria vectorial persistida dentro de la base relacional**. No equivale todavía a una instalación administrada de Qdrant, Pinecone, Weaviate o Chroma.

## 6. Aprobación humana y auditoría

Cuando una tarea supera el umbral de riesgo configurado, EDV la coloca en `pending_approval`. La cola HITL del dashboard permite revisar el nombre de la tarea, el riesgo, la justificación del agente, la fecha y el resultado determinístico.

El responsable puede:

- aprobar la tarea;
- rechazarla indicando un motivo;
- dejar la decisión pendiente;
- consultar la trazabilidad de la ejecución.

Las acciones de aprobación y rechazo se registran en auditoría y actualizan el estado de la tarea. Este flujo es una parte operativa real del backend, no un botón visual aislado.

## 7. Maestros de clientes y empleados

La ruta `/maestros` permite administrar la información base que utilizan los agentes.

### Clientes

Se pueden crear clientes individualmente, consultar por nombre o identificación fiscal, filtrar por condición fiscal y realizar importaciones masivas mediante CSV. La importación valida columnas, informa errores por línea y utiliza la identificación fiscal para evitar duplicados.

### Empleados

Se pueden asociar empleados a clientes, registrar nombre, identificación, sueldo base y convenio o CCT, buscar por nombre, identificación o CCT y cargar grandes volúmenes mediante CSV. Las cargas masivas son idempotentes cuando la identificación coincide.

### Integridad

Las tareas no deberían ejecutarse con referencias inexistentes: el motor valida que el cliente y el empleado seleccionados existan en la base. Esto evita calcular una liquidación sobre una entidad que solo existe en un texto libre del frontend.

## 8. Reportes PDF y Excel

EDV dispone de un router protegido de reportes y un servicio server-side basado en `pdfkit` y `exceljs`. Puede exportar cálculos de IVA y nómina cuando la tarea corresponde a un reporte habilitado y su estado permite compartirlo.

Los reportes pueden incluir identidad EDV, logotipo, razón social, CUIT y datos fiscales configurados. El resultado se entrega como archivo descargable PDF o XLSX desde el dashboard.

La certificación actual genera un hash y registra un certificado asociado al reporte. **Eso no es todavía una firma digital legal cualificada** ni reemplaza un certificado emitido por una autoridad certificante reconocida.

## 9. Rentabilidad por cliente

El dashboard incorpora el bloque **Rentabilidad por cliente**. La consulta obtiene clientes y facturas persistidas, calcula facturación, costo operativo estimado, margen y cantidad de comprobantes.

El gráfico permite:

- alternar entre margen y total facturado;
- ordenar los clientes según la métrica seleccionada;
- seleccionar un cliente;
- consultar facturación, costo, margen y cantidad de comprobantes;
- mostrar un estado vacío cuando no existen facturas.

La tasa de costo operativo se guarda por cliente en `edv_clients.operatingCostRate`, por lo que ya no depende únicamente de un porcentaje fijo global. El valor inicial es demostrativo y debe calibrarse con los costos reales del estudio.

## 10. Asistente conversacional

La ruta `/asistente` incluye EDV-AI. El profesional puede formular preguntas en lenguaje natural sobre reglas, políticas, criterios fiscales, procedimientos y memoria institucional. La respuesta se solicita al backend y se contextualiza con el ADN Organizacional.

El asistente debe tratarse como apoyo de consulta, no como autoridad normativa autónoma. Las respuestas críticas deben contrastarse con la fuente institucional y con el responsable profesional.

## 11. Notificaciones y canales externos

EDV cuenta con notificaciones internas y contratos para alertas de aprobación humana. El proyecto también tiene puntos de integración para propietario, push, correo, Telegram y pagos externos.

La diferencia importante es la siguiente: **tener el router o el contrato no significa que el canal externo ya esté conectado a una cuenta real**. Para operar con correo, Telegram, Stripe o Mercado Pago se necesitan credenciales, webhooks, secretos, verificación de firma de eventos y pruebas con cuentas reales o sandbox.

Asimismo, el endpoint actual de pagos conserva una denominación de prueba (`stripeWebhookMock`). Por eso la conciliación de pagos no debe considerarse producción lista hasta conectar una pasarela real y verificar eventos idempotentes de pago aprobado, rechazado, cancelado y reembolsado.

## 12. Base de datos y persistencia

El esquema Drizzle contempla, entre otras, estas tablas:

| Tabla | Información persistida |
|---|---|
| `users` | Usuarios y autenticación. |
| `agents` | Células especializadas y estados. |
| `tasks` | Tareas, estados, riesgo y decisiones HITL. |
| `task_executions` | Etapas y trazabilidad de ejecución. |
| `notifications` | Señales y alertas. |
| `audit_log` | Registro de acciones relevantes. |
| `organizational_dna_rules` | Reglas institucionales. |
| `organizational_dna_policies` | Políticas y criterios. |
| `organizational_dna_workflows` | Workflows organizacionales. |
| `edv_clients` | Clientes, CUIT, condición fiscal y costo operativo. |
| `edv_employees` | Empleados asociados a clientes. |
| `edv_invoices` | Facturas y estado de cobro. |
| `edv_certificates` | Hashes y estado de certificación. |
| `edv_vector_memory` | Fragmentos y embeddings institucionales. |

La información no vive únicamente en la interfaz: las operaciones importantes se guardan en la base y se recuperan mediante tRPC.

## 13. ¿Qué sucede si publicas el sitio?

Al publicar el checkpoint, EDV se convierte en una aplicación accesible desde una URL pública de Manus. El frontend se compila con Vite y el backend se empaqueta con esbuild. El proyecto tiene los scripts `build` y `start`, y la última validación ejecutó correctamente TypeScript, 24 pruebas automatizadas y el build de producción.

Por lo tanto, **sí, se publica como una aplicación funcional**, no como una captura de pantalla. Los usuarios podrán abrir la interfaz, autenticarse, consultar el dashboard, administrar maestros y utilizar los endpoints que estén correctamente configurados.

Pero hay condiciones importantes:

| Área | Estado al publicar | Condición necesaria |
|---|---|---|
| Frontend y navegación | Operativo | No requiere una acción especial adicional. |
| Backend tRPC | Operativo | Requiere que las variables del proyecto estén disponibles. |
| Base de datos | Operativo con migraciones | Debe existir `DATABASE_URL` y aplicarse el esquema correcto. |
| Autenticación | Integrada | Depende de la configuración OAuth del proyecto. |
| PDF/XLSX | Operativo | Requiere tareas y datos reales para generar archivos útiles. |
| Motor Python | Requiere validación de runtime | La aplicación ejecuta `python3`; producción debe garantizar que Python esté instalado. |
| ADN Organizacional | Operativo con datos persistidos | Deben cargarse reglas y políticas reales del estudio. |
| Firma digital legal | No completa | El hash no equivale a firma digital cualificada. |
| Correo/Telegram/push | Requiere credenciales | Deben conectarse proveedores o conectores reales. |
| Stripe/Mercado Pago | Integración preliminar | Falta configurar pasarela, secretos y webhooks productivos. |
| Base vectorial externa | No implementada | Actualmente se usa memoria vectorial en la base relacional. |
| Rentabilidad | Operativa con datos | Deben cargarse facturas, tasas y costos reales. |

## 14. Punto crítico: Python en publicación

El frontend y el backend Node están preparados para compilar. El cálculo, en cambio, llama a un proceso externo mediante `spawn("python3", ...)`. Eso significa que el entorno publicado debe incluir Python 3 y permitir la ejecución del script.

Como el proyecto no contiene actualmente un Dockerfile personalizado que garantice ese runtime, **no conviene asumir que todos los cálculos Python funcionarán en producción sin una prueba de publicación**. La solución robusta es incorporar un Dockerfile de producción con Python y Node, o separar el motor Python como servicio independiente y conectarlo mediante API segura.

Si Python no estuviera disponible, el puente devuelve un error controlado y eleva el caso para revisión, pero eso no es equivalente a tener el cálculo funcionando normalmente.

## 15. Qué significa que las pruebas pasen

Las 24 pruebas automatizadas validan contratos, cálculos, integración del motor Python, exportación, parser CSV, aprobación HITL, rentabilidad y estados vacíos. También se validaron TypeScript y el build de producción.

Eso demuestra que la aplicación compila y que los flujos cubiertos funcionan en un entorno controlado. **No significa que se hayan probado todas las cuentas fiscales reales, todas las normativas, las credenciales de terceros, el runtime Python de producción o la recepción de webhooks de cuentas externas.**

## 16. Conclusión profesional

EDV ya es un **prototipo funcional avanzado con backend, base de datos, agentes, cálculos, persistencia, controles humanos y módulos visuales reales**. No es solo una maqueta.

Para convertirlo en una plataforma productiva de un estudio contable, la siguiente etapa debe concentrarse en producción controlada: garantizar Python en el despliegue, cargar datos reales, revisar las reglas con un profesional, conectar correo y pagos mediante credenciales reales, implementar firma digital legal si se necesita, reemplazar la memoria vectorial relacional por un servicio vectorial dedicado si el volumen lo exige y probar todos los webhooks en sandbox antes de habilitar operaciones reales.
