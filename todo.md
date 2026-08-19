# Proyecto TODO - Núcleo Multiagente Contable Cognitivo

- [x] Fase 1: Auditar estado actual y semilla de ADN organizacional con reglas contables, impositivas y de sueldos
- [x] Fase 2: Diseñar la estructura de órganos y células agente especializadas (Área Impositiva, Área Contable, Liquidación de Sueldos, Cargas Sociales)
- [x] Fase 3: Integrar el motor de razonamiento LLM consultando la memoria institucional basada en ADN Organizacional (RAG contextual)
- [x] Fase 4: Implementar el motor de orquestación y el sistema de señales nerviosas para flujos multiagente autónomos
- [x] Fase 5: Conectar la ejecución de los agentes al dashboard en tiempo real, trazabilidad, auditoría y aprobaciones `human-in-the-loop`
- [x] Fase 6: Ejecutar y verificar un caso de uso end-to-end (ej. simulación de liquidación de sueldos y cálculo impositivo con validación normativa)
- [x] Fase 7: Validar con pruebas automatizadas, guardar checkpoint y entregar al usuario
- [x] Corregir y tipar el motor de agentes con el esquema Drizzle real y salida LLM estructurada
- [x] Implementar `agents.executeTask` para disparar tareas impositivas, salariales y de cargas sociales
- [x] Agregar contrato de aprobación/rechazo de tareas de alto riesgo
- [x] Mostrar panel HITL con detalle, aprobación, rechazo y actualización de estados
- [x] Sembrar ADN Organizacional inicial para reglas fiscales, contables y laborales parametrizables
- [x] Verificar el flujo end-to-end interactivo con una tarea persistida, aprobación humana y refresco posterior del dashboard
- [x] Escribir y ejecutar pruebas Vitest del motor y del flujo HITL
- [x] Guardar checkpoint de la implementación funcional y documentar límites normativos

> Nota de alcance: los porcentajes y umbrales de cálculo incluidos en esta versión son parámetros demostrativos configurables; no constituyen liquidación legal válida sin validación profesional y actualización normativa.
- [x] Agregar exportación de reportes de IVA y salarios a PDF y Excel, con endpoints protegidos, descargas desde dashboard y pruebas de generación
- [x] Agregar módulo visual EDV de clientes y empleados con alta individual, carga masiva CSV validada y precarga en tareas de declaraciones juradas
- [x] Conectar clientId y employeeId al motor EDV para hidratar tareas desde los maestros persistidos
- [x] Agregar importación masiva validada de clientes mediante CSV
- [x] Mostrar campos precargados y bloquear ejecuciones con referencias de maestros inválidas o faltantes
- [x] Corregir la mutación de importación masiva de clientes en ClientRegistry.tsx usando hooks de nivel superior y estado React
- [x] Hacer que executeCognitiveAgentTask valide estrictamente IDs de clientes y empleados existentes antes de continuar
- [x] Hacer que executeCognitiveAgentTask lance error explícito ante clientId o employeeId inexistentes con prueba Vitest asociada
- [x] Añadir prueba Vitest para verificar que executeCognitiveAgentTask rechaza IDs inválidos de clientes y empleados
- [x] Añadir prueba Vitest para verificar que executeCognitiveAgentTask rechaza employeeId inválidos
- [x] Ejecutar pnpm check && pnpm test para validar el nuevo test de employeeId inválido
- [x] Añadir gráfico interactivo de rentabilidad por cliente al panel principal, conectado a facturas persistidas y con pruebas
- [x] Agregar prueba Vitest de agregación de rentabilidad con clientes y facturas persistidas
- [x] Agregar prueba Vitest para ordenamiento, cambio de métrica y estado vacío del gráfico de rentabilidad
- [x] Ajustar el cálculo de rentabilidad para soportar costos operativos diferenciados y probar órdenes distintos entre margen y facturación
- [x] Conectar costos operativos diferenciados a una fuente persistida de EDV para el cálculo real del dashboard
- [x] Agregar prueba Vitest de dashboard.summary con costos diferenciados en la ruta real
- [x] Implementar servicio de webhooks seguros, firmados e idempotentes para Stripe y Mercado Pago con pruebas unitarias en webhookService.test.ts
- [x] Diseñar el mapa integral de 7 órganos y 21 células agente especializadas para cubrir la operación contable, fiscal, financiera, de recursos humanos y comercial de una empresa en EDV (registrado en EDV_Enterprise_Agents_Map.md)
- [x] Crear vistas dedicadas por órgano con métricas, tareas, alertas y agentes activos
- [x] Ampliar el catálogo de agentes EDV desde las 4 células actuales hacia una red especializada por área
- [x] Agregar reglas del ADN con convenio, jurisdicción, período, vigencia y prioridad
- [x] Implementar conexión segura a feeds bancarios y conciliación idempotente
- [x] Probar escenarios completos por órgano y documentar conexiones externas requeridas

