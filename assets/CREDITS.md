# Créditos de recursos

## `public/auth-hero.webp`

Fotografía de fondo de las pantallas de autenticación (login, registro,
verificación, recuperación de contraseña e invitación de plan).

- **Fuente:** Unsplash — https://unsplash.com/photos/6078c6bfb5c5
  (`photo-1541534741688-6078c6bfb5c5`)
- **Licencia:** [Unsplash License](https://unsplash.com/license) — uso comercial
  permitido, sin necesidad de atribución.
- **Tratamiento:** recorte 3:4 (1200×1600) y recompresión a WebP `q=68` (~70 KB),
  porque `next.config.mjs` desactiva la optimización de imágenes
  (`images.unoptimized`) y el archivo se sirve tal cual.

En la interfaz nunca se muestra sola: `auth-brand-panel.tsx` la cubre con un
lavado de `--brand-navy` y un degradado de marca, de modo que la foto queda
integrada en la paleta en lugar de competir con el formulario.

Si se sustituye por una fotografía propia, basta con reemplazar el archivo
manteniendo una relación de aspecto vertical (3:4) y regenerar el
`blurDataURL` incrustado en `auth-brand-panel.tsx`.

## Logotipos

`public/logo.png` (sobre fondo claro) y `public/logo-light.png` (sobre fondo
oscuro) son el logotipo oficial de la aplicación. `assets/logo.png` es el
original con márgenes. No se han modificado.
