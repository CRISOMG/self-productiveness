# Jerarquia de requerimientos

> es necesario historias de usuario para definir requerimientos tecnicos? hay un paso previo a la definicion de los RF?
> 

Esta es una pregunta fundamental en la ingeniería de software. La respuesta corta es: **No son estrictamente necesarias** (puedes definir requisitos técnicos sin ellas), pero son **extremadamente útiles** como puente.

Sin embargo, **SÍ existe un paso previo** (y fundamental) a la definición de los Requerimientos Funcionales (RF), especialmente en un proyecto tan conceptual como el tuyo (Ikigai, IA, Coherencia).

Aquí te explico la jerarquía correcta para que no te pierdas en los detalles técnicos antes de tiempo.

---

### 1. El "Paso Previo": Los Requerimientos de Negocio y Reglas

Antes de escribir "El sistema debe..." (RF) o "Yo como usuario quiero..." (Historia de Usuario), necesitas definir **Las Reglas de Negocio**.

En tu caso, esto es crítico. Antes de pedirle a un programador que haga el "Módulo de Coherencia", debes definir la regla matemática o lógica de esa coherencia.

- **Nivel 1: Requerimiento de Negocio (El "Por qué"):** "Queremos mejorar la autoconsciencia del usuario mediante métricas".
- **Nivel 2: Regla de Negocio (La "Lógica"):** "La coherencia se define como la relación porcentual entre el tiempo planificado en un OKR y el tiempo ejecutado en Pomodoros. Si es menor al 50%, es 'Baja Coherencia'".
    - *Nota:* Sin este paso, el requerimiento técnico es imposible de escribir.

### 2. ¿Dónde encajan las Historias de Usuario?

Las Historias de Usuario (HU) no definen la **técnica**, definen el **valor** y la **interacción**.

- **¿Son necesarias?** En metodologías ágiles (Scrum), sí. Ayudan a que el desarrollador entienda *para quién* y *para qué* está programando.
- **La diferencia:**
    - **Historia de Usuario:** Se centra en el **Humano** ("Quiero ver si fui coherente para sentirme mejor").
    - **Requerimiento Técnico (RF):** Se centra en el **Sistema** ("El sistema consultará la base de datos X y aplicará la fórmula Y").

---

### 3. La Jerarquía de Definición (De lo abstracto a lo concreto)

Para tu proyecto, te sugiero seguir este flujo en cascada (o "Drill-down"). Observa cómo se transforma tu idea del "Módulo de Ikigai":

### Paso A: Definición del Concepto (Reglas de Negocio)

*Lo que tú defines como dueño del producto.*

> "El Ikigai en esta app se compondrá de 4 campos de texto: Lo que amas, Lo que eres bueno, Lo que el mundo necesita, Por lo que te pagan. La intersección será analizada por IA."
> 

### Paso B: Historia de Usuario (Experiencia)

*Lo que el usuario vive.*

> "Como usuario reflexivo, quiero visualizar mis 4 áreas del Ikigai en un gráfico, para poder identificar visualmente dónde me falta equilibrio."
> 

### Paso C: Requerimiento Funcional (Técnico)

*Lo que el programador escribe en código.*

> RF-01: El sistema debe proveer un formulario con 4 textareas con un límite de 200 caracteres cada uno.
> 
> 
> RF-02: Al guardar, el sistema enviará los 4 textos al endpoint de la IA con el prompt "Analiza la intersección semántica".
> 
> RF-03: El frontend renderizará un Diagrama de Venn donde el tamaño de las esferas sea dinámico basado en la longitud del texto (ejemplo).
> 

---

### 4. Tabla Comparativa: ¿Qué usas para qué?

| **Herramienta** | **Objetivo** | **¿Quién la escribe?** | **¿Es necesaria para tu App?** |
| --- | --- | --- | --- |
| **Reglas de Negocio** | Definir la lógica (fórmulas, condiciones). | Tú (Product Owner) | **Imprescindible.** Sin esto, la IA no sabe qué hacer. |
| **Historias de Usuario** | Definir el flujo y el valor percibido. | Tú + Equipo de Diseño | Muy recomendada para UI/UX. |
| **Requerimientos Funcionales** | Definir el comportamiento exacto del sistema (inputs/outputs). | Analista Técnico / Líder Técnico | **Obligatoria** para que funcione el software. |
| **Requerimientos Técnicos (No funcionales)** | Definir rendimiento, seguridad, bases de datos. | Arquitecto de Software | **Obligatoria** (ej: "La IA debe responder en <3 seg"). |

### Conclusión para tu proyecto

Dado que tu proyecto tiene componentes subjetivos (Misión, Visión, Ikigai), **no puedes saltar directo a los Requerimientos Funcionales**.

Si le dices a un programador: *"Haz un requerimiento para alinear la semántica"*, él no sabrá qué hacer.

**Tu flujo de trabajo ideal ahora mismo:**

1. **Define las Reglas (Paso previo):** Escribe en papel qué significa matemáticamente o lógicamente "Alinear", "Coherencia" y "Progreso".
2. **Crea las Historias:** Describe cómo interactúa el usuario con eso.
3. **Deriva los Requerimientos:** Traduce esa historia a instrucciones de sistema.

**¿Quieres que intentemos definir la "Regla de Negocio" (la lógica) para el módulo de "Coherencia" antes de pasar a escribir su requerimiento técnico?** Eso aclararía mucho el desarrollo.