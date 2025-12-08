# Conocimientos Tácticos y Patrones de Diseño Demostrados

Este documento detalla las competencias técnicas específicas (Hard Skills) y patrones de diseño identificados en el código fuente del módulo Pomodoro. El análisis evidencia un nivel de ingeniería de software avanzado, priorizando la mantenibilidad, escalabilidad y robustez.

## 1. Arquitectura y Diseño de Software

### **Clean Architecture & Separation of Concerns (SoC)**
El proyecto demuestra una aplicación estricta de la separación de responsabilidades, evitando el "Spaghetti Code" común en aplicaciones frontend.
*   **Evidencia:** La división clara en carpetas y archivos según su rol técnico:
    *   `pomodoro-domain.ts` (Reglas de negocio puras).
    *   `use-pomodoro-repository.ts` (Acceso a datos).
    *   `use-pomodoro-service.ts` (Casos de uso).
    *   `use-pomodoro-controller.ts` (Adaptador de vista/estado).

### **Repository Pattern**
Abstracción de la capa de persistencia para desacoplar la aplicación de la base de datos específica (Supabase).
*   **Evidencia:** `use-pomodoro-repository.ts` expone métodos semánticos (`getCurrent`, `insert`, `listToday`) en lugar de exponer directamente las queries de Supabase al resto de la app. Esto permite cambiar el backend o mockearlo fácilmente.

### **Service Layer Pattern**
Encapsulamiento de la lógica de aplicación y orquestación de transacciones.
*   **Evidencia:** `use-pomodoro-service.ts` coordina múltiples repositorios (`pomodoro`, `cycle`, `tag`) para realizar operaciones atómicas desde la perspectiva del negocio, como `startPomodoro` (que crea ciclo si no existe, calcula tiempos y guarda el registro).

## 2. Dominio y Lógica de Negocio (DDD Táctico)

### **Lógica de Dominio Pura (Pure Functions)**
Aislamiento de la complejidad algorítmica en funciones puras que no tienen efectos secundarios ni dependencias de framework.
*   **Evidencia:** `pomodoro-domain.ts` contiene funciones como `hasCycleFinished` o `calculateNextTagFromCycleSecuence`.
*   **Valor:** Estas funciones son 100% testables sin necesidad de mocks, bases de datos o entorno de navegador.

### **Inmutabilidad y Manejo de Estado**
Uso de prácticas para evitar mutaciones accidentales en algoritmos complejos.
*   **Evidencia:** Uso de `structuredClone` en `calculateNextTagFromCycleSecuence` para manipular copias de arrays en lugar de las referencias originales.

## 3. TypeScript Avanzado

### **Tipado Fuerte y Generics**
Uso extensivo del sistema de tipos para garantizar la seguridad en tiempo de compilación.
*   **Evidencia:** Importación y uso de tipos generados automáticamente (`Database`, `Pomodoro['Insert']`) en `database.types.ts` y su aplicación en los repositorios. Esto asegura que si el esquema de la BD cambia, el código de TypeScript fallará al compilar, previniendo errores en runtime.

### **Enums y Constantes de Configuración**
Evitar "Magic Numbers" y "Magic Strings" dispersos por el código.
*   **Evidencia:** Uso de `TagIdByType`, `TagType` y `PomodoroDurationInSecondsByDefaultCycleConfiguration` en `pomodoro-domain.ts` para centralizar la configuración del sistema.

## 4. Ecosistema Vue / Nuxt

### **Composable Pattern (Composition API)**
Empaquetado de lógica reactiva reutilizable.
*   **Evidencia:** Todos los módulos principales (`usePomodoroService`, `usePomodoroController`) son *Composables*. Esto permite inyectar dependencias (como `useSupabaseClient`) y mantener el contexto de reactividad de Vue.

### **Gestión de Estado Reactivo**
Manejo eficiente del estado asíncrono y local.
*   **Evidencia:** Uso de `storeToRefs` en el controlador para mantener la reactividad del Store de Pinia (`usePomodoroStore`), y gestión de estado local para temporizadores (`useTimer`).

## 5. Estrategias de Testing

### **Test Pyramid Awareness**
Distinción clara entre tests unitarios de lógica y tests de integración.
*   **Evidencia:** `use-pomodoro.test.ts` separa los tests en bloques:
    *   `[[Domain Logic Level]]`: Tests rápidos y deterministas para `pomodoro-domain.ts`.
    *   `[[Supabase Integration Level]]`: (Comentados en el código, pero presentes conceptualmente) Tests que involucran autenticación y base de datos real.

### **Testable Code Design**
El código fue escrito para ser testeado. Al extraer la lógica compleja a `pomodoro-domain.ts`, se eliminó la necesidad de configurar entornos complejos de Nuxt/Vue para validar las reglas de negocio críticas.

## 6. Integración y Backend (Supabase)

### **Manejo de Errores Centralizado**
Patrones robustos para capturar y propagar errores de infraestructura.
*   **Evidencia:** Uso de `.throwOnError()` en las cadenas de promesas de Supabase y bloques `try/catch` en el controlador que transforman errores técnicos en feedback de usuario (`toast.addErrorToast`).

### **Relaciones y Proyecciones (Joins)**
Conocimiento de cómo realizar consultas eficientes en bases de datos relacionales vía API.
*   **Evidencia:** Queries complejas en el repositorio:
    ```typescript
    .select(`*, cycle (*), tags (*)`)
    ```
    Demuestra conocimiento de cómo traer datos relacionados en una sola petición (Eager Loading) para evitar el problema "N+1".
