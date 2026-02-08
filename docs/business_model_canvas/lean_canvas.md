# 🎯 LEAN CANVAS — YOURFOCUS v3.0

> **Sistema de Prótesis Cognitiva para el Enfoque Profundo**
>
> _Versión:_ 3.0 (Arquitectura Híbrida & Soberanía Financiera)  
> _Última actualización:_ 2026-02-07

---

## 📋 RESUMEN VISUAL

![alt text](image-1.png)
![alt text](./image.png)

---

## 1️⃣ PROBLEMA

hiper informacion de la industria de los profesionales del conocimiento, desgaste/fatiga por desicion y analisis critico y sistematico de la informacion.
friccion y difuminacion en las herramientas de registro y gestion.
falta de interoperatibilidad entre herramientas.
disfuncion ejecutiva y paralisis por analisis en personas neurodivergentes y con fatiga cronica.

### Problemas Top 3 del usuario objetivo:

| #   | Problema                                                                                           | Impacto |
| --- | -------------------------------------------------------------------------------------------------- | ------- |
| 1   | **Sobrecarga cognitiva** — El monólogo interno no se externaliza, causando parálisis y ansiedad    | Alto    |
| 2   | **Brecha ejecución-idea** — Las ideas se quedan en la cabeza sin convertirse en tareas accionables | Alto    |
| 3   | **Fragmentación de herramientas** — Usar múltiples apps (notas, tareas, timers) diluye el enfoque  | Medio   |

### Alternativas existentes actuales:

- Notion + Toggl + Journaling manual
- Apps de Pomodoro genéricas (sin contexto)
- Grabadoras de voz + transcripción manual

---

## 2️⃣ SEGMENTO DE CLIENTES

### Early Adopters (Foco inicial):

| Perfil                           | Características                             | Pain Point Principal                       |
| -------------------------------- | ------------------------------------------- | ------------------------------------------ |
| **Desarrolladores autodidactas** | Aprenden solos, trabajan remoto, LATAM      | Mantener disciplina sin estructura externa |
| **Profesionales en transición**  | Cambiando de carrera, estudiando ingeniería | Necesitan demostrar cómo piensan           |
| **Founders técnicos**            | Proyectos personales, recursos limitados    | Maximizar output con tiempo fragmentado    |

### Total Addressable Market / Serviceable Addressable Market / Serviceable Obtainable Market

- **TAM:** Mercado global de productividad personal (~$102B)
- **SAM:** Desarrolladores + profesionales tech LATAM (~$500M)
- **SOM:** 250-1,000 usuarios pagos (Año 1: $2k-$10k MRR)

---

## 3️⃣ PROPUESTA DE VALOR ÚNICA (UVP)

> ### 💡 **"kaizen based active knowledge management"**
>
> ### 💡 **"Transforma tu monólogo interno en sistemas de ejecución"**

**Fórmula High-Level:**

```
[Bitácora de Voz] + [IA Estructuradora] + [Pomodoro Integrado] = [Tareas + OKRs + Timeline Automático]
```

### Diferenciadores clave:

1. **Externalización del pensamiento** — No es journaling, es operacionalización (Rubber Ducking)
2. **Contexto persistente** — La IA conoce tu Zettelkasten personal y puede ayudarte a conectar ideas y tareas.
3. **Métricas de rendimiento cognitivo** — Pomodoros como KPI de salud mental y productividad.

---

## 4️⃣ SOLUCIÓN

### Features MVP (Core):

| Feature                     | Descripción                                 | Estado          |
| --------------------------- | ------------------------------------------- | --------------- |
| **Bitácoras de voz**        | Grabación y transcripción con Whisper       | ✅ Implementado |
| **Estructuración IA**       | Extracción de tareas, OKRs, insights        | ✅ Implementado |
| **Pomodoro integrado**      | Timer con estados: Focus, Break, Long Break | ✅ Implementado |
| **Sistema de Tags**         | Organización y filtrado de tareas           | ✅ Implementado |
| **Milestones compartibles** | Links de prueba de trabajo                  | 🔄 En progreso  |

### Arquitectura Técnica (Pipeline "Malacate"):

```
[Audio PWA] → [Whisper WASM/Server] → [Texto] → [Gemini Flash] → [JSON Estructurado] → [Supabase]
```

---

## 5️⃣ CANALES

### Canales de Adquisición:

