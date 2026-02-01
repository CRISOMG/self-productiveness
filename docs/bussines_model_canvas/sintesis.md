# Síntesis del Business Model Canvas - Yourfocus

Esta síntesis extrae y organiza la información clave del chat de desarrollo del BMC para restructurar el documento final.

---

## 1. Propuesta de Valor (Value Propositions)

### Definición del Problema

- **Fatiga por decisión** y **sobrecarga de información** en analisis sistematicos de información por parte de profesionales del conocimiento
- Pérdida de ideas valiosas por falta de inmediatez en el registro y procesamiento de las mismas
- Necesidad de "prótesis cognitivas" para personas con déficit de atención, neurodivergentes
- Herramientas actuales (Notion, Todoist, Obsidian, etc) son "almacenes pasivos" que requieren mucho trabajo manual para su optimización

### Solución Única

> **El pensamiento condiciona la acción, la acción determina el comportamiento, el comportamiento repetido crea hábitos, los hábitos estructuran el carácter (la forma de pensar, ser y actuar del individuo) y el carácter marca el destino.**
>
> Todo eso mediado por la **atención consciente** o **lucidez**.
>
> _"No te elevas al nivel de tus metas, desciendes al nivel de tus sistemas."_

**Yourfocus Ecosystem** es un sistema de productividad "atómico" que:

- Automatiza la captura de ideas mediante **bitácoras de audio procesadas por IA**
- Implementa **Zettelkasten** y **Active Recall** para retención de conocimiento
- Garantiza que la información no solo se guarde, sino que se **retenga y convierta en acción**

### Diferencial Competitivo

