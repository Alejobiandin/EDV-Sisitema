# EDV: Especificaciones técnicas de producción (ARCA/AFIP, Open Banking y Firma Digital)

Este documento detalla la arquitectura, los flujos criptográficos y las interfaces requeridas para conectar EDV con entornos productivos reales en América Latina y Argentina.

---

## 1. Integración Fiscal Oficial: ARCA / AFIP (Homologación y Producción)

### Arquitectura de Conectividad
* **Protocolo**: SOAP sobre HTTPS con TLS 1.2+ y validación estricta de certificados X.509 emitidos por la Autoridad Certificante oficial.
* **Autenticación (WSAA)**:
  1. Generación de un Ticket de Requerimiento de Acceso (TRA) firmado digitalmente con clave privada RSA (`.key`) y certificado (`.crt`/`.pfx`).
  2. Invocación al WebService de Autenticación y Autorización (WSAA) para obtener un token (`token`) y signo (`sign`) con vigencia de 12 horas.
* **Facturación Electrónica (WSFEv1)**:
  * Invocación al método `FECAESolicitar` pasando el punto de venta, tipo de comprobante (ej. Factura B 006), importes netos, IVA (21%, 10.5%) y CUIT del receptor.
  * Respuesta oficial con el Código de Autorización Electrónica (CAE), fecha de Vto del CAE y estado de aprobación.
* **Consulta de Padrón (A5 / A13)**:
  * Invocación a `getPersona` para validar denominación social, domicilio fiscal, estado de inscripción en IVA y Ganancias, y régimen de retenciones en línea.

### Módulo en EDV
* Servicio backend en `server/taxService.ts` parametrizable mediante entorno (`ARCA_HOMOLOGATION=true` o `false`).
* En modo homologación, simula la obtención del CAE y el intercambio SOAP con respuestas predecibles para pruebas sin riesgo fiscal.

---

## 2. Open Banking Automático (Pluggy / Belvo)

### Arquitectura de Conectividad
* **Agregadores certificados**: Integración con Pluggy o Belvo mediante API REST cifrada.
* **Flujo de Conectividad**:
  1. Creación de un token de acceso temporal (Connect Token) para el cliente/empresa.
  2. Apertura del widget embebido del proveedor donde el usuario final selecciona su banco (Galicia, Santander, BBVA, Macro, Mercado Pago) e ingresa su MFA / credenciales de forma cifrada (EDV jamás almacena credenciales bancarias).
  3. Recepción del `itemId` en el backend y almacenamiento del identificador de conexión cifrado en la tabla `bank_connections`.
* **Sincronización y Webhooks**:
  * Sincronización periódica o por webhook asíncrono (`TRANSACTION_CREATED`) recibido en el endpoint seguro `/api/webhooks/banking`.
  * Normalización automática por el `Treasury & Cash Flow Agent` e ingestión idempotente mediante `externalId`.

---

## 3. Firma Digital con Validez Legal (X.509 / PAdES / TSA)

### Arquitectura Criptográfica y Normativa
* **Estándar**: Firma electrónica avanzada y digital basada en PKI (Infraestructura de Clave Pública) conforme a la Ley 25.506 (Argentina) y eIDAS (Europa).
* **Formato**: PAdES (PDF Advanced Electronic Signatures) embebido en el documento PDF.
* **Sello de Tiempo (TSA - Time Stamping Authority)**:
  * Inclusión de un sello de tiempo criptográfico acreditado para garantizar la fecha y hora exacta de la firma del balance o certificación contable.
* **Flujo en EDV**:
  1. El `Financial Close & Controls Agent` genera el balance o informe contable en PDF.
  2. El Socio / CPN revisa y aprueba el documento en la pantalla de Aprobaciones (`/aprobaciones`).
  3. Se genera el hash SHA-256 del documento, se firma con el certificado del profesional (.pfx/.p12 o HSM delegado) y se registra la evidencia con ID de auditoría y sello TSA.

---

## 4. Gestión Multiempresa y Permisos por Organización

### Modelo de Datos
* Tabla `organizations`: Almacena el nombre y CUIT de cada empresa administrada por el estudio o corporación.
* Tabla `organization_members`: Asocia usuarios a organizaciones con roles específicos:
  * `owner`: Propietario de la organización.
  * `partner`: Socio / CPN con facultades de firma y aprobación.
  * `accountant`: Liquidador / contador junior con acceso a tareas y asientos.
  * `client_viewer`: Cliente final con acceso exclusivo de lectura a sus reportes y documentos.
