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
