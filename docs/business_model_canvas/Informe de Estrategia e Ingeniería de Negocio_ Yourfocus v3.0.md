# **INFORME DE ESTRATEGIA E INGENIERÍA DE NEGOCIO: YOURFOCUS V3.0**

**Estatus:** Documento Maestro de Referencia

**Fecha:** 5 de febrero de 2026

**Preparado para:** Founder de Yourfocus

## **1\. INTRODUCCIÓN Y MARCO CONCEPTUAL**

Yourfocus se define como un **Sistema Mediador de la Atención** diseñado para catalizar el efecto compuesto en la vida del usuario. Su función técnica es la externalización del monólogo interno mediante bitácoras de voz, transformando el flujo de pensamiento abstracto en sistemas de ejecución estructurados (BPM Personal).

### **1.1. Filosofía de la "Consecuencia Inevitable"**

El proyecto se fundamenta en la premisa de que la salida de la pobreza y la excelencia profesional son resultados sistémicos. Yourfocus es la infraestructura digital que sostiene los hábitos necesarios para que estos hitos ocurran de manera inevitable.

## **2\. ANÁLISIS DE HARDWARE HUMANO Y MÉTRICAS (KPIs)**

El sistema no solo gestiona tareas, sino que mide el acondicionamiento biológico para el enfoque profundo (_Deep Work_).

- **KPI Primario:** El Pomodoro (bloques de 25-30 min).
  - **Nivel Operativo (4 Pomodoros):** Mantenimiento de rutina y supervivencia técnica.
  - **Nivel Estándar (8 Pomodoros):** Jornada de enfoque profesional.
  - **Nivel de Alto Rendimiento (16 Pomodoros):** Investigación y Desarrollo (R\&D) intensivo para proyectos de alta complejidad (Mecatrónica/Ingeniería).

## **3\. INGENIERÍA TÉCNICA Y OPTIMIZACIÓN DE COSTOS (EL PIVOTE)**

El mayor riesgo identificado es el **Costo Marginal Variable**. El uso de modelos multimodales para procesar audio crudo eleva el costo por usuario a **$25 \- $30 USD**, destruyendo la viabilidad financiera de una suscripción de **$12 USD**.

### **3.1. Arquitectura Híbrida**

Para proteger la utilidad neta, se propone el desacoplamiento de funciones:

1. **Transcripción (El Oído):** Utilizar **OpenAI Whisper** de forma local (WebAssembly en el navegador) o en servidores optimizados (GPU barata). Esto reduce el costo de transcripción de dólares a centavos.
2. **Estructuración (El Cerebro):** Enviar únicamente el **texto transcrito** a modelos de lenguaje (LLM) como Gemini Flash. Al procesar texto y no audio directo, el consumo de tokens cae drásticamente, permitiendo el uso de ventanas de contexto masivas de forma rentable.
3. **Persistencia:** Almacenamiento en Supabase con estrategias de _Context Caching_ para evitar re-procesar información estática del Zettelkasten del usuario.

## **4\. INGENIERÍA FINANCIERA Y VIABILIDAD**

El objetivo es alcanzar la soberanía financiera para cubrir:

1. **Estudios:** Carrera de Ingeniería Mecatrónica.
2. **Vivienda:** Apartamento propio (Presupuesto meta: $6k \- $15k USD).
3. **Bienestar:** Alimentación de alto rendimiento, gimnasio y salud.

### **4.1. Escenario de Utilidad Neta (Target V3.0)**

| Concepto                          | Valor Objetivo                      |
| :-------------------------------- | :---------------------------------- |
| **Precio de Venta (Promedio)**    | **$10.50 USD** (Mix entre $9 y $12) |
| **Costo de IA por Usuario**       | **$2.50 USD** (Post-Optimización)   |
| **Margen Bruto por Usuario**      | **$8.00 USD**                       |
| **Meta de Utilidad Neta Mensual** | **$2,000 USD**                      |
| **Usuarios Pagos Requeridos**     | **250 Usuarios**                    |

### **4.2. Desglose de Distribución de Ingresos**

- **75% Ahorro/Inversión:** Destinado a la compra del apartamento y capital para la universidad.
- **20% Operación/Sueldo Founder:** Cubre bienestar basal y mantenimiento del "Rider" (moto como seguro de flujo de caja).
- **5% Reinversión técnica:** Escalado de servidores y mejoras de API.

## **5\. MODELO DE NEGOCIO Y PLATAFORMA (BMC V3.0)**

Yourfocus transiciona de una herramienta individual a una **plataforma bidireccional**.

### **5.1. Yourfocus Milestones**

Cada hito alcanzado por el usuario genera un link compartible. Esto cumple una doble función:

- **Prueba de Seniority:** El usuario demuestra _cómo_ piensa y resuelve problemas (Portafolio real).
- **Marketing Orgánico:** Reduce el Costo de Adquisición de Clientes (CAC) a casi cero, ya que los usuarios atraen a otros compartiendo sus logros estructurados.

## **6\. HOJA DE RUTA DE EJECUCIÓN (PODC \+ KAIZEN)**

### **Fase 1: Planificación y Organización (Semanas 1-2)**

- Finalizar el pipeline de Whisper local para detener la hemorragia de costos de IA.
- Definir el "Sueldo de Excelencia" fijo para el founder.

### **Fase 2: Dirección y Ejecución (Semanas 3-8)**

- Lanzamiento de la versión Beta con enfoque en "Micro-bitácoras" (1-3 min).
- Implementación de la visualización de OKRs y Tareas automáticas.

### **Fase 3: Control y Mejora Continua (Kaizen)**

- Monitoreo estricto del margen de contribución por usuario.
- Gamificación del cumplimiento de Pomodoros para asegurar el éxito del usuario.

## **7\. CONCLUSIÓN**

La viabilidad de **Yourfocus** como empresa y proyecto de vida es **ALTA**, siempre y cuando se respete la disciplina del margen técnico. Con una base pequeña de **250 usuarios comprometidos**, el sistema es capaz de financiar la educación y el patrimonio del founder, cumpliendo su promesa de ser la "consecuencia inevitable" de un trabajo bien estructurado.

**"La ingeniería financiera protege la ingeniería de software."**