- Elimina la fricción de entrada (voz en lugar de texto)
- Transforma "hablar 5 minutos" en "tareas organizadas y notas estructuradas"
- Convierte el conocimiento y experiencia en **know-how**/**Metodologia Personal** medible

---

## 2. Segmentos de Clientes (Customer Segments)

### Perfil Principal

1. **Knowledge Workers** - Profesionales del conocimiento con fatiga por decisión
2. **Neurodivergentes** - Requieren "prótesis cognitivas" para funciones ejecutivas (planificación, memoria)
3. **High-Performers** - Quieren externalizar memoria para resolver problemas complejos

### Nicho Prioritario

- **Desarrolladores Full Stack y Technical Leads** - Gestionan contextos complejos, necesitan Deep Work
- **Autodidactas y Creadores** - Consumen información y necesitan convertirla en acción
- **Freelancers y Solopreneurs** - Su ingreso depende de la ejecución impecable
- **Profesionales que ya probaron** Notion/Todoist y buscan un "Segundo Cerebro" real

---

## 3. Canales (Channels)

### Canales de Comunicación

| Canal                          | Propósito                                       |
| ------------------------------ | ----------------------------------------------- |
| **Twitter/X**                  | "Build in Public", comunidad Tech               |
| **Reddit/Discord/Hacker News** | Comunidades de nicho, consejos de productividad |
| **YouTube**                    | Tutoriales de flujo de trabajo, "Study with me" |
| **TikTok**                     | Contenido corto, hacks TDAH/Productividad       |
| **LinkedIn**                   | Enfoque B2B, credibilidad profesional           |

### Estrategia de Captación Actual

- **Pre-lanzamiento**: Waitlist (lista de espera)
- **Validación**: Entrevistas 1 a 1 con usuarios beta
- **SEO**: Contenido orgánico a largo plazo

---

## 4. Relaciones con Clientes (Customer Relationships)

### Tipos de Relación

1. **Servicios Automatizados (AI Agent)**
   - Núcleo de retención
   - "Accountability partner" disponible 24/7
   - Simula asistencia personal pero escalable

2. **Comunidad y Pertenencia ("Tribus de Enfoque")**
   - _Body Doubling_ y retos de Focus en Discord
   - Combate la soledad del trabajo profundo

3. **Co-creación (Build in Public)**
   - Early Adopters influyen en el roadmap
   - Relación de colaboración

4. **Autoservicio sin Fricción**
   - Timer y Tasks con interacción invisible

### Integración con el Modelo

- **Con Propuesta de Valor**: IA esencial para "active recall" sin esfuerzo manual
- **Con Canales**: "Build in Public" reduce CAC (Costo de Adquisición)
- **Con Ingresos**: IA justifica suscripción recurrente → aumenta LTV

---

## 5. Fuentes de Ingresos (Revenue Streams)

### Modelo de Negocio: SaaS Freemium

| Tier               | Precio  | Características                                                                                |
| ------------------ | ------- | ---------------------------------------------------------------------------------------------- |
| **Starter (Free)** | $0      | Timer + Tasks, 3 bitácoras/día, historial 7 días, 1 dispositivo                                |
| **Architect**      | $10/mes | Bitácoras ilimitadas, Gemini Flash + Pro, Active Recall, Zettelkasten Cloud, Multi-dispositivo |
| **Builder**        | $20/mes | Todo Architect + API Access (PAT), Webhooks, Rate Limits Altos, Early Access                   |

### Valor por el que Pagan

- **Paz mental y retención** de ideas
- **Automatización** y ahorro de tiempo
- **Infraestructura personalizada** (API/Webhooks) para desarrolladores

### Estrategias Adicionales

- **PPP (Paridad de Poder Adquisitivo)**: Descuentos por región (LatAm ~50%)
- **LTD (Lifetime Deal)**: 100 licencias a $150-$200 para Early Adopters
- **BYOK**: "Bring Your Own Key" para usuarios que quieran usar su API de Google

---

## 6. Recursos Clave (Key Resources)

### Stack Tecnológico

| Componente            | Tecnología                     | Propósito                           |
| --------------------- | ------------------------------ | ----------------------------------- |
| **Frontend**          | Nuxt (Vue.js)                  | Aplicación web/móvil                |
| **Backend/DB**        | Supabase (Postgres + pgvector) | Base de datos, Auth, Edge Functions |
| **IA**                | Gemini 1.5 Flash               | Velocidad y costo (tareas masivas)  |
| **IA**                | Gemini Pro                     | Razonamiento complejo (síntesis)    |
| **Embeddings**        | text-embedding-004             | Búsqueda semántica                  |
| **Hardware (Futuro)** | Rust + BLE                     | Timer físico                        |

### Propiedad Intelectual

- **Prompt Engineering**: System Prompts refinados que evitan alucinaciones
- **Arquitectura**: Diseño de base de datos vectorial para Zettelkasten

### Capital Humano

- **Founder Full Stack** con +4 años de experiencia en ecosistema JavaScript
- Formación autodidacta en **Platzi** (OKRs, Estrategia, Desarrollo)

---

## 7. Actividades Clave (Key Activities)

### Desarrollo y Producto

- **Ingeniería de IA (AI Tuning)**: Optimización de prompts y contexto RAG
- **Mantenimiento de Infraestructura**: Edge Functions, API, Webhooks
- **Optimización Vectorial**: Chunking de notas para embeddings precisos

### Crecimiento

- **"Build in Public"**: Documentar desarrollo en Twitter/X
- **Community Growth**: Mantener Discord activo

### Gestión

- **Administración Financiera Logística**: Flujo de caja Lemon Squeezy → Facebank

---

## 8. Socios Clave (Key Partnerships)

### Proveedores Tecnológicos

| Socio                | Rol                              | Criticidad |
| -------------------- | -------------------------------- | ---------- |
| **Google AI Studio** | Proveedor del "cerebro" (Gemini) | Alta       |
| **Supabase**         | Plataforma BaaS (DB, Auth, Edge) | Alta       |

### Socios Financieros

| Socio             | Rol                | Beneficio                                             |
| ----------------- | ------------------ | ----------------------------------------------------- |
| **Lemon Squeezy** | Merchant of Record | Gestiona impuestos globales (VAT), protección legal   |
| **Facebank**      | Custodia en USD    | Routing/Account number USA, protección de devaluación |

### Red de Pagos (Contexto Venezuela)

- **Binance P2P**: Liquidación a Bolívares (6.5% fee)
- **Bancamiga**: Cuenta en moneda local
- **Familiar en USA**: Respaldo y "Mesa de Cambio VIP"

---

## 9. Estructura de Costos (Cost Structure)

### Costos Fijos (Burn Rate)

| Servicio       | Costo/mes  |
| -------------- | ---------- |
| Supabase Pro   | $25.00     |
| Dominio/Vercel | ~$1.00     |
| **Total Fijo** | **$26.00** |

### ⚠️ Costos Variables por Usuario (DATOS REALES - Feb 2026)

> **CRÍTICO:** Basado en consumo real de API Key en Google AI Studio durante 28 días.

**Precios Gemini 3 (2026):**
| Modelo | Input (1M tokens) | Output (1M tokens) | Audio (1M tokens) |
| ------ | ----------------- | ------------------ | ----------------- |
| Flash | $0.50 | $3.00 | $1.00 |
| Pro | $2.00 - $4.00 | $12.00 - $18.00 | N/A |

**Consumo Real Medido:**
| Métrica | Valor |
| ------- | ----- |
| Período | 28 días |
| Costo Total | **$24.19** |
| Estimación/usuario | **$25 - $30/mes** |

### Costos de Transacción

| Etapa                 | Costo         |
| --------------------- | ------------- |
| Lemon Squeezy         | 5% + $0.50/tx |
| Liquidación (Binance) | ~6.5%         |

### Estrategia Híbrida de IA

- **Gemini Flash**: Tareas masivas (transcripción, clasificación) - Más económico
- **Gemini Pro**: Razonamiento profundo (síntesis semanal, tesis) - Más costoso
- **Context Caching**: Hasta 90% de ahorro en consultas repetitivas

---

## 📊 Análisis Financiero v2 (Actualizado Feb 2026)

### ⚠️ ALERTA: Los Precios Anteriores NO Son Viables

> **Problema:** Si el COGS (costo de venta) es **$25-$30/usuario**, vender a $10-$20 significa **operar a pérdida**.

### Unit Economics REALES (Power User)

| Concepto          | Precio Anterior ($10) | Realidad              |
| ----------------- | --------------------- | --------------------- |
| Ingreso           | $10.00                | $10.00                |
| Fee Lemon Squeezy | -$1.00                | -$1.00                |
| **Costo IA REAL** | ~~-$1.16~~            | **-$25.00**           |
| **Margen**        | ~~+$7.84 (78%)~~      | **-$16.00 (PÉRDIDA)** |

### 🚀 Pivot de Estrategia de Precios (Propuesta)

| Tier          | Precio Nuevo | Características                                           | Margen      |
| ------------- | ------------ | --------------------------------------------------------- | ----------- |
| **Starter**   | $0           | Uso MUY limitado (2 bitácoras/semana) O modelo **BYOK**   | N/A         |
| **Architect** | **$49/mes**  | Plan estándar profesional, cubre costo + margen           | ~30% (~$15) |
| **Builder**   | **$79/mes**  | API + Webhooks, para empresas/freelancers de alto nivel   | ~40% (~$30) |
| **BYOK**      | **$15/mes**  | Usuario trae su API Key de Google, solo paga por interfaz | ~90%        |

### Punto de Equilibrio (Precios Nuevos)

| Meta                      | Usuarios Necesarios      |
| ------------------------- | ------------------------ |
| Cubrir costos fijos ($26) | **2 usuarios Architect** |
| Generar $400 netos        | **~15-20 usuarios**      |

### Proyección 20 Usuarios (Architect $49)

| Concepto                       | Monto       |
| ------------------------------ | ----------- |
| MRR Bruto                      | $980.00     |
| Comisiones LS (~8%)            | -$78.40     |
| Ingreso en Facebank            | $901.60     |
| Costos Fijos                   | -$26.00     |
| Costos Variables IA (20 x $25) | -$500.00    |
| **Utilidad Neta USD**          | **$375.60** |
| Liquidación (6.5%)             | -$24.41     |
| **Efectivo Real en Anaco**     | **$351.19** |

---

## 🎯 Estrategia de Lanzamiento

### Waitlist Escalonada

1. **0-50 usuarios**: Acceso manual, feedback directo
2. **50-100 usuarios**: Sistema de referidos

### Justificación del Waitlist

- Control de costos variables de IA
- Creación de "escasez" y deseo
- Validación de Product-Market Fit
- Beta cerrada para depuración técnica

---

## 📝 Información Adicional

### El Proyecto como "Tesis"

- Cumple criterios de **tesis de ingeniería**: investigación, desarrollo, resolución de problema complejo
- Puede servir para exoneración de créditos o pasantías universitarias
- Genera un **portafolio de nivel Senior**

### Concepto de Acciones (Equity)

- Founder posee **100% de las acciones**
- Valoración por múltiplos: 3-8x facturación anual
- Sweat Equity: tiempo invertido = capital accionario
- Opción de **Carta de Intención** para inversionista ángel familiar

### Flujo de Liquidez Recomendado

```
Cliente → Lemon Squeezy (5%) → Facebank (ACH $0) →
├── Pago servidores (USD directo)
└── Liquidación → Binance (6.5%) → Bancamiga (Bs.)
```

---

## Métricas Clave (KPIs)

| Métrica          | Definición                 | Meta Inicial          |
| ---------------- | -------------------------- | --------------------- |
| **MRR**          | Ingreso Mensual Recurrente | $600 (50 usuarios)    |
| **LTV**          | Valor de vida del cliente  | -                     |
| **CAC**          | Costo de Adquisición       | ~$0 (Build in Public) |
| **Churn**        | Tasa de cancelación        | <5%                   |
| **Margen Bruto** | Post-costos directos       | >78%                  |
