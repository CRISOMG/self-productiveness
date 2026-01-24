# Especificaciones del Proyecto: yourfocus

## 1. Visión General del Proyecto

**Nombre del Proyecto:** yourfocus (anteriormente Self-Productiveness)
**Descripción:** Una aplicación web diseñada para mejorar la productividad personal mediante la técnica Pomodoro. Permite a los usuarios gestionar sus sesiones de enfoque y descanso, organizándolas en ciclos y visualizando su progreso.

## 2. Requerimientos de Negocio (Nivel Estratégico)

### 2.1 Objetivos del Negocio

- **Mejorar la Productividad del Usuario:** Proveer una herramienta que facilite la concentración y el manejo del tiempo.
- **Seguimiento de Hábitos:** Permitir a los usuarios visualizar sus patrones de trabajo y descanso.
- **Simplicidad y Eficiencia:** Ofrecer una interfaz limpia y rápida que no distraiga al usuario de su objetivo principal.

### 2.2 Alcance

- Gestión de temporizadores Pomodoro (Enfoque, Descanso Corto, Descanso Largo).
- Agrupación de sesiones en "Ciclos" automáticos.
- Visualización del tiempo en una grilla o línea de tiempo.
- Autenticación y persistencia de datos en la nube.

## 3. Requerimientos Funcionales

### 3.1 Gestión de Usuarios (Autenticación)

- **Registro e Inicio de Sesión:** Los usuarios deben poder autenticarse para guardar sus datos.
- **Recuperación de Contraseña:** Flujo para solicitar y actualizar la contraseña olvidada.
- **Persistencia:** La sesión del usuario debe mantenerse activa.

### 3.2 Módulo Pomodoro

- **Iniciar Sesión:** El usuario puede iniciar un temporizador para una actividad (Focus, Break).
- **Pausar/Reanudar:** Capacidad de pausar el temporizador y reanudarlo, registrando estos eventos en una línea de tiempo (`toggle_timeline`).
- **Finalizar:** Marcar una sesión como terminada, registrando la duración real (`timelapse`) y la hora de finalización.
- **Detección de Ciclos:** El sistema debe agrupar automáticamente los pomodoros en ciclos. Un ciclo se completa cuando se cumplen ciertos requisitos de etiquetas (ej. 4 Focus + descansos).

### 3.3 Visualización y Configuración

- **Dashboard:** Vista principal con el temporizador actual y estado del ciclo.
- **TimeGrid:** Visualización vertical del tiempo y las sesiones pasadas (en desarrollo).
- **Configuración:** (Potencial) Ajuste de duraciones por defecto para cada tipo de etiqueta.

## 4. Requerimientos No Funcionales

### 4.1 Usabilidad

- **Interfaz Intuitiva:** Diseño minimalista utilizando componentes de Nuxt UI.
- **Feedback Inmediato:** Indicadores visuales del estado del temporizador y notificaciones (Toasts) para éxito/error.

### 4.2 Rendimiento

- **SPA (Single Page Application):** La aplicación debe cargar rápido y navegar entre vistas sin recargas completas (ssr: false).
- **Reactividad:** El temporizador debe actualizarse en tiempo real sin lag perceptible.

### 4.3 Fiabilidad y Seguridad

- **Persistencia de Datos:** Todos los datos críticos (sesiones, ciclos) se guardan en Supabase.
- **Seguridad de Datos:** Acceso a datos restringido por `user_id` (Row Level Security en Supabase).

## 5. Especificaciones Técnicas (Nivel Técnico)

### 5.1 Stack Tecnológico

- **Frontend Framework:** Nuxt 4 (Vue 3).
- **Lenguaje:** TypeScript.
- **Estilos:** TailwindCSS (vía Nuxt UI).
- **Estado Global:** Pinia.
- **Backend / Base de Datos:** Supabase (PostgreSQL).
- **Testing:** Vitest (Unit/Integration), Playwright (E2E), Nuxt Test Utils.

### 5.2 Arquitectura de Software

- **Cliente-Servidor (BaaS):** La aplicación corre principalmente en el cliente (navegador) y se comunica directamente con Supabase para datos y autenticación.
- **Patrón Repository:** Se utiliza un patrón de repositorio (`use-pomodoro-repository.ts`) para abstraer las llamadas a Supabase y tipar las respuestas.
- **Composables:** Lógica de negocio encapsulada en composables reutilizables (ej. `use-pomodoro-service.ts`, `use-timer.ts`).

### 5.3 Modelo de Datos (Esquema de Base de Datos)

#### Tabla: `pomodoros`

Representa una sesión individual de tiempo.

- `id`: Identificador único (number).
- `user_id`: Referencia al usuario (UUID).
- `cycle`: FK a `pomodoros_cycles`.
- `state`: Enum (`current`, `paused`, `finished`).
- `started_at`: Timestamp de inicio.
- `finished_at`: Timestamp de fin.
- `expected_duration`: Duración planeada en segundos.
- `timelapse`: Tiempo real transcurrido.
- `toggle_timeline`: JSON Array registrando pausas/reanudaciones (`[{ at: string, type: 'play' | 'pause' }]`).

#### Tabla: `pomodoros_cycles`

Agrupa múltiples pomodoros.

- `id`: Identificador único.
- `user_id`: Referencia al usuario.
- `state`: Estado del ciclo.
- `required_tags`: Array de strings definiendo la secuencia necesaria para completar el ciclo.

#### Tabla: `tags`

Tipos de sesiones disponibles.

- `id`: Identificador.
- `label`: Nombre visible (ej. "Focus").
- `type`: Identificador interno (ej. "focus", "short-break").

#### Tabla: `pomodoros_tags`

Relación muchos a muchos entre pomodoros y etiquetas.

### 5.4 Configuración y Despliegue

- **Variables de Entorno:** Gestionadas vía `.env` (URL de Supabase, Keys).
- **Modo de Renderizado:** Client-side only (`ssr: false` en `nuxt.config.ts`).
- **CI/CD:** Scripts de `build`, `test`, `lint` definidos en `package.json`.
