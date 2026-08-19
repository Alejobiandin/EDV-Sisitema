# EDV — Operación, homologación y puesta en producción

## Propósito

EDV es una plataforma organizacional cognitiva multiagente para estudios contables y estructuras administrativas. Combina agentes especializados, reglas del ADN Organizacional, cálculos determinísticos y revisión humana. El sistema puede automatizar preparación, validación, clasificación, conciliación y generación de reportes; no debe presentar, firmar, pagar ni presentar información ante terceros sin una autorización explícita y una conexión externa válida.

> **Principio de seguridad:** un resultado calculado por EDV no equivale a una presentación fiscal, un pago bancario, una firma legal ni una emisión real de comprobante.

## Flujo general de una tarea

| Etapa        | Responsable principal               | Control EDV                                              | Resultado                       |
| ------------ | ----------------------------------- | -------------------------------------------------------- | ------------------------------- |
| Captura      | Usuario, importador o integración   | Validación de estructura, duplicados y organización      | Datos normalizados              |
| Cálculo      | Motor Python y célula especializada | Reglas del ADN Organizacional y trazabilidad de entradas | Resultado determinístico        |
| Coordinación | Red multiagente                     | Órgano, etapas, riesgo y handoff                         | Plan de trabajo                 |
| Razonamiento | Agente cognitivo                    | Justificación estructurada; ausencia de ADN se informa   | Explicación técnica             |
| Control      | Validadores internos                | CUIT, PEM, CSV, equilibrio y reglas de negocio           | Aprobado, advertido o rechazado |
| HITL         | Socio, CPN o responsable autorizado | Aprobación, rechazo, comentario y auditoría              | Decisión humana registrada      |
| Acto externo | Proveedor autorizado                | Certificado, token, permiso y respuesta verificable      | Acción real o bloqueo explícito |

## Estados de las integraciones

EDV utiliza estados diferenciados para evitar que una simulación parezca una conexión productiva.

| Estado         | Significado                                                               | ¿Se puede reintentar?                                              |
| -------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `online`       | El motor interno o una integración configurada responde correctamente.    | No es necesario, salvo una nueva lectura.                          |
| `homologation` | La integración está preparada para pruebas controladas.                   | Sí, dentro del entorno de prueba.                                  |
| `blocked`      | Faltan certificado, token, contrato, relación de servicio o autorización. | No; primero debe completarse la acción externa.                    |
| `degraded`     | La falla parece transitoria, por ejemplo una respuesta 429 o 5xx.         | Sí, con backoff de 5, 30 y 120 segundos.                           |
| `failed`       | Falló una validación o una configuración.                                 | Sí, después de corregir el dato; máximo tres intentos automáticos. |

La consola **Preparación productiva** muestra el estado, la última lectura, la descripción de la política y la opción de evaluar el reintento. La evaluación de política no inventa una respuesta del proveedor: clasifica el estado conocido y determina la próxima acción segura.

## Preflight

El preflight se ejecuta desde `Preparación productiva → Preflight` y realiza controles internos antes de una prueba de homologación. Valida el dígito verificador del CUIT, el envoltorio PEM del certificado, los encabezados mínimos del extracto bancario y el equilibrio entre Debe y Haber.

El resultado puede ser **aprobado**, **advertencia** o **para revisar**. Una advertencia, como un certificado todavía ausente, no se transforma en una credencial válida. El estado `readyForHomologation` significa únicamente que no existen fallas estructurales en los datos ingresados.

## Coordinación de agentes y HITL

La coordinación determinística asigna cada tipo de tarea a un órgano y una secuencia de etapas. Las tareas impositivas, de liquidación de sueldos y de cargas sociales se consideran de riesgo alto porque pueden producir consecuencias fiscales o laborales. Las revisiones contables son de riesgo medio. La acción externa y la ausencia del ADN Organizacional elevan el caso a revisión humana.

El agente puede preparar cálculos, explicaciones, controles, reportes y handoffs. No puede ejecutar silenciosamente una presentación, pago, firma legal o emisión productiva. La tarea conserva `organizationId`, plan de coordinación, riesgo, justificación y estado de aprobación en la auditoría.

## Multiempresa y RBAC

Las mutaciones sensibles exigen una organización explícita. El rol global `admin` tiene capacidad de soporte; el rol global `partner` puede gestionar la cartera profesional; los usuarios con rol limitado deben tener una membresía en `organization_members`. Los roles `owner` y `partner` pueden administrar miembros; `accountant` puede modificar datos operativos permitidos; `client_viewer` solo puede consultar lo que su organización comparte.

