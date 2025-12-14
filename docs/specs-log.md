# Specifications Log
Archivo para registro de especificaciones a nivel tecnico y de experiencia de desarrollo con el objetivo de listar los cambios en funcionalidad, arquitectura y detalles de implementacion de manera cronologica y tambien para enriquezer el contexto de las implementaciones asistida con IA. el formato debe ser simple y claro para que pueda ser facilmente leido por un humano y por un modelo de IA.

## Estructura de especificaciones: 
```
### Specification N [DayName YYYY-MM-DD]
- [ ] especificaciones de funcionalidad
    - [ ] detalles de implementacion
- [ ] especificaciones de arquitectura
    - [ ] detalles de implementacion
- [ ] especificaciones de detalles de implementacion
    - [ ] detalles de implementacion
```

### Specification 1 [Monday 2025-12-08]

- [x] oauth sign-in and sign-up con google y github
- [x] reset or update password flow
- [x] notificaciones push cuando termina el pomodoro
    - [x] system-level notification (browser api) si la pestaña esta abierta (focused or not)
    - [] service worker notification para pestaña cerrada y pomodoro "current"
- [] notificaciones push cada 5 minutos si esta habilitado en la configuracion del usuario
- [x] modelo para reflejar el estado del reloj en remoto vs local (por dispositivos)
- [x] sincronizacion del reloj en tiempo real y logica para determinar cual de los relojes sera el principal (sobreescribira al resto [single source of truth])
- [] agregar sonido del boton start y pause
- [] agregar sonido del clock o tick tack
- [] mejorar coverage de los test unitarios, de integracion y e2e.
- [] abstraer logica de negocio del contexto de nuxt desde la carpeta composables a una carpeta agnostica al framework para reutilizar en react/next o nest
- [x] depurar delay del clock en frontend
