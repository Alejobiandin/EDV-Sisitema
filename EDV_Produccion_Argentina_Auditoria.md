# Auditoría de Estado y Viabilidad Productiva — EDV (Argentina)

**Fecha:** Agosto de 2026  
**Autor:** Arquitectura y Seguridad EDV  
**Alcance:** Evaluación de brechas técnicas, normativas e infraestructurales para la operación autónoma y productiva en la República Argentina.

---

## 1. Resumen Ejecutivo

EDV ha superado con éxito la etapa de prototipo funcional y arquitectura multiagente cognitivo-determinística (7 órganos y 21 células), contando con motor híbrido (TypeScript + Python), persistencia relacional con Drizzle ORM, autenticación por roles (Partner vs. Cliente), pasarelas de pago homologadas (Stripe / Mercado Pago) y pruebas automatizadas (66 tests pasando).

Sin embargo, para cumplir con el objetivo de **reemplazo integral u operación autónoma de nivel corporativo** en un entorno real de producción legal y fiscal en Argentina, se identifican las siguientes brechas críticas y los requisitos técnicos necesarios para su cobertura definitiva.

---

## 2. Matriz de Brechas y Requisitos Productivos

| Módulo / Dominio | Estado Actual en EDV | Brecha Crítica para Producción | Requisito Técnico / Normativo para Operar |
| :--- | :--- | :--- | :--- |
| **Seguridad y Auditoría** | Registro básico de auditoría y control de roles (RBAC). | Falta política de retención de logs, cifrado en reposo para credenciales fiscales y monitoreo de intrusos. | Implementar cifrado AES-256 para claves privadas X.509, rotación de JWT, y registro inmutable de accesos sensibles. |
| **Respaldos y Recuperación** | Respaldo manual en JSON almacenado en S3. | Ausencia de respaldos automáticos programados, retención multi-tier y prueba documentada de restore. | Automatizar snapshot diario de base de datos MySQL/TiDB con retención de 30 días y checksums SHA-256. |
| **Contabilidad General** | Libro diario, asientos balanceados y balance de comprobación básico. | Falta Libro Mayor interactivo, balance de sumas y saldos por períodos cerrados y asientos automáticos de devengamiento. | Desarrollar motor de Libro Mayor con trazabilidad por cuenta imputable y cierres de ejercicio automáticos. |
| **Firma Digital (PAdES/TSA)** | Hash SHA-256 y token seguro simulado. | No utiliza un HSM, ni certificado X.509 real (PKCS#11/P12), ni estampa de tiempo RFC 3161 (TSA). | Integrar biblioteca de firma PDF bajo estándar PAdES-B-B / PAdES-T con sello de tiempo oficial autorizado. |
| **AFIP / ARCA (Facturación)** | Configuración visual, puntos de venta y WSFEv1 simulado. | Requiere certificados digitales (CRT/KEY) homologados reales y conexión HTTPS mTLS con web services AFIP. | Conectar cliente SOAP/REST mTLS con WSFEv1 en ambiente de producción y validación de CAE. |
| **Cargas Sociales (F.931)** | Cálculo estimativo de cargas (SIPA/OS) basado en porcentajes fijos. | Falta integración con Libro de Sueldos Digital (LSD) y cálculo paramétrico exacto por CCT 130/75. | Parametrizar alícuotas vigentes por convenio, aportes voluntarios, adicionales por antigüedad y presentación F.931. |

---

## 3. Conclusión y Plan de Adecuación

La arquitectura modular de EDV permite absorber estas exigencias sin rediseñar el núcleo. La estrategia aprobada consiste en endurecer progresivamente cada conector mediante validaciones criptográficas, esquemas relacionales estrictos y trazabilidad inmutable ante auditorías de organismos de control.
