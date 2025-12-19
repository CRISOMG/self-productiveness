# Project Standards & Guidelines

Este documento actúa como la fuente de verdad para los estándares de desarrollo, convenciones y flujos de trabajo que aplican transversalmente a todo el proyecto. Todas las nuevas especificaciones y desarrollos deben adherirse a estas guías salvo excepción explícita.

## 1. Metodología de Pruebas (TDD)

Para garantizar la robustez del código, utilizamos un enfoque cercano a TDD. Antes de implementar una lógica compleja, definimos el comportamiento esperado.

### Template para Definición de Tests
Utilizamos un estilo declarativo (Gherkin-like) para definir los casos de prueba antes de codificar. Esto ayuda tanto al humano como a la IA a entender el objetivo.

```gherkin
Feature: [Nombre del Módulo o Funcionalidad]

  Scenario: [Descripción del caso de éxito o borde]
    Given [Contexto inicial o precondición]
    When [Acción realizada por el usuario o sistema]
    Then [El resultado observable o cambio de estado]
```

**Ejemplo:**
```gherkin
Feature: Pomodoro Timer
  Scenario: Finish Pomodoro Session
    Given the timer is running and reaches 00:00
    When the timer finishes
    Then a notification should be sent
    And the session count should increment by 1
```

## 2. Nomenclatura y Archivos

### Documentación Asistida por IA
* **Extensiones:** Utilizar `.concept.ia.md` o `.concept.ia.txt` para documentación generada que sirve como contexto semántico o análisis arquitectónico.

### Convenciones de Código (Frontend)
* **Composables:** Prefijo `use-` y kebab-case (ej: `use-pomodoro-controller.ts`).
* **Componentes:** PascalCase para componentes Vue (ej: `PomodoroTimer.vue`).

## 3. Definiciones Globales (DoR / DoD)

Estas definiciones aplican a cualquier tarea a menos que la tarea especifique lo contrario.

* **DoR (Definition of Ready):** Una tarea está lista para desarrollarse si tiene claro el QUÉ (requerimientos) y se han identificado los posibles riesgos técnicos.
* **DoD (Definition of Done):** Una tarea está terminada si el código está commiteado, los tests unitarios (si aplican) pasan, y la funcionalidad cumple los criterios de aceptación originales.


### S1 Layered Architecture, Presentation,Controller,Service,Repository and Domain in nuxt context Composables,Pinia store and Nuxt pages. 
* los componentes deben crearse agnosticos a nuxt pages
* se debe seguir la arquitectura MVC y Layered Architecture con el patron repository, la vista se guarda en la carpeta components o containers y el controlador en la carpeta composables con la terminacion "controller", el modelo es representado por composables de estado o pinia stores, la logica de negocio se encuentra en la carpeta composables con la terminacion "service" y los repositorios en la carpeta composables con la terminacion "repository".
* se deben determinar funciones puras sobre las entidades para la logica de dominio, el archivo debe tener la terminacion "domain" y debe estar en la carpeta composables.
* los modulos de negocio son una carpeta con el nombre de la entidad en la carpeta composables y debe contener los archivos de logica de dominio, repositorio, servicio y controlador. 


### S2 rls policy check
* Enabling Row Level Security
You can enable RLS for any table using the enable row level security clause:
```
alter table "table_name" enable row level security;
```
Once you have enabled RLS, no data will be accessible via the API when using the public anon key, until you create policies.

*`auth.uid()` Returns `null` When Unauthenticated*

When a request is made without an authenticated user (e.g., no access token is provided or the session has expired), auth.uid() returns null.

This means that a policy like:

USING (auth.uid() = user_id)
will silently fail for unauthenticated users, because:

null = user_id
is always false in SQL.

To avoid confusion and make your intention clear, we recommend explicitly checking for authentication:

USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)