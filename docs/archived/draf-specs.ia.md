# 🚀 Documentación de Proyecto: Plataforma de Productividad Estratégica (Pomodoro + OKR)

## 1. Briefing Ejecutivo (Portfolio & Producto)
**Propuesta:** Desarrollo de un "Sistema Operativo Personal" que evoluciona la técnica Pomodoro integrándola con marcos estratégicos (OKR, Ikigai).
**Objetivo del Producto:** Alinear la ejecución táctica (minuto a minuto) con la visión a largo plazo, midiendo la "Coherencia" entre lo planificado y lo ejecutado.
**Objetivo Profesional:** Demostración de capacidades *Senior* en arquitectura de software (Nuxt 3), integración de sistemas (API-First) y diseño de producto orientado a datos.

---

## 2. Requerimientos de Negocio (BR) - Los "Por Qué"

|     ID    | Concepto | Definición |
|:---|:---|:-----|
| **BR-01** | **Cualificación del Tiempo** | No basta con medir duración. Se debe medir **Foco y Satisfacción** para correlacionar esfuerzo con bienestar. |
| **BR-02** | **Auditoría de Coherencia** | El sistema debe calcular la desviación entre la intención (OKR Planificado) y la acción (Pomodoro Real). |
| **BR-03** | **Estandarización** | No se permite "trabajo fantasma". Todo Pomodoro debe estar vinculado a un Objetivo o Iniciativa. |
| **BR-04** | **Arquitectura Portátil** | El Frontend debe ser capaz de exportar sus componentes principales a entornos externos (Extensiones, PWA) sin depender del framework base (Nuxt). |

---

## 3. Lógica y Reglas del Negocio (Business Rules)

### 📊 Cálculo de Coherencia (RN-COH)
La métrica principal del sistema se rige por:
> **Fórmula:** `Puntaje Coherencia = (Tiempo Real Pomodoros / Tiempo Planificado OKR) * 100`

* **Verde (Alta):** ≥ 90%
* **Amarillo (Aceptable):** 50% - 89%
* **Rojo (Baja):** < 50% (Alerta de desalineación)
* **Restricción:** Los Pomodoros sin `OKR_ID` (tiempo basura) se excluyen del cálculo positivo.

### 📝 Bitácora Obligatoria (RN-CUAL)
* Al finalizar un timer, la UI se **bloquea**.
* El usuario **debe** ingresar:
    1.  Nivel de Foco (1-5).
    2.  Nivel de Satisfacción (1-5).
    3.  Texto reflexivo (Mínimo 50 caracteres).

---

## 4. Requerimientos Funcionales (RF) - El "Qué"

### 🎯 Módulo de OKRs (Gestión)
* **RF-OKR-01:** CRUD completo de Objetivos.
* **RF-OKR-02:** Vinculación obligatoria a Misión/Visión.
* **RF-OKR-04:** Campo obligatorio de **Tiempo Planificado (Horas)** (Vital para la fórmula de coherencia).
* **RF-OKR-10:** Bloqueo de edición de "Tiempo Planificado" si ya existen registros de tiempo asociados (Integridad de datos).

### ⏱️ Módulo Timer Pomodoro (Ejecución)
* **RF-POM-01:** Selector de OKR activo obligatorio antes de iniciar.
* **RF-POM-08:** Modal de "Bitácora de Cualificación" al llegar el contador a 00:00.
* **RF-POM-10:** Generación de `TimeLog` con estructura plana para análisis de datos (`OKR_ID` + `Foco` + `Satisfacción`).

---

## 5. Arquitectura Técnica y Estrategia de Build

### 🛠 Stack Tecnológico
* **Core:** Nuxt 3 (SSR + Routing).
* **Estado:** Pinia (Agnóstico al framework).
* **Build Tool:** Vite.

### 🧩 Desacoplamiento de Componentes (RNF-ARQ-01)
Para cumplir con el requisito de portabilidad (Chrome Extension / PWA):

1.  **Aislamiento de Lógica:**
    * El estado del Timer y la lógica de negocio residen en **Pinia**, no en el componente `.vue`.
    * Comunicación estricta vía **Props** (Entrada) y **Emits** (Salida). Nada de `useRouter` o `$nuxt` dentro de los componentes "dumb".

2.  **Estrategia de Build (Vite Library Mode):**
    * Uso de `defineCustomElement` de Vue 3.
    * Configuración de un *target* de build secundario en Vite para compilar archivos `.ce.vue` a **Web Components** estándar.
    * **Resultado:** Un archivo `.js` importable en cualquier HTML, independiente de Nuxt.