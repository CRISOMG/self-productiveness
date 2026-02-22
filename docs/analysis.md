# Análisis de Arquitectura del Módulo Pomodoro

Este documento presenta un análisis de la arquitectura inferida a partir de los archivos proporcionados del módulo Pomodoro. Se detalla la estructura actual, cómo escala y cómo reutilizar la lógica en entornos SSR (Server-Side Rendering) y en un backend con NestJS.

## 1. Arquitectura Actual: Diseño por Capas (Layered Architecture)

El código sigue una arquitectura limpia y modular basada en capas, separando claramente las responsabilidades. Esto facilita el mantenimiento, las pruebas y la escalabilidad.

### Capas Identificadas:

1.  **Capa de Dominio (Domain Layer)**
    - **Archivo:** `app/utils/pomodoro-domain.ts`
    - **Responsabilidad:** Contiene la lógica de negocio pura, constantes y reglas invariantes del sistema. Es agnóstica al framework y a la base de datos.
    - **Características:** Funciones puras (`hasCycleFinished`, `calculateNextTagFromCycleSecuence`), Enums y constantes de configuración. No tiene dependencias externas.

2.  **Capa de Repositorio (Repository Layer)**
    - **Archivo:** `app/composables/pomodoro/use-pomodoro-repository.ts`
    - **Responsabilidad:** Abstrae el acceso a datos. Se encarga de la comunicación directa con la base de datos (Supabase en este caso).
    - **Características:** Contiene funciones CRUD (`insert`, `update`, `getOne`, `listToday`). Maneja la proyección de datos y las relaciones (joins). Aísla al resto de la aplicación de los detalles de implementación de la persistencia.

3.  **Capa de Servicio (Service Layer)**
    - **Archivo:** `app/composables/pomodoro/use-pomodoro-service.ts`
    - **Responsabilidad:** Orquestación y lógica de aplicación. Coordina los repositorios y utiliza la lógica de dominio para ejecutar casos de uso complejos.
    - **Características:** Implementa flujos de negocio como "Iniciar Pomodoro" (que implica calcular tiempos, verificar ciclos, crear registros), "Finalizar Ciclo", etc. No maneja estado de la UI directamente, sino transacciones lógicas.

4.  **Capa de Controlador / Composable (Controller/State Layer)**
    - **Archivo:** `app/composables/use-pomodoro-controller.ts`
    - **Responsabilidad:** Gestión del estado de la interfaz y manejo de la interacción del usuario. Actúa como el "pegamento" entre la vista (Vue components) y la capa de servicio.
    - **Características:** Usa `Pinia` (store) para estado reactivo global. Maneja efectos secundarios del cliente como `localStorage`, `setInterval` (Timer), y notificaciones (Toasts). Expone funciones manejadoras de eventos (`handleStartPomodoro`, `handlePausePomodoro`).

## 2. Escalabilidad

La arquitectura actual está bien preparada para escalar debido a su desacoplamiento:

- **Separación de Intereses:** Si cambia la lógica de negocio (ej. cómo se calcula el siguiente tag), solo se toca el **Dominio**. Si cambia la base de datos, solo se toca el **Repositorio**.
- **Testabilidad:** Como se ve en `test/nuxt/use-pomodoro.test.ts`, la lógica de dominio es trivial de testear unitariamente. Los servicios y repositorios se pueden testear con integración o mocks.
- **Mantenibilidad:** Los archivos son pequeños y tienen un propósito único (Single Responsibility Principle).

## 3. Reutilización en Funciones SSR (Nuxt)

Para reutilizar esta lógica en funciones SSR (ej. `server/api/...` en Nuxt) o en `useAsyncData`:

1.  **Dominio:** Importar directamente. Es JS puro.
2.  **Repositorio y Servicio:**
    - Actualmente dependen de `useSupabaseClient` que es un composable de Nuxt.
    - En el contexto del servidor de Nuxt (Nitro), se debe usar `serverSupabaseClient(event)`.
    - **Refactorización sugerida:** Inyectar el cliente de Supabase en las funciones creadoras de los repositorios/servicios en lugar de usar el composable global dentro de ellas.

    ```typescript
    // Ejemplo de refactor para SSR
    export const usePomodoroRepository = (supabaseClient) => {
      // ... usar supabaseClient pasado por argumento
      return { ... }
    }
    ```

    - De esta forma, en un API handler de Nuxt:
      ```typescript
      export default defineEventHandler(async (event) => {
        const client = await serverSupabaseClient(event);
        const repo = usePomodoroRepository(client);
        return repo.listToday();
      });
      ```

## 4. Migración y Reutilización en NestJS

Si se desea migrar esta lógica a un backend dedicado con NestJS, la arquitectura actual facilita enormemente el proceso.

### Mapeo de Componentes:

| Concepto Actual (Nuxt)       | Concepto NestJS           | Acción de Migración                                                                                                                                                                                                                        |
| :--------------------------- | :------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pomodoro-domain.ts`         | **Domain / Utils**        | **Copiar y Pegar.** El código es 100% reutilizable sin cambios.                                                                                                                                                                            |
| `use-pomodoro-repository.ts` | **Repository / Provider** | Crear una clase `PomodoroRepository` con `@Injectable()`. Reemplazar `useSupabaseClient` por la inyección del cliente de Supabase o usar un ORM (TypeORM/Prisma) manteniendo las mismas firmas de métodos.                                 |
| `use-pomodoro-service.ts`    | **Service**               | Crear una clase `PomodoroService` con `@Injectable()`. Inyectar `PomodoroRepository` en el constructor. La lógica interna (métodos `startPomodoro`, `checkIsCurrentCycleEnd`) se mantiene casi idéntica.                                   |
| `use-pomodoro-controller.ts` | **Controller (HTTP)**     | Crear un `PomodoroController` con `@Controller()`. Los métodos `handle...` se convierten en endpoints (`@Post('start')`, `@Post('pause')`). La lógica de estado UI (`store`, `timer`) **NO** se migra al backend, se queda en el frontend. |
| `database.types.ts`          | **DTOs / Entities**       | Reutilizable para tipado, o usar para generar Entidades de TypeORM/Prisma.                                                                                                                                                                 |

### Ejemplo de Implementación en NestJS:

**1. Domain (Igual)**

```typescript
// pomodoro.domain.ts
export function hasCycleFinished(...) { ... }
```

**2. Service (Adaptado)**

```typescript
@Injectable()
export class PomodoroService {
  constructor(
    private readonly pomodoroRepo: PomodoroRepository,
    private readonly cycleRepo: CycleRepository
  ) {}

  async startPomodoro(userId: string, tagId: number) {
    // Lógica copiada de use-pomodoro-service.ts
    // ...
    return this.pomodoroRepo.insert(...);
  }
}
```

**3. Controller (Nuevo enfoque)**
El controlador en NestJS solo recibe la petición HTTP y llama al servicio.

```typescript
@Controller("pomodoro")
export class PomodoroController {
  constructor(private readonly pomodoroService: PomodoroService) {}

  @Post("start")
  async start(@Body() body: StartPomodoroDto, @User() user) {
    return this.pomodoroService.startPomodoro(user.sub, body.tagId);
  }
}
```

### Conclusión

La arquitectura actual es sólida y sigue principios de diseño que permiten desacoplar la lógica de negocio de la interfaz de usuario. Esto hace que la migración a un backend más robusto como NestJS sea una tarea de "traslado y adaptación" en lugar de una reescritura total, preservando la inversión en la lógica de negocio (Dominio y Servicios).
