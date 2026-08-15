# EDV: Diagnóstico integral y brechas para operar en producción real

Fecha de auditoría: 2026-08-14. Autor: **Manus AI**.

## 1. Estado actual: Lo que EDV ya es y resuelve

A diferencia de una simple maqueta estática o de un prototipo de interfaz sin backend, EDV cuenta con una arquitectura de ingeniería robusta y funcional que incluye:

- **Estructura de Base de Datos y ORM**: 20 tablas relacionales en MySQL/TiDB gestionadas mediante Drizzle ORM, cubriendo usuarios, agentes, métricas, tareas, ejecuciones, documentos, auditoría, notificaciones, preferencias, clientes, empleados, facturas, conexiones bancarias, transacciones y reglas del ADN Organizacional.
- **Motor Híbrido de Razonamiento y Cálculo**: Conexión entre un orquestador de agentes en TypeScript (`agentEngine.ts`) y un motor determinístico en Python (`engine.py`) especializado en cálculos fiscales y salariales precisos.
- **Red Multiagente Organizacional**: 7 Órganos y 21 células especializadas con vistas dedicadas de monitoreo en tiempo real (`/organos`).
- **Supervisión Humana (HITL)**: Cola de aprobación para tareas de alto riesgo, complementada con alertas multicanal (correo, push, Telegram).
- **Gestión de Clientes y Empleados**: Módulos individuales y cargas masivas validadas por CSV tanto para padrones de clientes como para nóminas laborales con hidratación de variables.
- **Memoria Institucional y RAG**: Asistente conversacional (EDV-AI) con contexto del ADN, red vectorial interactiva y reglas parametrizadas para jurisdicciones y convenios (como el CCT 130/75).
- **Servicios Financieros y de Cobranza**: Pasarelas de pago seguras con webhooks firmados criptográficamente (Stripe y Mercado Pago) mediante HMAC-SHA256, lógica de idempotencia, reportes de rentabilidad por cliente y conciliación de feeds bancarios.
- **Reportes Profesionales**: Exportación server-side de liquidaciones e IVA a formatos PDF y Excel personalizados con logotipo y datos fiscales.
- **Pruebas Automatizadas**: 28 pruebas unitarias y de integración pasando exitosamente con Vitest y compilación de producción validada.

---

## 2. Lo que le falta a EDV para operar en una empresa real (Brechas de producción)

Para que EDV deje de operar con datos simulados o entornos de prueba y comience a gestionar la vida económica, contable y fiscal de una empresa real, es necesario cerrar las siguientes brechas operativas, normativas e integrales:

### A. Integraciones reales con organismos fiscales (APIs gubernamentales)
- **Brecha**: Actualmente EDV procesa cálculos y emite facturas lógicas, pero no está conectado de manera nativa y productiva a los webservices de AFIP/ARCA (Argentina), SUNAT, DIAN u otros entes fiscales de la región para la obtención de CUITs, padrones en línea (Padrón Web), emisión de comprobantes electrónicos con CAE (Código de Autorización Electrónica) y validación de regímenes de información.
- **Solución requerida**: Reemplazar los adaptadores simulados de facturación y padrones por clientes SOAP/REST oficiales utilizando certificados digitales (cert.pfx / key) provistos por la empresa contribuyente.

### B. Conectividad bancaria abierta (Open Banking / PSD2 / API Propias)
- **Brecha**: El módulo de banca soporta carga manual de feeds CSV y conciliación idempotente, pero carece de webhooks y APIs automáticas en tiempo real con las entidades financieras de la región (Galicia, Santander, BBVA, Macro, Mercado Pago Business, etc.) o agregadores de Open Banking (Pluggy, Belvo).
- **Solución requerida**: Integrar conectores API certificados con entidades financieras o proveedores de Open Banking para sincronizar movimientos automáticamente cada hora.

### C. Firma digital y certificación legal de balances / DDJJ
- **Brecha**: EDV genera hashes de auditoría y certificados internos, pero no cuenta con un módulo de firma digital con token físico (Cryptographic Service Provider / PKCS#11) ni integración nativa con autoridades certificadoras homologadas (como Renaper, Token digital o AFIP) para que un Contador Público Nacional (CPN) firme digitalmente los balances y certificaciones contables con validez legal.
- **Solución requerida**: Incorporar soporte para firma de documentos PDF con certificados X.509 de e-Firma o tokens homologados.

### D. Seguridad perimetral empresarial y RBAC avanzado (Control de Accesos Basado en Roles)
- **Brecha**: La plataforma utiliza autenticación OAuth de Manus y roles binarios (`user` / `admin`). Una empresa real requiere permisos granulares por estudio contable o corporación: perfiles de Asistente Junior, Liquidador Senior, Auditor Fiscal, Socio Responsable (CPN) y Cliente Final (con acceso limitado a sus propias facturas y reportes).
- **Solución requerida**: Extender el esquema de usuarios y roles en la base de datos para restringir acciones por órgano, cliente y nivel de criticidad.

### E. Actualización dinámica y automática de escalas salariales y tributarias
- **Brecha**: Las reglas del CCT 130/75 y las tablas impositivas están cargadas en el ADN, pero sus escalas numéricas (básicos de convenio, topes, alícuotas de cargas sociales, mínimos no imponibles) dependen de la carga manual de circulares o actualizaciones periódicas.
- **Solución requerida**: Configurar un servicio automatizado (cron institucional) conectado a fuentes oficiales de cámaras empresariales y sindicatos para sugerir actualizaciones de parámetros al *DNA-Governor Agent*.

---

## 3. Matriz comparativa: Estado actual vs. Producción total

| Componente | Estado actual en EDV | Requisito para Producción Real | Complejidad de Implementación |
|---|---|---|---|
| **Cálculos y Motor** | Híbrido (TS + Python determinístico) | Validado con 28 pruebas; requiere ajuste fino por convenio particular. | Baja (Ya operativo) |
| **Facturación Electrónica** | Simulación y registro interno de facturas | Homologación y producción con WebServices de AFIP/ARCA (CAE). | Media-Alta (Requiere certificados fiscales) |
| **Banca y Conciliación** | Importación CSV y conciliación idempotente | Conexión a Open Banking (Pluggy/Belvo) o APIs bancarias directas. | Media (Requiere credenciales y tokens) |
| **Nómina y Cargas** | Cálculo parametrizado por empleado y convenio | Integración con Libro de Sueldos Digital (AFIP/ARCA) y SICOSS. | Alta (Normativa compleja y cambiante) |
| **Seguridad y Permisos**| Autenticación OAuth y rol admin/user | RBAC corporativo multiempresa, auditoría de accesos y cifrado de secretos. | Media |
| **Firma Digital** | Hashes internos de auditoría y trazabilidad | Firma X.509 con validez legal para dictámenes y balances. | Alta (Infraestructura criptográfica) |

---

## 4. Conclusión recomendada

EDV **no es una maqueta**: es una plataforma funcional de arquitectura organizacional cognitiva con backend, base de datos, agentes y flujos reales.

Para que una empresa o estudio contable la ponga en marcha hoy, los pasos siguientes no son rediseñar el sistema, sino:
1. Conectar las credenciales fiscales reales (facturación electrónica y padrones).
2. Definir los clientes y empleados reales de la cartera.
3. Configurar las cuentas bancarias o pasarelas de pago definitivas.
4. Asignar los roles institucionales del personal humano que supervisará los circuitos HITL.
