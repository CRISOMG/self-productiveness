# Specifications Logs and Notes
Archivo para registro de especificaciones y notas de desarrollo con el objetivo de listar los cambios en funcionalidad, arquitectura y detalles de implementacion de manera cronologica y tambien para enriquezer el contexto de las implementaciones asistida con IA. el formato debe ser simple y claro para que pueda ser facilmente leido por un humano y por un modelo de IA.

> **Importante:** Para estándares globales, templates de TDD y guías de desarrollo, consulta: [Standards & Guidelines](./standards.md).

### IA .md or .txt extension file name
Algunos outputs de ia pueden tener una extension ".concept.ia.md" o ".concept.ia.txt" para el soporte semantico de la documentacion autogenerada. 

## Nomenclatura (en ingles)
* **FRD** (Functional Requirements Document):
    - Describe QUÉ debe hacer el sistema. Detalla las funciones, comportamientos y casos de uso específicos (e.g., autenticación de usuarios, procesamiento de pagos).
* **NFRD** (Non-Functional Requirements Document):
    - Describe CÓMO debe comportarse el sistema. Define atributos de calidad y restricciones técnicas (e.g., tiempo de respuesta < 1s, soportar 10k usuarios concurrentes, seguridad).
* **DoR** (Definition of Ready):
    - Criterios que una historia de usuario debe cumplir ANTES de entrar en desarrollo (e.g., descripción clara, criterios de aceptación, dependencias resueltas). Es el "listo para empezar".
* **DoD** (Definition of Done):
    - Criterios que una historia de usuario debe cumplir DESPUÉS de la implementación para considerarse finalizada (e.g., código commiteado, tests pasando, review aprobado, desplegado). Es el "listo para entregar".

## Estructura de especificaciones: 
Debe ser enumerada y acompañada de la fecha de registro, puede tener una descripcion breve o un resumen de la especificacion.
```markdown
### Specification N [DayName YYYY-MM-DD]
brief description or insight of the semantic level.
1. [ ] especificaciones de funcionalidad
    - [ ] detalles de implementacion
2. [ ] especificaciones de arquitectura
    - [ ] detalles de implementacion
3. [ ] especificaciones de detalles de implementacion
    - [ ] detalles de implementacion
....los que sean necesarios 
```

### Specification 1 [Monday 2025-12-08]
algunos cambios que se dedujeron despues de varias iteraciones.
1. [x] oauth sign-in and sign-up con google y github
2. [x] reset or update password flow
3. [x] notificaciones push cuando termina el pomodoro
    - [x] system-level notification (browser api) si la pestaña esta abierta (focused or not)
    - [] service worker notification para pestaña cerrada y pomodoro "current"
4. [ ] notificaciones push cada 5 minutos si esta habilitado en la configuracion del usuario
5. [x] modelo para reflejar el estado del reloj en remoto vs local (por dispositivos)
6. [x] sincronizacion del reloj en tiempo real y logica para determinar cual de los relojes sera el principal (sobreescribira al resto [single source of truth])
7. [ ] agregar sonido del boton start y pause
8. [ ] agregar sonido del clock o tick tack
9. [ ] mejorar coverage de los test unitarios, de integracion y e2e.
10. [ ] abstraer logica de negocio del contexto de nuxt desde la carpeta composables a una carpeta agnostica al framework para reutilizar en react/next o nest
11. [x] depurar delay del clock en frontend

### Specification 2 [Monday 2025-12-14]
integracion para etiquetar los pomodoros, el objetivo es poder agrupar los pomodoros por etiqueta para poder hacer estadisticas y analisis o exportarlos a servicios de terceros como trello, n8n, google tasks, usando las etiquetas como identificadores, tambie debe poderse importar una lista de etiquetas de un archivo csv o json o api rest.
1. [x] Crud de etiquetas por usuario
2. [x] las etiquetas deben guardarse en minusculas
3. [x] deben ser unicas
4. [x] boton para agregar etiqueta al pomodoro
5. [x] barra de busqueda de etiquetas al querer agregar una
6. [x] si la etiqueta no existe, se confirma al usuario si desea crearla
7. [x] debe segir el standard S1 en [Standards & Guidelines](./standards.md)
8. [ ] debe poder tener un flujo de auth para una api de tercero que permita importar las etiquetas para ese usuario
9. [x] el componente PomodoroTagSelector.vue debe listar todas las etiquetas una ves enfocado o interactuado con el, cuando empieza a escribir se empieza a filtrar, la lista de etiquetas debe poder ser scrollable y debe tener un limite de altura para que no se desborde el contenedor y explorable con la tecla tab y flechas arriba y abajo.
10. [x] Utiliza componente de nuxt/ui para el input y el dropdown