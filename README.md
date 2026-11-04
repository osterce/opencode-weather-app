## Weather CLI APP

El objetivo de esta aplicación es que creemos una aplicación de consola que pida
que ingresemos la ciudad, Al final, generaremos un binario ejecutable.

### Opciones:

- Ingresar el nombre de una ciudad.
- Guardar la ciudad por defecto.
- Registrar varias otras ciudades para buscar el clima en esas otras ciudades.

## Stack

- Bun.js
- OpenMeteo

## Ejemplo de petición http:

1. Paso 1: Geocoding API.
2. Paso 2: OpenMeteo API.

```
https://geocoding-api.open-meteo.com/v1/search?name=Ottawa&count=1&language=es&format=json
https://api.open-meteo.com/v1/forecast?latitude=45.41117&longitude=-75.69812&current=temperature_2m
```

## Inicializar proyecto

```bash
bun install
bun run start
```

## Uso

```bash
bun run start     # ejecutar la aplicación
bun run test      # ejecutar los tests
bun run build     # generar el binario ./weather
./weather         # ejecutar el binario
```

La configuración se guarda en `$XDG_CONFIG_HOME/weather-cli/config.json`
(por defecto `~/.config/weather-cli/config.json`). Puedes usar otra ruta con la
variable de entorno `WEATHER_CLI_CONFIG`.

En macOS, si el binario compilado no arranca, fírmalo ad-hoc después de
compilar:

```bash
codesign --force --sign - weather
```

### Ejemplo del menú

Esta es la apariencia que deseamos crear

```bash
════════════════════════════════════════
         WEATHER CLI
════════════════════════════════════════
  1. Clima de ciudad default
  2. Clima de todas las ciudades (1)
  3. Buscar y agregar ciudad
  4. Eliminar ciudad
  5. Establecer ciudad default
  8. Ajustes (°C)
  9. Salir
════════════════════════════════════════
  Selecciona una opción: 5
```
