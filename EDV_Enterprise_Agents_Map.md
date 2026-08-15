# EDV · Arquitectura de Sustitución Operativa y Mapa Integral de Agentes

## 1. Visión y alcance del modelo multiagente

La ambición de **EDV** no es operar como un simple asistente de oficina o un generador aislado de planillas, sino constituirse como una **organización digital autónoma** capaz de absorber la carga operativa, administrativa, fiscal y financiera de una empresa. El propósito central es que una estructura corporativa pueda delegar toda la ejecución rutinaria, repetitiva y sujeta a normativa en un equipo de agentes especializados, permitiendo que el plantel humano se reduzca al mínimo indispensable y se concentre exclusivamente en la dirección estratégica, el gobierno de excepciones, la relación comercial y la supervisión de alto nivel.

En este modelo, las personas ya no realizan tareas transaccionales (como cargar facturas, calcular retenciones, redactar asientos contables estándar o emitir recibos de sueldo), sino que actúan como **órganos directivos y supervisores de control (Human-in-the-Loop)**. Cada área de la empresa cuenta con un ecosistema celular de agentes especializados que colaboran entre sí, intercambian señales nerviosas, consultan el ADN Organizacional y resuelven de manera coordinada los flujos multitarea.

---

## 2. Mapa integral de órganos y células especializadas (Catálogo Completo EDV)

Para que EDV reemplace con éxito la operación corporativa, el sistema se divide en **7 Órganos Principales**, albergando un total de **21 Células Agente Especializadas**:

### Órgano I: Dirección y Coordinación Estratégica (The Executive Core)
1. **CEO-Agent (Célula de Orquestación General):** Coordina las prioridades macro de la empresa, distribuye subtareas entre órganos, evalúa cuellos de botella y decide cuándo elevar una excepción crítica a la dirección humana.
2. **DNA-Governor Agent (Célula de Custodia Institucional):** Administra el ADN Organizacional, indexa nuevas normativas, valida que los procedimientos sigan las políticas internas y actualiza los embeddings de la memoria vectorial.
3. **Audit & Compliance Agent (Célula de Auditoría y Cumplimiento):** Revisa de forma cruzada cada transacción, detecta desvíos operativos, previene riesgos de fraude y asegura la trazabilidad imgutable.

### Órgano II: Área Impositiva y Fiscal (Tax Intelligence)
4. **VAT & Sales Tax Agent (Célula de IVA y Tributos Indirectos):** Calcula débitos y créditos fiscales, procesa libros IVA compras/ventas y determina las posiciones mensuales.
5. **Corporate Income Tax Agent (Célula de Impuesto a las Ganancias):** Monitores anticipos, calcula la renta neta imponible corporativa, deduce amortizaciones y proyecta la liquidación anual.
6. **Withholding & Compliance Agent (Célula de Retenciones y Percepciones):** Controla padrones de AFIP/ARCA y jurisdicciones locales, calculando retenciones en origen para pagos a proveedores y cobros a clientes.

### Órgano III: Área Contable y Financiera (Accounting & Treasury)
7. **General Ledger Agent (Célula de Contabilidad y Asientos):** Registra automáticamente comprobantes, genera el libro diario y mayor, y clasifica transacciones según el plan de cuentas.
8. **Accounts Receivable Agent (Célula de Cobranzas y Cuentas Corrientes):** Realiza el seguimiento de facturas emitidas, emite alertas de morosidad, concilia cobros de pasarelas (Stripe/Mercado Pago) y actualiza estados de cuenta.
9. **Accounts Payable Agent (Célula de Proveedores y Pagos):** Valida facturas electrónicas de compras, coteja con órdenes de compra y programa los pagos según el flujo de caja disponible.
10. **Treasury & Cash Flow Agent (Célula de Tesorería y Caja):** Proyecta la liquidez a 30, 60 y 90 días, administra conciliaciones bancarias diarias y optimiza excedentes financieros.

### Órgano IV: Área de Capital Humano y Nómina (Payroll & HR)
11. **Payroll Calculation Agent (Célula de Liquidación de Haberes):** Calcula sueldos brutos, presentismo, antigüedad, horas suplementarias y deducciones de ley conforme a convenios colectivos.
12. **Social Charges & F931 Agent (Célula de Cargas Sociales y F.931):** Determina las contribuciones patronales a la seguridad social, obra social y sindicatos, generando la base para las declaraciones juradas mensuales.
13. **Personnel Administration Agent (Célula de Legajos y Novedades):** Administra altas tempranas, licencias, vacaciones, bajas y novedades de personal sincronizadas con el padrón de empleados.

### Órgano V: Área Comercial y Facturación (Revenue & Billing)
14. **Invoicing Agent (Célula de Emisión de Facturación):** Conecta con los servicios de factura electrónica (AFIP/ARCA o APIs fiscales), emite comprobantes A, B o C y genera notas de crédito o débito.
15. **Pricing & Fee Agent (Célula de Tarifas y Contratos):** Monitorea acuerdos comerciales con clientes, actualiza honorarios o precios según fórmulas indexadas y genera los cargos periódicos.

### Órgano VI: Área de Operaciones y Abastecimiento (Supply & Ops)
16. **Inventory & Stock Agent (Célula de Inventario y Activos):** Controla ingresos y salidas de mercadería, calcula valuaciones de stock y detecta puntos de reorden.
17. **Vendor Management Agent (Célula de Evaluación de Proveedores):** Califica el cumplimiento, tiempos de entrega y competitividad de precios de los proveedores habituales.

### Órgano VII: Área Legal y Contractual (Legal Operations)
18. **Contract Intelligence Agent (Célula de Análisis de Contratos):** Revisa contratos comerciales, identifica cláusulas de riesgo, plazos de vencimiento y obligaciones de cumplimiento.
19. **Regulatory Watch Agent (Célula de Vigilancia Normativa):** Analiza boletines oficiales y nuevas resoluciones fiscales o laborales para proponer actualizaciones automáticas al ADN Organizacional.

---

## 3. Modelo de delegación, dependencias y orquestación multiagente

Para que la empresa funcione de forma autónoma, las células no operan en silos aislados, sino mediante un **grafo de dependencias dinámico**:

- **Encadenamiento automático (Pipelines):** Cuando el *Accounts Receivable Agent* registra el cobro de un cliente mediante webhook de Stripe/Mercado Pago, dispara una señal al *General Ledger Agent* para asentar el cobro y al *Treasury Agent* para actualizar el flujo de caja.
- **Detección de anomalías y escalamiento:** Si el *VAT Agent* detecta una inconsistencia superior al umbral permitido frente a las compras del mes, la tarea se pausa, se clasifica como riesgo alto y se deriva a la cola de aprobación humana (**HITL**), notificando simultáneamente por correo, Telegram y push al responsable del área.
- **Autorregulación y memoria:** Cada célula aprende de las decisiones pasadas almacenadas en la memoria institucional, adaptando sus parámetros de cálculo y aplicando las políticas vigentes de la empresa.

---

## 4. Conclusión y siguiente paso en EDV

Con este diseño ampliado, EDV deja de ser un visor de impuestos básico y se consolida como el **sistema operativo total de la empresa**, capaz de absorber la carga de múltiples departamentos bajo la supervisión estratégica de un equipo humano reducido.
