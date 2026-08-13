# Especificación Técnica: Núcleo Multiagente, Impuestos, Sueldos y Human-in-the-Loop

## 1. Introducción y Propósito
Este documento detalla la arquitectura de ejecución real que convertirá a la plataforma en un organismo multiagente funcional para estudios contables. A diferencia del andamiaje previo, este núcleo implementa:
1. **El Motor de Agentes:** Una infraestructura server-side que invoca modelos de lenguaje integrados (`invokeLLM`) inyectando el ADN Organizacional relevante (reglas fiscales, convenios de trabajo).
2. **Célula del Área Impositiva:** Agente especializado en calcular posiciones fiscales (IVA, Ingresos Brutos) y detectar desvíos normativos.
3. **Célula de Liquidación de Sueldos y Cargas Sociales:** Motor determinístico + cognitivo para calcular haberes netos, aportes, contribuciones patronales (F.931) y aplicar topes de CCT.
4. **Flujo de Aprobación Humana (Human-in-the-Loop):** Mecanismo donde el agente pausa la ejecución si el monto, la complejidad o la incertidumbre normativo superan el umbral, generando una alerta de aprobación pendiente para el contador responsable.

---

## 2. Flujo de Ejecución del Agente Impositivo y de Sueldos

```
[ Solicitud de Usuario / Tarea ]
               │
               ▼
   { Orquestador de Tareas }
               │
               ├─► Consulta de ADN Organizacional (Reglas / Políticas RAG)
               │
               ▼
   { Invocación LLM server-side (invokeLLM) }
               │
               ├─► Cálculo determinístico (Sueldos / Cargas Sociales)
               │
               ▼
   ¿Requiere Aprobación Humana (Human-in-the-Loop)?
       ├── SÍ ──► Estado: pending_approval (Alerta enviada al panel)
       └── NO   ──► Estado: completed (Resultado inyectado en Trazabilidad)
```

---

## 3. Contratos de Datos y Acciones
- `agents.executeTask`: Endpoint tRPC para disparar una tarea de agente (impositiva, sueldos, contable).
- `tasks.approve`: Endpoint tRPC para que el usuario apruebe o rechace el resultado generado por el agente bajo revisión humana.
