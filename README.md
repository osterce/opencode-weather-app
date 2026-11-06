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
bun run build     # ejecutar tests y generar el binario ./weather
./weather         # ejecutar el binario
```

`bun run build` firma el binario ad-hoc automáticamente en macOS. En otros
sistemas solo compila.

La configuración se guarda en `$XDG_CONFIG_HOME/weather-cli/config.json` (por
defecto `~/.config/weather-cli/config.json`). Puedes usar otra ruta con la
variable de entorno `WEATHER_CLI_CONFIG`.

## Releases

El workflow `.github/workflows/release.yml` se ejecuta al hacer push a `main`
cuando cambia `package.json`, o manualmente desde la pestaña Actions. Lee
`version` de `package.json` y, si el tag `vX.Y.Z` todavía no existe, compila y
publica un Release con estos binarios:

- `weather-linux-x64`
- `weather-darwin-arm64`
- `weather-darwin-x64`
- `weather-windows-x64.exe`

Para publicar una versión nueva, actualiza `version` en `package.json` y haz
push a `main`.

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

### Ejecutar en macOS

macos bloquea binarios descargados de internet con un atributo de cuarentena.
Para ejecutarlo:

```bash
chmod +x weather-macos-arm64
xattr -c weather-macos-arm64
./weather-macos-arm64
```

### Ejecutar en Linux

```bash
chmod +x weather-linux-x64
./weather-linux-x64
```

### Ejecutar en Windows

Haz doble clic en 'weather-windows-x64.exe o ejecútalo desde PowerShell:

```powershell
. \weather-windows-x64.exe
```