- [x] Crear flujo visual seguro de conexión Open Banking con selección de banco, autorización y estados de sincronización simulados
- [x] Implementar panel de control RBAC con menús y accesos diferenciados para Socio/CPN y Cliente Final
- [x] Diseñar pantalla de aprobación documental con vista de balance, firma digital simulada y feedback auditable
- [x] Agregar estado de error y recuperación en OpenBanking.tsx para fallos de banking.createConnection
- [x] Aplicar RBAC real al layout y rutas usando el rol de sesión
- [x] Aplicar enforcement backend para RBAC en banca, aprobaciones y firma, con pruebas de autorización por rol
- [x] Agregar pruebas de integración por órgano y documentar evidencia de cada flujo representativo
- [x] Añadir pruebas backend reales de autorización RBAC para banca, aprobación y firma por rol
- [x] Agregar siete escenarios de integración representativos, uno por órgano, con entradas, salidas y dependencias documentadas
- [x] Ampliar EDV_Integration_Coverage.md con el mapeo de cada escenario y su resultado esperado
- [x] Implementar siete pruebas de integración funcionales, una por órgano, con entradas y salidas verificables
- [x] Enlazar cada escenario declarativo de shared/organScenarios.ts a una prueba funcional concreta
- [x] Implementar siete pruebas de integración reales invocando routers o servicios representativos de cada órgano
- [x] Enlazar cada escenario declarativo con código integrado del órgano correspondiente y verificar salidas observables
- [x] Vincular shared/organScenarios.ts con las siete pruebas de routers reales
- [x] Asertar que cada escenario declarativo produce una salida observable desde su router o servicio asociado

- [x] Registrar notificaciones persistentes cuando se genere o exporte un reporte gerencial
- [x] Mostrar centro visual de notificaciones para socios con estados de lectura
- [x] Integrar botones de exportación con feedback de notificación y pruebas
- [x] Ajustar el encabezado del reporte gerencial para apilar botones PDF/Excel en móvil y evitar overflow
- [x] Registrar una notificación también al generar o consultar un reporte gerencial
- [x] Invalidar y refrescar inmediatamente las notificaciones después de exportar
- [x] Agregar cobertura de integración para visibilidad inmediata del aviso post-exportación
- [x] Agregar una prueba de integración/UI que exporte el reporte gerencial y verifique el aviso visible inmediatamente
- [x] Cubrir el flujo frontend exportMutation.onSuccess más invalidación de notifications.list
- [x] Agregar prueba de integración/UI que renderice TaxConfig, dispare exportación y verifique la notificación visible
- [x] Configurar entorno de test DOM y mocks tRPC para el flujo visual completo

- [x] Fase 1: Auditar estado actual y dependencias para seguridad, backups, contabilidad y núcleo argentino
- [x] Fase 2: Diseñar esquemas de base de datos para auditoría, seguridad, libro diario, balances, F.931 y vencimientos
- [x] Fase 3: Implementar servicios de seguridad empresarial, auditoría de accesos, respaldos y monitoreo de salud del sistema
- [x] Fase 4: Desarrollar el motor de contabilidad general, libro mayor, balance de sumas y saldos, y estados financieros (Estado de Situación Patrimonial y Estado de Resultados)
- [x] Fase 5: Integrar el servicio de firma digital con soporte PAdES y estampa de tiempo (TSA) para certificaciones y balances
- [x] Fase 6: Implementar el núcleo argentino productivo (sincronización ARCA/AFIP, liquidación de F.931 con CCT 130/75, control de vencimientos fiscales y emisión de facturación electrónica con CAE)
- [x] Fase 7: Escribir pruebas unitarias y de integración Vitest para todos los módulos nuevos y validar la compilación y despliegue local

- [x] Fase 1: Auditar routers, modelos y componentes para vencimientos, banca y reportes contables
- [x] Fase 2: Diseñar contratos tRPC y lógica de emparejamiento bancario automático e importación de extractos
- [x] Fase 3: Crear el panel interactivo de vencimientos y alertas AFIP con filtros y estados de cumplimiento
- [x] Fase 4: Implementar importación de extractos bancarios y emparejamiento automático con facturas e ingresos
- [x] Fase 5: Ampliar `exportService.ts` y el router de reportes para exportar Estado de Situación Patrimonial, Estado de Resultados y Libro Mayor a PDF y Excel con logotipo y metadatos institucionales
- [x] Fase 6: Escribir pruebas unitarias y de integración para las nuevas funcionalidades y verificar la compilación y tests (68 pruebas pasando)

