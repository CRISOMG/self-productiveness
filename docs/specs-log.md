# Specifications Log

## Specification 1

- [x] oauth sign-in and sign-up con google y github
- [x] reset or update password flow
- [/] notificaciones push cuando termina el pomodoro
    - [x] system-level notification (browser api) si la pestaña esta abierta (focused or not)
    - [] service worker notification para pestaña cerrada y pomodoro "current"
- [] notificaciones push cada 5 minutos si esta habilitado en la configuracion del usuario
- [] modelo para reflejar el estado del reloj en remoto vs local (por dispositivos)
- [] sincronizacion del reloj en tiempo real y logica para determinar cual de los relojes sera el principal (sobreescribira al resto [single source of truth])
- [] agregar sonido del boton start y pause
- [] agregar sonido del clock o tick tack
- [] mejorar coverage de los test unitarios, de integracion y e2e.
- [] abstraer logica de negocio del contexto de nuxt desde la carpeta composables a una carpeta agnostica al framework para reutilizar en react/next o nest
- [] depurar delay del clock en frontend
