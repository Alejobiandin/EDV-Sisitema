# Diseño del Organismo Digital Multiagente para Estudios Contables

## 1. Visión y Propósito del Sistema

El organismo digital no es un conjunto de herramientas aisladas ni un cuadro de mando estático; es una **arquitectura organizacional cognitiva** inspirada en sistemas biológicos donde cada agente funciona como una célula especializada con memoria institucional, reglas normativas y capacidad de ejecución autónoma bajo supervisión humana (`human-in-the-loop`).

Para un estudio contable profesional, el sistema reemplaza la ejecución manual fragmentada mediante cuatro órganos principales que coordinan la operación diaria:
- **Órgano Impositivo:** Gestión y control de vencimientos fiscales, liquidación de impuestos (IVA, Ingresos Brutos, Ganancias), interpretación de normativas AFIP/ARCA y validación de retenciones.
- **Órgano Contable:** Procesamiento de extractos bancarios, imputación contable automática, conciliación y emisión de balances preliminares.
- **Órgano de Liquidación de Sueldos:** Cálculo de haberes, aplicación de convenios colectivos de trabajo (CCT), horas extras, novedades, presentismo y conceptos remunerativos/no remunerativos.
- **Órgano de Cargas Sociales y Seguridad Social:** Determinación de aportes y contribuciones patronales, generación de declaraciones juradas (F.931) y control de libros de sueldos digitales.

---

## 2. Arquitectura de Células Agente Especializadas

Cada célula agente opera bajo un ciclo cognitivo estructurado:
1. **Recepción de Estímulo (Señal Nerviosa):** Entrada de un evento (ej. recepción de libro de sueldos o archivo de ventas).
2. **Consulta Genética (ADN Organizacional):** Consulta al vector store y base relacional de reglas institucionales, convenios y normativas vigentes.
3. **Razonamiento y Ejecución (Célula):** Invocación al modelo LLM integrado con instrucciones de rol específicas para procesar el cálculo, redacción o validación.
4. **Verificación y Autorregulación:** Autoevaluación del resultado contra restricciones normativas; si el riesgo o el monto superan el umbral establecido, se conmuta al estado de **aprobación humana (`human-in-the-loop`)**.
5. **Registro y Trazabilidad:** Asentamiento inmutable en la memoria institucional y auditoría del organismo.

---

## 3. Modelo de Datos para la Ejecución Multiagente

Se ampliará el esquema relacional para soportar:
- **Catálogo de Células Agente:** Registro de agentes con su órgano de adscripción, prompt de sistema, temperatura y estado de autonomía.
- **Workflows y Pasos de Ejecución:** Definición de secuencias multiagente (ej. *Workflow de Cierre Mensual: Recepción → Imputación Contable → Liquidación de Sueldos → Determinación Impositiva → Revisión Humana*).
- **Cola de Tareas y Señales:** Registro de ejecuciones asíncronas con reintentos, logs de razonamiento y estado de bloqueo por aprobación.