Clientes, facturas y tareas tienen `organization_id`. Antes de operar sobre una empresa, EDV comprueba pertenencia, rol y correspondencia entre cliente, empleado, factura y organización de la tarea. Una referencia cruzada inválida se rechaza antes de escribir datos.

## Backup y recuperación

La pestaña **Resiliencia** muestra la política declarada de retención, RPO y RTO, ejecuta un simulacro de recuperación y verifica un manifiesto mediante SHA-256. El simulacro confirma que el manifiesto puede reconstruirse sin alteraciones y deja claro si el backup físico administrado de la base depende todavía de la política del hosting.

El manifiesto no reemplaza una copia física de la base de datos. Para producción, el responsable debe habilitar una política administrada de backup, probar restauraciones periódicas y documentar quién puede solicitar una recuperación.

## Acciones externas que no debe ejecutar EDV por sí solo

| Acto externo              | Requisito del usuario                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| ARCA/AFIP                 | Certificado X.509, clave privada, relación de servicio WSAA/WSFEv1 y autorización de producción. |
| Open Banking/Interbanking | Proveedor seleccionado, contrato y autorización de cuentas o pagos.                              |
| Firma y TSA               | Prestador de confianza, certificado del firmante y aceptación de validez legal.                  |
| Correo transaccional      | Proveedor SMTP/API, dominio y política de rebotes.                                               |
| Pagos                     | Cuenta, credenciales, webhook firmado y aprobación de cada operación sensible.                   |
| Datos iniciales           | Clientes, empleados, saldos, convenios, responsables y reglas institucionales reales.            |
| Publicación               | Revisión de aceptación, dominio, visibilidad y políticas de hosting.                             |

## Verificación técnica

La verificación local recomendada es:

```bash
pnpm exec tsc --noEmit
pnpm vitest run
```

La suite cubre reglas determinísticas, agentes, RBAC, integraciones, preflight, recuperación, estados externos, producción y flujos de interfaz. Los controles de pantalla no sustituyen la aceptación profesional de resultados fiscales, contables o laborales.

## Convención para futuras integraciones

Toda nueva integración debe implementar cuatro capas: configuración segura de credenciales, cliente de transporte con timeout y reintentos, adaptador de normalización y procedimiento de aprobación/auditoría. El modo debe ser explícito (`homologation`, `production` o `blocked`) y cualquier respuesta simulada debe estar etiquetada como tal. Nunca se deben almacenar claves privadas en el código, en fixtures, en logs ni en la base de datos sin cifrado y control de acceso.

## Procedimiento ante fallas

Cuando un conector devuelve `blocked`, EDV no reintenta indefinidamente: muestra el requisito externo faltante y mantiene la operación en estado preparado. Cuando devuelve `degraded`, se calcula un backoff determinístico de 5, 30 y 120 segundos y el usuario puede evaluar el siguiente intento desde la consola. Cuando devuelve `failed`, el sistema conserva el detalle para corregirlo antes de volver a ejecutar.

Ante una inconsistencia de organización, EDV rechaza la lectura o mutación antes de insertar datos y registra la decisión en la auditoría. Ante una falla de validación preflight, el lote no debe avanzar a homologación. Ante una restauración, el simulacro de manifiesto no se considera una restauración física: debe verificarse también la política de backup del proveedor de hosting.

## Criterios de aceptación antes del pase externo

| Control       | Criterio mínimo                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Organización  | La empresa seleccionada coincide con el registro, la tarea, la factura, el certificado y la membresía del usuario.                     |
| Preflight     | CUIT, PEM, CSV y balance contable no tienen fallas bloqueantes.                                                                        |
| Integraciones | El modo aparece como `homologation`, `prepared` o `blocked`; nunca se muestra como productivo sin respuesta verificable del proveedor. |
| HITL          | Toda presentación, pago, firma legal, emisión o lote laboral sensible permanece en aprobación humana.                                  |
| Resiliencia   | El manifiesto tiene checksum válido y la política de backup físico está identificada como interna o externa.                           |
| Auditoría     | La acción, usuario, organización, resultado, modo y motivo quedan registrados.                                                         |

## Estado de esta versión interna

Esta documentación acompaña la consolidación técnica de EDV Enterprise v7.x. El número exacto de pruebas se informa en el resultado de la suite ejecutada; la compilación TypeScript debe permanecer limpia antes de crear un checkpoint. Ningún número de prueba implica que una conexión externa esté autorizada o que un resultado fiscal constituya una presentación legal.
