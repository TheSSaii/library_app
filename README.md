# Biblioteca · App móvil

Aplicación móvil de la biblioteca, construida con **Expo + React Native + TypeScript**. Consume la API de [`library_api`](../library_api) y funciona **sin conexión**: el catálogo y los préstamos viven en SQLite y se sincronizan cuando vuelve la red.

## Stack

| Pieza | Versión |
|---|---|
| Expo SDK | 54 |
| React Native | 0.81 |
| React | 19.1 |
| Expo Router | 6 (rutas en `src/app`) |
| TypeScript | 5.9 (strict) |
| SQLite | `expo-sqlite` |
| Almacenamiento seguro | `expo-secure-store` |
| Conectividad | `@react-native-community/netinfo` |
| Cámara/galería | `expo-image-picker` + `expo-image-manipulator` |
| Pruebas | Jest + `jest-expo` + `@testing-library/react-native` |

> **Nota sobre la versión.** La guía pide SDK 57, pero el Expo Go disponible en el iPhone solo ejecuta el SDK 54. El proyecto se migró a SDK 54 conservando todo el código y las pruebas; las diferencias de API se resolvieron en `(tabs)/_layout.tsx`, `_layout.tsx` y `use-theme.ts`.

## Requisitos

- Node 22.5 o superior (probado con 22.23)
- La app **Expo Go** en el teléfono (SDK 54)
- Opcional: la API corriendo en local o desplegada

## Puesta en marcha

```bash
npm install
cp .env.example .env   # y ajusta EXPO_PUBLIC_API_URL
npx expo start
```

Escanea el QR **desde dentro de Expo Go** (*Scan QR code*), no con la cámara del sistema. También puedes entrar la URL a mano: `exp://IP-DE-TU-PC:8081`.

Si el teléfono y el PC están en redes distintas:

```bash
npx expo start --tunnel
```

Tras cambiar de SDK o de variables de entorno, limpia la caché:

```bash
npx expo start -c
```

## Variables de entorno

Solo se exponen al bundle las variables con prefijo `EXPO_PUBLIC_`. **Nunca pongas secretos aquí.**

| Variable | Ejemplo | Uso |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `https://library-api-seven-bice.vercel.app` | URL base de la API |

Opciones según dónde pruebes:

- **Producción:** la URL de Vercel (por defecto en `.env`).
- **Emulador Android:** `http://10.0.2.2:3000`
- **Simulador iOS:** `http://localhost:3000`
- **Teléfono físico contra tu PC:** `http://IP-DE-TU-PC:3000` y levantar la API con `pnpm dev:lan`.

## Comandos

```bash
npm run typecheck   # tsc --noEmit
npx expo lint       # ESLint (eslint-config-expo)
npm test            # Jest
npx expo export --platform ios      # verifica el bundle sin dispositivo
npx expo export --platform android
```

## Estructura

```
src/
├── app/                    # rutas (Expo Router)
│   ├── _layout.tsx         # providers + Stack.Protected
│   ├── sign-in.tsx
│   ├── sign-up.tsx
│   ├── (tabs)/             # Libros · Préstamos · Perfil
│   └── book/[id].tsx       # detalle, solicitud y portada
├── components/             # UI reutilizable y accesible
├── config/env.ts           # URL de la API y timeout
├── constants/theme.ts      # colores, espaciado, medidas
├── db/                     # migraciones y repositorios (toda la SQL)
├── hooks/                  # tema y consultas locales
├── lib/                    # reglas puras (estados, texto, fechas)
├── providers/              # sesión y datos (sync)
├── services/
│   ├── api/                # cliente HTTP + errores tipados
│   ├── auth/               # sesión y validación
│   ├── loans/              # reglas de préstamo
│   ├── sync/               # cola y sincronización
│   └── device/             # cámara y subida de portada
└── types/                  # contrato de datos de la API
```

## Cómo funciona la sincronización

1. **La UI siempre lee de SQLite.** Nunca espera a la red.
2. Una solicitud de préstamo se guarda primero en local (`sync_state = 'pending'`) y en la cola `outbox`.
3. Al recuperar la conexión (NetInfo) o volver a primer plano, se envía la cola en orden FIFO.
4. El envío es **idempotente** por `clientRequestId`: reintentar no duplica.
5. Después se traen los cambios del servidor: libros desde un cursor (`updatedSince`) y los préstamos del usuario.
6. Si el servidor rechaza una solicitud (409 `NO_COPIES`, `ALREADY_ACTIVE`…), **gana el servidor**: el préstamo local queda en `conflict` con el motivo visible para el usuario.

Las migraciones usan `PRAGMA user_version`; una migración publicada nunca se edita, se agrega una nueva.

## Sesión

- Los tokens se guardan en **SecureStore** (Keychain/Keystore), cada uno en su propia llave.
- El `idToken` se renueva un minuto antes de vencer; varias peticiones simultáneas comparten **una sola** renovación.
- Sin red, la sesión **no** se cierra; solo un 401/403 del servidor la invalida.
- Las rutas se protegen con `Stack.Protected` según el estado de la sesión.

## Pruebas

```bash
npm test
```

66 pruebas en 8 archivos. SQLite se ejecuta de verdad mediante un adaptador sobre `node:sqlite` (`test-utils/node-sqlite.ts`), así que las migraciones y consultas se prueban sin dispositivo.

| Archivo | Qué cubre |
|---|---|
| `api-client.test.ts` | Errores tipados, timeout, reintento tras 401 |
| `session-manager.test.ts` | SecureStore, renovación única, sesión sin red |
| `sync-service.test.ts` | Cola, conflictos, reintentos, cursor incremental |
| `database.test.ts` | Migraciones, consultas, búsqueda, restricciones |
| `offline-flow.test.ts` | Reconexión, conflicto e idempotencia de punta a punta |
| `components.test.tsx` | Estados, botones, campos y accesibilidad |
| `list-status.test.ts`, `text.test.ts` | Reglas puras |

### Integración contra la API real

Se omiten si no defines las variables `E2E_*` (nada queda escrito en el repo):

```bash
E2E_API_URL=https://library-api-seven-bice.vercel.app \
E2E_STUDENT_EMAIL=... E2E_STUDENT_PASSWORD=... \
E2E_LIBRARIAN_EMAIL=... E2E_LIBRARIAN_PASSWORD=... \
npx jest e2e-api
```

Cubren: login real, catálogo completo e incremental, solicitud offline → envío, aprobación y devolución por el bibliotecario, 403 al estudiante y recuperación automática de un token vencido.

## Qué no cubren las pruebas automáticas

Hay que probarlo en un teléfono real: permisos de cámara (concedido, denegado y denegado definitivamente), galería, modo avión real, rendimiento y experiencia táctil.

## Antes de compilar

Cambia el identificador en `app.json` (`com.estudiante.biblioteca`) por uno propio. Los permisos de cámara ya están declarados en el plugin `expo-image-picker`.