- [x] Fase 1: Auditar módulos existentes de banca, vencimientos, estados financieros y firma digital
- [x] Fase 2: Diseñar contratos para parseo CSV de extractos, umbrales de alerta fiscal y lote PAdES masivo
- [x] Fase 3: Implementar importación masiva de extractos bancarios en formato CSV con validación e inserción idempotente
- [x] Fase 4: Implementar sistema de alertas visuales en el panel para advertir sobre vencimientos fiscales próximos (próximos 7 días)
- [x] Fase 5: Implementar función de firma digital masiva de estados financieros con trazabilidad individual y registro de auditoría
- [x] Fase 6: Escribir pruebas unitarias y de integración para las nuevas funcionalidades y verificar compilación y tests (68 pruebas pasando)

- [x] Fase 1: Auditar banca, firma digital y panel de vencimientos actuales
- [x] Fase 2: Diseñar modelos de plantillas CSV, contrato de validación de firmas y filtros de vencimientos
- [x] Fase 3: Implementar plantillas CSV configurables con mapeo dinámico de columnas (Galicia, Santander, BBVA, Macro)
- [x] Fase 4: Implementar visor interactivo de firmas digitales con inspección de huella SHA-256, TSA y validez legal
- [x] Fase 5: Implementar filtros avanzados y búsqueda en el panel de vencimientos fiscales por estado, impuesto y CUIT
- [x] Fase 6: Escribir pruebas unitarias y de integración y verificar compilación y tests (70 pruebas pasando)

- [x] Fase 1: Auditar exportaciones fiscales, cadena de auditoría y panel de vencimientos actuales
- [x] Fase 2: Diseñar contratos TXT para aplicativos AFIP, verificación de integridad y calendario fiscal
- [x] Fase 3: Implementar exportación de reportes fiscales a TXT de posición fija / delimitado compatible con aplicativos AFIP (SICOSS / SICRE)
- [x] Fase 4: Implementar dashboard de auditoría criptográfica para verificar la integridad histórica de asientos y balances firmados
- [x] Fase 5: Implementar calendario interactivo de vencimientos fiscales en el panel de control
- [x] Fase 6: Escribir pruebas unitarias y de integración y verificar compilación y tests (71 pruebas pasando)

- [x] Fase 1: Auditar configuración AFIP, datos bancarios históricos, vencimientos y calendario existente
- [x] Fase 2: Diseñar controles de secretos, modelo de flujo de caja y estados visuales para calendario fiscal
- [x] Fase 3: Implementar panel seguro de credenciales y certificados X.509/RSA para Web Services AFIP con encriptación y prueba de conexión
- [x] Fase 4: Implementar módulo de análisis predictivo de flujo de caja basado en ingresos conciliados y pasivos fiscales
- [x] Fase 5: Implementar estados visuales completos en el calendario fiscal (pendiente, presentado, pagado, vencido) con filtros por color y badges
- [x] Fase 6: Escribir pruebas unitarias e integración y verificar compilación y tests (72 pruebas pasando)

- [x] Fase 1: Auditar dashboard, certificados AFIP y calendario interactivo actuales
- [x] Fase 2: Diseñar estados de riesgo de liquidez, reglas de expiración de certificados X.509 y modal de acciones rápidas
- [x] Fase 3: Implementar widget de riesgo de liquidez en el dashboard principal contrastando flujos conciliados y pasivos fiscales
- [x] Fase 4: Implementar validación de certificados AFIP con cálculo de días hasta expiración y alertas visuales por colores
- [x] Fase 5: Implementar modal interactivo en el calendario fiscal con acciones rápidas auditadas (marcar pagado, generar reporte)
- [x] Fase 6: Escribir pruebas unitarias y de integración y verificar compilación y tests (73 pruebas pasando)

- [x] Fase 1: Auditar modal fiscal, datos históricos de liquidez y exportaciones PDF existentes
- [x] Fase 2: Diseñar contrato de VEP, métricas de tendencia mensual y especificación del PDF de flujo de caja
- [x] Fase 3: Implementar generación automatizada de VEP con referencia de pago y registro de auditoría en el modal fiscal
- [x] Fase 4: Implementar gráfico interactivo de tendencia histórica de liquidez mensual en el dashboard principal
- [x] Fase 5: Implementar exportación a PDF del reporte detallado de flujo de caja y proyección de liquidez
- [x] Fase 6: Escribir pruebas unitarias y de integración y verificar compilación y tests (74 pruebas pasando)

- [x] Fase 1: Auditar VEP, credenciales, correo y gráfico de liquidez; definir dependencias externas
- [x] Fase 2: Diseñar contrato de pago Interbanking, modelo de escenarios de caja y flujo de envío de correos
- [x] Fase 3: Implementar pasarela segura de pago de VEP con Interbanking y confirmación humana
- [x] Fase 4: Implementar simulador interactivo de escenarios de ingresos y gastos en la tendencia de liquidez
- [x] Fase 5: Implementar envío automático por correo electrónico de comprobantes VEP a los responsables financieros
- [x] Fase 6: Escribir pruebas unitarias y de integración y verificar compilación y tests (75 pruebas pasando)

