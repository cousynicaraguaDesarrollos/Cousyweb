# Apps Script proxy para reseñas (Cousy)

Este archivo elimina la key de Google del frontend y mueve la llamada a un backend en Google Apps Script.

## 1) Crear el Web App

1. Abre `script.new` con tu cuenta de Google.
2. Crea un proyecto nuevo.
3. Pega tu script proxy local en `Code.gs` (este repo no versiona archivos `.gs`).
4. Ve a `Project Settings` -> `Script properties` y agrega:
   - `GOOGLE_PLACES_API_KEY` = tu API key de servidor
   - `COUSY_PLACE_ID` = `ChIJT9-dQ47_c48ReYqe68wQwYA`
   - `COUSY_PUBLIC_TOKEN` = token aleatorio largo (opcional pero recomendado)
   - `COUSY_ALLOWED_PLACE_IDS` = `ChIJT9-dQ47_c48ReYqe68wQwYA` (opcional)
   - `REVIEWS_CACHE_SECONDS` = `900` (opcional)
5. Deploy -> `New deployment` -> Type `Web app`:
   - Execute as: `Me`
   - Who has access: `Anyone`
6. Copia la URL `/exec`.

## 2) Conectar con el sitio

Actualiza `src/config/site.json`:

- `googleReviewsApiUrl`: URL `/exec` del web app
- `googleReviewsPlaceId`: `ChIJT9-dQ47_c48ReYqe68wQwYA`
- `googleReviewsPublicToken`: mismo token que `COUSY_PUBLIC_TOKEN`

Ejemplo:

```json
{
  "googleReviewsApiUrl": "https://script.google.com/macros/s/AKfycb.../exec",
  "googleReviewsPlaceId": "ChIJT9-dQ47_c48ReYqe68wQwYA",
  "googleReviewsPublicToken": "pon-aqui-un-token-largo"
}
```

## 3) Verificacion rapida

1. Prueba directa en navegador:
   - `https://.../exec?action=ping`
   - Debe responder `{"ok":true,...}`
2. Prueba con parametros:
   - `https://.../exec?placeId=ChIJT9-dQ47_c48ReYqe68wQwYA&lang=es&token=TU_TOKEN`
3. Corre el build del sitio:
   - `npm run build`
4. Publica:
   - `npm run build:pages`

## 4) Notas de seguridad importantes

- La API key ya no queda en el HTML/JS del cliente.
- El endpoint del Web App sigue siendo publico (porque la web es publica).
- El token ayuda a reducir abuso casual, pero no es secreto absoluto en un sitio estatico.
- Para seguridad fuerte (firma por headers, IP rules, WAF), migra el proxy a Cloud Run/Functions.
