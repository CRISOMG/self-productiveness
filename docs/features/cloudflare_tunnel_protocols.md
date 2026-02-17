# Cloudflare Tunnel Protocols: HTTP2 (TCP) vs QUIC (UDP)

## Contexto

En el despliegue de n8n vía Cloudflare Tunnel en una infraestructura local (laptop que entra en suspensión), se observaron errores de conexión inestable con el protocolo por defecto (QUIC). Los logs mostraban `failed to run the datagram handler error="timeout: no recent network activity"`.

Para solucionar esto, se cambió el protocolo a **HTTP2 (TCP)**. Este documento detalla los trade-offs técnicos de esta decisión.

## Comparación Técnica

Al cambiar de **QUIC (UDP)** a **HTTP2 (TCP)**, se intercambia **velocidad bruta/latencia** por **compatibilidad y estabilidad**.

### 1. El Problema Raíz: NAT y "Timeouts" (Por qué falla UDP en local)

- **UDP (QUIC):** Es un protocolo "sin conexión". Los routers (NAT) mantienen una tabla de mapeo de puertos efímera.
  - **El problema:** Los routers son agresivos limpiando tablas UDP. Si no hay tráfico por 30-60 segundos (ej. laptop en suspensión), el router borra la entrada. Al despertar, los paquetes entrantes son descartados porque el router no sabe a quién pertenecen, generando el error `timeout: no recent network activity`.
- **TCP (HTTP2):** Es un protocolo "orientado a conexión" con un estado claro.
  - **La Ventaja:** Los routers mantienen las sesiones TCP abiertas por mucho más tiempo. Además, el sistema operativo detecta la ruptura del pipe TCP inmediatamente al intentar escribir, forzando una reconexión limpia y rápida.

### 2. Trade-off: Latencia y "Head-of-Line Blocking"

- **QUIC (Ventaja perdida):** Resuelve el _Head-of-Line Blocking_. Si un paquete se pierde, los demás streams siguen fluyendo.
- **HTTP2 (Limitación):** Si se pierde un paquete TCP, **todo el tráfico se detiene** momentáneamente hasta que ese paquete se retransmite (hace "cola").
- **Impacto:** En aplicaciones como n8n, la diferencia es imperceptible a menos que la red tenga una alta tasa de pérdida de paquetes.

### 3. Trade-off: Congestión y Throttling

- **UDP:** Frecuentemente limitado (throttled) o bloqueado por ISPs y firewalls corporativos que lo asocian a tráfico no prioritario.
- **TCP:** Al usar el puerto 443 estándar, es indistinguible del tráfico web normal, garantizando máxima "pasabilidad" a través de firewalls.

## Tabla Resumen

| Característica                   | QUIC (UDP)                                             | HTTP2 (TCP)                                                            |
| :------------------------------- | :----------------------------------------------------- | :--------------------------------------------------------------------- |
| **Recuperación tras suspensión** | **Mala**. Errores de timeout por tablas NAT expiradas. | **Excelente**. Reconexión rápida o mantenimiento de sesión prolongado. |
| **Estabilidad en Firewalls**     | Regular. Susceptible a bloqueos/throttling.            | **Máxima**. Tráfico HTTPS estándar.                                    |
| **Latencia (Ping)**              | Muy baja (Ideal tiempo real).                          | Baja (Suficiente para web apps).                                       |
| **Pérdida de Paquetes**          | Resiliente (Streams independientes).                   | Sensible (Un error detiene todo momentáneamente).                      |
| **Uso de CPU**                   | Ligeramente mayor (Cifrado en userspace).              | Menor (Optimizado en kernel).                                          |

## Conclusión

Para entornos de **auto-alojamiento (self-hosting) en hardware no dedicado** (laptops, equipos que duermen, conexiones WiFi variables), **HTTP2 es la opción superior**. La estabilidad de la conexión pesa más que las mejoras marginales de latencia que ofrece QUIC.
