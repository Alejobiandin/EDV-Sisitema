# EDV: Especificación de Arquitectura y Requisitos para Producción

Este documento detalla la arquitectura técnica, los flujos de integración, los proveedores recomendados y los requisitos de credenciales para llevar EDV desde su estado actual con motor determinístico y simulación lógica hasta una plataforma conectada a entornos productivos reales.

---

## 1. Módulo de APIs Fiscales Oficiales (AFIP / ARCA / SUNAT / DIAN)

### Objetivo
Permitir que el **Invoicing Agent** y el **VAT & Sales Tax Agent** emitan comprobantes fiscales electrónicos reales con CAE (Código de Autorización Electrónica) y consulten padrones de contribuyentes directamente en los web services de los organismos fiscales.

### Arquitectura y Proveedores
- **Protocolo**: SOAP sobre HTTPS (WebServices de AFIP/ARCA: `wswhomologacion` para pruebas y `wsfe` para producción; homologación equivalente en SUNAT y DIAN).
- **Autenticación (WSAA)**: El sistema genera un Ticket de Requerimiento de Acceso (TRA), lo firma digitalmente utilizando la clave privada del contribuyente (`.key`) y el certificado X.509 (`.crt` o `.pfx`) emitido por el portal fiscal, y solicita un token de autorización (Token y Sign) con vigencia de 12 horas.
- **Modo de Seguridad**: Las credenciales de certificados no se exponen en el código; se almacenan cifradas en la bóveda de secretos de EDV y se inyectan en tiempo de ejecución.

### Requisitos de Credenciales (Inputs del Usuario)
1. **CUIT / RUC de la Empresa Emisora** (`TAX_ID`).
2. **Certificado Digital X.509** (`CERT_FILE_BASE64`).
3. **Clave Privada RSA** (`KEY_FILE_BASE64`).
4. **Punto de Venta Autorizado** (`POS_NUMBER`).
5. **Entorno de Conexión** (`HOMOLOGATION_MODE`: true/false).

---

## 2. Módulo de Open Banking Automático (Pluggy / Belvo / APIs Directas)

### Objetivo
Sustituir o complementar la carga manual de feeds CSV en el órgano financiero mediante la sincronización automática y segura de cuentas bancarias y pasarelas de pago.

### Arquitectura y Proveedores
- **Proveedor recomendado**: **Pluggy** o **Belvo** (agregadores Open Banking para América Latina), que normalizan las credenciales de conexión bancaria, manejo de MFA (autenticación de doble factor) y webhooks transaccionales en tiempo real.
- **Flujo de Conexión (Widget)**: El usuario abre el conector bancario en EDV, selecciona su institución financiera (ej. Santander, Galicia, BBVA, Mercado Pago), ingresa sus credenciales mediante un widget cifrado de extremo a extremo proporcionado por el agregador, y este emite un `ItemId`.
- **Sincronización Asíncrona (Webhook)**: El agregador notifica mediante un webhook HMAC firmado cuando hay nuevos movimientos. El **Treasury & Cash Flow Agent** los descarga de forma idempotente y los deja disponibles para el **Accounts Receivable Agent** y la conciliación bancaria.

### Requisitos de Credenciales (Inputs del Usuario)
1. **API Key del Agregador (Pluggy/Belvo)** (`OPEN_BANKING_CLIENT_ID` y `CLIENT_SECRET`).
2. **URL de Webhook configurada** para recibir notificaciones de transacciones nuevas.

---

## 3. Módulo de Firma Digital y Certificación Legal (PKCS#11 / Tokens X.509)

### Objetivo
Dotar de validez legal a los balances, certificaciones contables y reportes emitidos por el estudio contable mediante la firma digital de un Contador Público Nacional (CPN) o representante legal.

### Arquitectura y Proveedores
- **Estándar de Firma**: Criptografía asimétrica X.509 aplicada a documentos PDF (formato PAdES - PDF Advanced Electronic Signatures).
- **Mecanismo**: Mediante un servicio de agente local seguro (Agent Bridge en la máquina del CPN con token USB/SmartCard) o integración con pasarelas de firma en la nube (como Camerfirma, DocuSign, o Autoridades Certificadoras locales homologadas).
- **Flujo en EDV**: Cuando el **Financial Close & Controls Agent** completa el balance o reporte y el socio responsable lo aprueba en el circuito HITL, EDV genera el PDF estructurado, calcula su hash SHA-256, invoca el servicio de firma digital adjuntando el sello de tiempo (Timestamping Authority - TSA) y almacena el documento firmado en S3 con trazabilidad inmutable en la tabla de auditoría.

### Requisitos de Credenciales (Inputs del Usuario)
1. **Certificado de Firma Digital del Profesional (.pfx / .p12 o acceso a Token Hardware)**.
2. **Contraseña de Desencriptación del Contenedor de Firma** (almacenada temporalmente en memoria volátil durante la firma).

---

## 4. Módulo de Roles y Permisos Granulares (RBAC Multiempresa)

### Objetivo
Sustituir el control de acceso binario (`user` / `admin`) por una arquitectura de seguridad basada en roles empresariales y permisos por órgano, garantizando segregación de funciones (SoD).

### Matriz de Roles Propuesta

| Rol en EDV | Permisos y Alcance | Órganos Accesibles | Acciones Permitidas |
|---|---|---|---|
| **System Admin** | Acceso total al sistema | Todos | Configuración, altas de empresas, gestión de secretos, despliegue. |
| **Partner / CPN (Socio)** | Dirección del estudio / corporación | Todos | Aprobación HITL de alto riesgo, firma digital, visión financiera global. |
| **Tax Specialist (Liquidador Fiscal)** | Área Impositiva y Contable | Órgano II y III | Cálculo de IVA, ganancias, retenciones y ajustes impositivos. |
| **Payroll Specialist (Liquidador Sueldos)** | Capital Humano | Órgano IV | Carga de novedades, liquidación de haberes, F.931. |
| **Auditor / Compliance** | Auditoría y Control | Órgano I (Auditoría) y todos en lectura | Revisión de logs, desvíos y alertas de fraude. |
| **Client Viewer (Cliente Final)** | Solo su propia entidad | Facturación y reportes propios | Consulta de facturas emitidas, estado de cuenta y descarga de reportes. |

### Implementación en Base de Drizzle
- Extensión de la tabla `users` o creación de una tabla relacional `user_roles` con alcance por `company_id` (multitenancy).
- Procedimientos tRPC protegidos con validación explícita del rol (`ctx.user.role` y permisos específicos por módulo).
