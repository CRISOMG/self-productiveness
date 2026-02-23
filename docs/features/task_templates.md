# Módulo de Plantillas de Tareas (Task Templates)

## Descripción General

Se requiere un nuevo módulo que permita gestionar plantillas (templates) para la creación rápida y estandarizada de tareas. Cada plantilla predefine un título, una descripción y un conjunto de etiquetas asociadas.

## Especificaciones y Requerimientos

### 1. Entidad: Plantilla de Tarea (Task Template)

- **Título**: Nombre identificativo de la plantilla.
- **Descripción por defecto**: Texto que se asignará como descripción de las tareas creadas a partir de esta plantilla.
  - Soporta el uso de **Markdown**.
  - Permite la inclusión de **checkboxes** interactivos.
  - Soporta **enlaces (links) a notas**.
- **Etiquetas Asociadas**: Lista de etiquetas que se aplicarán automáticamente a las tareas generadas.
  - _Condición_: Todas las etiquetas predefinidas deben existir previamente en la tabla de etiquetas maestra del sistema.

### 2. Flujo de Creación a través del Agente (Agent Tool)

- Se debe implementar una nueva herramienta (Tool) o flujo accesible para el agente de IA.
- El agente debe ser capaz de:
  1. Consultar y visualizar las plantillas disponibles.
  2. Crear nuevas tareas instanciando una de estas plantillas (asociando el título, la descripción predefinida y aplicando las etiquetas correspondientes).

### 3. Renderizado de Elementos Markdown

- Al igual que ocurre con los checkboxes de Markdown, los enlaces a notas deben renderizarse correctamente en el frontend.
- **Comportamiento requerido**: Los enlaces a las notas deben ser consistentes con la especificación de Markdown y, obligatoriamente, deben abrirse en una **nueva pestaña** (`target="_blank"`).
- _Consideración técnica de UI_: Esta lógica de renderizado debe integrarse (o replicarse si es posible) en la configuración del componente `MDCCached`, ubicado en `app/components/containers/chat-container.vue` (aprox. línea 59), para asegurar uniformidad en toda la plataforma.
