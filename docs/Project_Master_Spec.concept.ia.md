# 🧭 yourfocus: Sistema Operativo de Alineación Personal

> _Documento Maestro de Concepto y Especificación Unificada_

## 1. Visión del Producto

**"El pensamiento condiciona a la acción, la acción determina el comportamiento, el comportamiento repetido crea hábitos, los hábitos estructuran el carácter y el carácter marca el destino."**

**yourfocus** (anteriormente "Self Productiveness") no es solo una herramienta de productividad; es un **Sistema Operativo Ontológico**. Su propósito fundamental es cerrar la brecha entre la ejecución táctica diaria (las micro-tareas) y la visión de vida a largo plazo, midiendo matemáticamente la **Coherencia** entre quien dices ser (Identidad/Misión) y lo que realmente haces (Acción/Pomodoros).

### Objetivo Profesional

El proyecto busca demostrar capacidades _Senior_ en arquitectura de software, diseño de producto orientado a datos e integración de IA (Gemini), funcionando como una pieza de portafolio "viva" que evoluciona con el uso.

---

## 2. Metodología: La Pirámide de Alineación

El sistema estructura la productividad en cuatro capas jerárquicas que transforman lo abstracto en tangible:

### Nivel 1: La Brújula (Identidad - Hoshin Kanri)

- **Función:** Define el "Norte" inamovible.
- **Entidades:** Misión, Visión y Valores (ej. Diligencia, Responsabilidad).
- **Rol en el Sistema:** Actúa como el filtro ético. La IA utiliza estos valores para juzgar la calidad de las acciones registradas en la bitácora.

### Nivel 2: La Estrategia (Vectores - OKR)

- **Función:** Traduce la identidad en metas accionables.
- **Entidades:** Objetivos (O) y Resultados Clave (KR).
- **Lógica:** Cada OKR es un **vector** con dirección (hacia la Visión) y magnitud (tiempo planificado).

### Nivel 3: La Ejecución (Acción - Pomodoro Cuantitativo)

- **Función:** La unidad mínima de inversión de vida.
- **Regla de Oro:** **Imputación Obligatoria.** No existe el tiempo "neutro". Todo Pomodoro debe tributar a un Resultado Clave (KR) específico.
- **Cualificación:** Se mide duración, **Foco** (1-5) y **Satisfacción** (1-5).

### Nivel 4: La Conciencia (Retroalimentación - Bitácora IA)

- **Función:** Auditoría de carácter y coherencia.
- **Mecánica:** Al finalizar un ciclo, el usuario registra una reflexión (audio/texto). La IA analiza semánticamente si la acción y el sentimiento se alinean con los Valores y OKRs.

### Nivel 5: El Resultado (Visualización - Ikigai Dinámico)

- **Función:** Dashboard de largo plazo.
- **Lógica:** El Ikigai no se "define", se **descubre**. El sistema revela el equilibrio vocacional real basándose en dónde se invierte el tiempo y qué satisfacción genera.

---

## 3. Reglas de Negocio (Core Mechanics)

### 📊 BR-01: Cálculo de Coherencia

La métrica estrella del sistema. Evalúa la integridad del usuario:

> **Fórmula:** `Puntaje = ( (Pomodoros Realizados / Tiempo Planificado OKR) * Factor Sintía )`

- **Objetivo:** > 90% (Alta Coherencia).
- **Alerta:** < 50% (Disonancia Cognitiva).

### 🛡️ BR-02: Zero "Trabajo Fantasma"

- El sistema impide iniciar un timer sin seleccionar un `OKR_ID`.
- El sistema impide cerrar una sesión sin completar la `Bitácora de Cualificación`.

### 🧠 BR-03: El Coach Estóico (IA)

- Implementación de **Google Gemini 2.5 Flash**.
- Analiza los logs diarios para detectar patrones de comportamiento (ej. "Estás siendo productivo pero poco diligente").

---

## 4. Requerimientos Funcionales (Resumen)

| Módulo                  | Funcionalidad Clave                                                             |
| :---------------------- | :------------------------------------------------------------------------------ |
| **Gestión Estratégica** | CRUD de Misión/Visión. Asistencia IA para redacción inspiradora.                |
| **Gestión OKR**         | Definición de Objetivos con carga horaria estimada.                             |
| **Timer / Ejecución**   | Temporizador vinculado a KR. Bloqueo de UI post-timer hasta completar bitácora. |
| **Bitácora (Journal)**  | Input Texto/Voz. Análisis de sentimiento y alineación con Valores.              |
| **Dashboard**           | Gráfico Ikigai dinámico y reportes de Coherencia semanal.                       |

---

## 5. Arquitectura Técnica

- ### 🛠 Stack Tecnológico

- **Core:** Nuxt 3 (SSR + Routing).
- **Estado:** Pinia (Modelado de negocio desacoplado de la UI).
- **Build Tool:** Vite.
- **Estilo:** CSS Vanilla / Tailwind (Diseño Premium & Minimalista).
- **Integración IA:** SDK de Google Gemini.
- **Estrategia de Build:**
  - Diseño modular orientado a **Web Components**.
  - Capacidad de exportación a Extensiones de Navegador o PWA.

---

## 6. Estrategia de Implementación (Roadmap Táctico)

### Fase 1: El MVP Táctico (Pomodoro First)

Se decidió priorizar el desarrollo del **Módulo Pomodoro** como punto de partida por las siguientes razones estratégicas:

1.  **Simplicidad y Adopción Inmediata:** Inspirado en herramientas probadas como _pomofocus.io_, permite tener un producto funcional y utilizable ("Dogfooding") desde las primeras semanas, antes de atacar la complejidad de la gestión de OKRs o la IA.
2.  **Validación de Arquitectura:** Sirve como campo de pruebas para la arquitectura en capas (Pinia + Componentes Dumb) y el sistema de notificaciones/timers.

### Integraciones y Automatización (Visión de Conectividad)

El módulo de Pomodoro no vivirá aislado. Se planea una arquitectura de integración robusta aprovechando la tabla `pomodoro_tags`:

- **Objetivo:** Permitir el etiquetado dinámico de sesiones con identificadores externos.
- **Herramientas:** n8n, Webhooks y APIs externas.
- **Caso de Uso (Trello/Jira):**
  - Crear flujos en **n8n** que sintonicen tareas de Trello.
  - Inyectar IDs de tareas externas en `pomodoro_tags`.
  - Esto permitirá cruzar datos de productividad personal con herramientas de gestión de proyectos externas sin ensuciar el núcleo de la aplicación.