- [x] Fase 1: Auditar correo, escenarios, exportaciones y pagos Interbanking existentes
- [x] Fase 2: Diseñar modelos de plantillas de correo, escenarios persistidos y estados de conciliación Interbanking
- [x] Fase 3: Implementar editor visual y persistencia de plantillas de correo electrónico institucionales
- [x] Fase 4: Implementar guardado de escenarios de simulación y exportación comparativa a Excel (XLSX)
- [x] Fase 5: Implementar vista detallada de historial y estado de conciliación de pagos por Interbanking
- [x] Fase 6: Escribir pruebas unitarias e integración y verificar compilación y tests (76 pruebas pasando)

- [x] Fase 1: Auditar correo, escenarios y conciliación bancaria/Interbanking actuales
- [x] Fase 2: Diseñar eventos de entrega de correo, modelo de superposición de escenarios y reglas de emparejamiento de débitos
- [x] Fase 3: Implementar registro visual de entrega y apertura de correos con estado en tiempo real
- [x] Fase 4: Implementar superposición comparativa de múltiples escenarios de simulación en el gráfico de liquidez
- [x] Fase 5: Implementar función de emparejamiento automático entre débitos bancarios importados y pagos Interbanking
- [x] Fase 6: Escribir pruebas unitarias y de integración y verificar compilación y tests (77 pruebas pasando)

- [x] Fase 1: Auditar gráfico comparativo y registro de correos actuales
- [x] Fase 2: Diseñar especificación de tooltips numéricos y filtros de entrega de correo
- [x] Fase 3: Implementar tooltips interactivos con diferencias exactas entre escenarios superpuestos
- [x] Fase 4: Implementar filtros rápidos en el registro de correos para rebotados y no abiertos
- [x] Fase 5: Escribir pruebas unitarias e integración y verificar compilación y tests (78 pruebas pasando)

- [x] Fase 1: Auditar gráfico, registro de correos y dashboard actuales
- [x] Fase 2: Diseñar especificación de exportación PDF de gráficos, reenvío masivo y umbral de rebotes
- [x] Fase 3: Implementar exportación PDF del gráfico comparativo de liquidez con escenarios superpuestos
- [x] Fase 4: Implementar acción de reenvío masivo controlado para correos rebotados o no abiertos
- [x] Fase 5: Implementar indicador visual de alerta en el dashboard por rebotes críticos de correos
- [x] Fase 6: Escribir pruebas unitarias e integración y verificar compilación y tests (79 pruebas pasando)

- [x] Fase 1: Revisar exportador laboral y punto de validación previo a AFIP
- [x] Fase 2: Analizar requisitos técnicos de validación del Libro de Sueldos Digital (LSD)
- [x] Fase 3: Diseñar el motor de pre-validación sintáctica, semántica y cruzada de liquidaciones
- [x] Fase 4: Entregar la propuesta de arquitectura de validación automática e informe técnico

- [x] Fase 1: Auditar el exportador LSD, firma PAdES/TSA, RBAC y pantallas existentes
- [x] Fase 2: Diseñar el esquema de reglas AFIP y contratos de errores por línea y columna
- [x] Fase 3: Implementar motor TypeScript de validación dinámica del TXT
- [x] Fase 4: Implementar panel lateral de reglas y consola interactiva de errores
- [x] Fase 5: Implementar aprobación, descarga TXT sin errores y firma masiva PAdES/TSA
- [x] Fase 6: Escribir pruebas unitarias e integración y verificar compilación y tests (80 pruebas pasando)

- [x] Fase 1: Auditar validación LSD, firma masiva, persistencia y consola visual actuales
- [x] Fase 2: Diseñar historial de lotes, métricas circulares y modelo seguro de edición TXT
- [x] Fase 3: Implementar historial buscable y descargable de lotes laborales firmados
- [x] Fase 4: Implementar gráfico circular de reglas aprobadas y rechazadas
- [x] Fase 5: Implementar edición en línea del TXT con revalidación y control de versiones
- [x] Fase 6: Escribir pruebas unitarias e integración y verificar compilación y tests (80 pruebas pasando)

- [x] Fase 1: Auditar gráfico circular, consola de errores e historial de lotes actuales
- [x] Fase 2: Diseñar interacción regla-error y paquete ZIP seguro por período fiscal
- [x] Fase 3: Implementar filtrado de consola al seleccionar segmentos del gráfico
- [x] Fase 4: Implementar descarga masiva ZIP de TXT y certificados del período
- [x] Fase 5: Validar seguridad, permisos, integridad del ZIP, pruebas, compilación y checkpoint (81 pruebas pasando)