| Canal                                 | Tipo              | CAC Esperado |
| ------------------------------------- | ----------------- | ------------ |
| **Milestones compartibles**           | Orgánico/Viral    | ~$0          |
| **Twitter/X Tech**                    | Orgánico          | ~$0          |
| **Dev communities (Reddit, Discord)** | Orgánico          | ~$0          |
| **Contenido técnico (blog/videos)**   | Content Marketing | ~$5-10       |

### Canales de Distribución:

- **PWA Web** (primario)
- **Extensión browser** (futuro)

---

## 6️⃣ FLUJOS DE INGRESOS

### Modelo de Pricing:

| Plan       | Precio      | Features                                          |
| ---------- | ----------- | ------------------------------------------------- |
| **Básico** | $9 USD/mes  | Bitácoras limitadas, Pomodoros                    |
| **Pro**    | $12 USD/mes | Bitácoras ilimitadas, Context Caching, Milestones |
| **Anual**  | $99 USD/año | Pro + 2 meses gratis                              |

### Unit Economics (Target):

| Métrica               | Valor               |
| --------------------- | ------------------- |
| Precio promedio       | $10.50 USD          |
| COGS por usuario      | $4.15 USD           |
| **Margen bruto**      | **$8.00 USD (59%)** |
| Usuarios para $2k MRR | 250                 |

---

## 7️⃣ ESTRUCTURA DE COSTOS

### Costos Variables (por usuario):

| Concepto                  | Antes (v2) | Después (v3) |
| ------------------------- | ---------- | ------------ |
| IA Audio (transcripción)  | $25.00     | $0.50        |
| IA Texto (estructuración) | $2.00      | $1.50        |
| Comisiones MoR/P2P        | $0.00      | $1.65        |
| **COGS Total**            | **$28.00** | **$4.15**    |

### Costos Fijos:

| Concepto         | Estimado/mes |
| ---------------- | ------------ |
| Supabase (infra) | ~$25-50      |
| Dominio/hosting  | ~$10         |
| Herramientas dev | ~$0-30       |

### Stack de Tesorería (Venezuela-specific):

- **Recaudación:** Lemon Squeezy (MoR)
- **Offshore:** Facebank International (Puerto Rico)
- **Liquidez local:** Binance P2P → VES
- **Efectivo USD:** Meru/MoneyGram

---

## 8️⃣ MÉTRICAS CLAVE

### North Star Metric:

> **Pomodoros completados por usuario activo por semana**

### Métricas de Salud (KPIs):

| Categoría          | Métrica                           | Target     |
| ------------------ | --------------------------------- | ---------- |
| **Activación**     | % usuarios con 1ª bitácora en 24h | >60%       |
| **Engagement**     | Pomodoros/día promedio            | 4-8        |
| **Retención**      | Retención M1                      | >40%       |
| **Revenue**        | MRR                               | $2,000 USD |
| **Unit Economics** | LTV/CAC                           | >3x        |

---

## 9️⃣ VENTAJA INJUSTA

### ¿Por qué no pueden copiarnos fácilmente?

| Ventaja                      | Descripción                                                         |
| ---------------------------- | ------------------------------------------------------------------- |
| **Pipeline "Malacate"**      | Arquitectura híbrida Whisper+LLM propietaria con costos 85% menores |
| **Context Caching personal** | El sistema aprende el Zettelkasten único del usuario                |
| **First-mover en nicho**     | Productividad para devs LATAM con problemas financieros             |
| **Skin in the game**         | El founder usa Yourfocus para construir Yourfocus                   |

personalizacion, usa tu imagen y estilo.

---

## 🎯 HITOS DE VALIDACIÓN

### Fase Actual: **MVP → Product-Market Fit**

| Hito                               | Criterio de Éxito  | Estado |
| ---------------------------------- | ------------------ | ------ |
| **H1: Pipeline Técnico**           | COGS < $5/usuario  | ✅     |
| **H2: Primeros 10 usuarios pagos** | Revenue > $100 MRR | 🔄     |
| **H3: Retención validada**         | M1 retention > 40% | ⏳     |
| **H4: 250 usuarios**               | $2,000 MRR         | ⏳     |
| **H5: Formalización LLC**          | MRR > $10,000      | ⏳     |

---

## 📝 NOTAS Y DECISIONES PENDIENTES

- [ ] Definir estrategia de launch en communities (Twitter, Reddit, Discord)
- [ ] Implementar sistema de Milestones compartibles
- [ ] Configurar Lemon Squeezy + Facebank
- [ ] Validar pricing con early adopters

---

_"La ingeniería financiera protege la ingeniería de software."_
