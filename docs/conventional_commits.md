# Conventional Commits Guide

## Introducción

**Conventional Commits** es una convención ligera sobre los mensajes de commit. Proporciona un conjunto de reglas sencillas para crear un historial de commits explícito, lo cual facilita la creación de herramientas automatizadas sobre dicho historial. Esta convención encaja perfectamente con **SemVer** (Versionado Semántico).

Al estandarizar los mensajes de commit, facilitamos:

- La generación automática de **CHANGELOGs**.
- La determinación automática de subidas de versión semánticas (por ejemplo, correcciones `fix` vs características `feat`).
- La comunicación de la naturaleza de los cambios a otros desarrolladores y al futuro "yo".

---

## Estructura del Mensaje

El mensaje del commit debe estructurarse de la siguiente manera:

```text
<tipo>[ambito opcional]: <descripción>

[cuerpo opcional]

[nota de pie opcional]
```

### 1. Tipo (`type`)

El tipo comunica la intención del cambio. Los tipos principales son:

- **feat**: Una nueva característica o funcionalidad (correlaciona con `MINOR` en SemVer).
- **fix**: Una corrección de un error (correlaciona con `PATCH` en SemVer).
- **chore**: Tareas rutinarias que no modifican archivos `src` o de prueba (ej: cambios en configuración de build, actualizaciones de dependencias).
- **docs**: Cambios únicamente en la documentación.
- **style**: Cambios que no afectan el significado del código (espacios en blanco, formato, puntos y coma faltantes, etc).
- **refactor**: Un cambio de código que no corrige un error ni añade una característica.
- **perf**: Un cambio de código que mejora el rendimiento.
- **test**: Añadir pruebas faltantes o corregir pruebas existentes.
- **build**: Cambios que afectan al sistema de construcción o dependencias externas (ej: gulp, broccoli, npm).
- **ci**: Cambios en nuestros archivos y scripts de configuración de CI (ej: Travis, Circle, BrowserStack, SauceLabs).
- **revert**: Revertir un commit anterior.

### 2. Ámbito (`scope`) - _Opcional_

Proporciona información contextual adicional, encerrada en paréntesis.
_Ejemplos_: `feat(parser)`, `fix(api)`, `chore(deps)`.

### 3. Descripción (`description`)

Una descripción breve y concisa del cambio.

- Usa el imperativo, tiempo presente: "change" no "changed" ni "changes".
- No inicies con mayúscula la primera letra.
- No uses punto al final.

### 4. Cuerpo (`body`) - _Opcional_

Proporciona más detalles sobre el cambio si es necesario. Debe explicar el "qué" y el "por qué", no el "cómo".

### 5. Pie (`footer`) - _Opcional_

Se usa para referenciar Issues (ej: `Closes #123`) o indicar cambios importantes (**BREAKING CHANGE**).

---

## Ejemplos

### Commit de Feature (`feat`)

```text
feat: allow provided config object to extend other configs
```

### Commit de Feature con Ámbito

```text
feat(lang): add polish language support
```

### Commit de Fix (`fix`)

```text
fix: correct parsing of nested attributes
```

### Commit con Breaking Change

Un cambio que rompe la compatibilidad hacia atrás debe indicarse con `!` después del tipo/ámbito o con `BREAKING CHANGE:` en el pie.

```text
feat(api)!: send an email to the customer when a product is shipped
```

o

```text
feat: allow provided config object to extend other configs

BREAKING CHANGE: `extends` key in config file is now valid only for string values
```

### Commit de Documentación (`docs`)

```text
docs: update readme with installation instructions
```

### Commit de Refactorización (`refactor`)

```text
refactor: rename internal variable for clarity
```

---

## Resumen de Tipos

| Tipo                | Descripción               | SemVer  |
| :------------------ | :------------------------ | :------ |
| **feat**            | Nueva característica      | `MINOR` |
| **fix**             | Corrección de bug         | `PATCH` |
| **BREAKING CHANGE** | Cambio incompatible       | `MAJOR` |
| **docs**            | Documentación             | -       |
| **style**           | Formato, espacios, etc.   | -       |
| **refactor**        | Refactorización de código | -       |
| **perf**            | Mejora de rendimiento     | -       |
| **test**            | Tests                     | -       |
| **chore**           | Tareas de mantenimiento   | -       |
| **build**           | Sistema de build          | -       |
| **ci**              | Integración continua      | -       |

## Buenas Prácticas en este Proyecto

Para **Self Productiveness**, se recomienda seguir este estándar para mantener un historial limpio y profesional. Especialmente útil para identificar rápidamente qué commits tocaron la lógica de negocio (`feat`, `fix`, `refactor`) vs mantenimiento (`chore`, `docs`).
