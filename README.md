# Portafolio interactivo — guía rápida

## Estructura del proyecto

```
portafolio-web/
├── index.html            ← estructura de la página (normalmente no la tocas)
├── css/
│   └── style.css         ← estilos visuales (colores, tamaños, etc.)
├── js/
│   └── app.js             ← el motor del juego (movimiento, cuartos, paneles)
├── data/
│   └── content.json       ← TODO tu contenido: textos, links, rutas de imagen
├── images/
│   ├── profile/            ← tu foto
│   ├── games/               ← carátulas de tus juegos favoritos
│   └── projects/            ← portadas de tus proyectos
└── README.md              ← este archivo
```

**Para actualizar tu información del día a día, solo necesitas tocar `data/content.json`
y agregar/reemplazar archivos dentro de `images/`.** No necesitas tocar `app.js` ni `style.css`
a menos que quieras cambiar el diseño o la mecánica.

---

## Cómo probarlo en tu computador antes de subirlo

Como `app.js` carga `data/content.json` con `fetch()`, **no funciona si abres `index.html`
haciendo doble clic** (el navegador bloquea esa carga por seguridad bajo el protocolo `file://`).
Necesitas un servidor local muy simple. Dos opciones fáciles:

**Opción A — Visual Studio Code**
1. Instala la extensión "Live Server".
2. Clic derecho sobre `index.html` → "Open with Live Server".

**Opción B — Terminal (si tienes Python instalado, viene en Mac/Linux por defecto)**
```bash
cd portafolio-web
python3 -m http.server 8000
```
Luego abre `http://localhost:8000` en tu navegador.

---

## Cómo subirlo a GitHub Pages (dominio gratuito)

1. Crea un repositorio nuevo en GitHub (público, para que Pages sea gratis).
2. Sube el contenido de esta carpeta al repositorio (puede ser directo en `main`, o dentro
   de una carpeta `/docs` — tú decides, solo ajusta la configuración en el paso 3).
3. En el repositorio: **Settings → Pages → Build and deployment → Source: "Deploy from a branch"**,
   elige la rama `main` y la carpeta (`/root` o `/docs` según dónde subiste los archivos).
4. En un par de minutos tu sitio queda publicado en:
   `https://tu-usuario.github.io/nombre-del-repositorio/`

Cada vez que hagas `git push` con cambios (por ejemplo, un `content.json` actualizado),
GitHub Pages se actualiza solo.

---

## Cómo editar tu contenido (`data/content.json`)

Es un archivo JSON: básicamente el mismo objeto de datos que ya conocías, pero ahora
vive separado del código. Reglas de JSON a tener en cuenta (a diferencia de JavaScript):
- Todas las llaves (`"nombre"`) van entre comillas dobles, siempre.
- No se permiten comas después del último elemento de una lista u objeto.
- No se permiten comentarios `//` dentro del JSON (por eso esta guía existe aparte).

Si accidentalmente rompes una coma o comilla, verás el mensaje de error de carga en la
página en lugar de una pantalla en blanco confusa — el `app.js` está preparado para avisarte.
Puedes copiar el contenido de `content.json` en [jsonlint.com](https://jsonlint.com) para
verificar que esté bien formado antes de subirlo.

### Secciones del JSON

- **`ui.es` / `ui.en`** → textos de interfaz (títulos, nombres de botones). Normalmente no
  necesitas tocar esto salvo que quieras cambiar alguna palabra de la interfaz.
- **`data.sobreMi`** → tu foto, historia, gustos, videojuegos favoritos, música.
- **`data.proyectos`** → lista de proyectos (se ordenan solos por año, agrega los que quieras).
- **`data.reconocimientos`** → lista de becas/reconocimientos culturales.
- **`data.contacto`** → tus redes y forma de contacto.

Cada texto visible para el usuario va en la forma `{ "es": "...", "en": "..." }` —
llena ambas claves para que el sitio se vea completo en los dos idiomas.

---

## Cómo agregar imágenes

1. Coloca el archivo de imagen dentro de la subcarpeta correspondiente:
   - Tu foto → `images/profile/foto.jpg`
   - Carátula de un juego favorito → `images/games/nombre-del-juego.jpg`
   - Portada de un proyecto → `images/projects/nombre-proyecto.jpg`
2. En `content.json`, apunta al archivo con esa misma ruta relativa, por ejemplo:
   ```json
   "foto": "images/profile/foto.jpg"
   ```
3. Sube la imagen junto con el resto del proyecto (el mismo `git push` de siempre).

### Efecto hover en las imágenes de proyecto

Cada proyecto tiene dos campos de imagen: `image` (la que se ve normalmente) e
`imageHover` (la que aparece con una transición suave al pasar el cursor encima,
solo en computador — en celular no aplica porque no hay "hover" real).
Si dejas `imageHover` vacío (`""`), simplemente no hay efecto y se queda la imagen normal.

**Recomendación de tamaño**: no subas fotos de varios MB directo de tu celular/cámara —
para web basta con ~800px de ancho máximo. Puedes comprimirlas gratis en
[squoosh.app](https://squoosh.app) antes de subirlas, así tu sitio carga más rápido.

Si prefieres no guardar las imágenes en el repositorio (por ejemplo, para no hacerlo pesado),
también puedes usar una URL externa (Imgur, Cloudinary, etc.) en el mismo campo, funciona igual.

---

## Cómo agregar música

En `data.sobreMi.musica`, cada entrada necesita un `title` bilingüe y una `url` de YouTube o
Spotify (el link normal que copias del navegador o de "Compartir" en la app). El sitio detecta
automáticamente cuál es y genera el reproductor embebido — no necesitas convertir nada a mano.

```json
{ "title": { "es": "Nombre", "en": "Name" }, "url": "https://www.youtube.com/watch?v=XXXXXXX" }
```

---

## Nota sobre el modo claro/oscuro

Actualmente la preferencia de tema no se guarda entre visitas (siempre inicia en modo claro).
Si quieres que recuerde la elección del usuario entre visitas, es un cambio pequeño en
`app.js` usando `localStorage` — dile a Claude cuando quieras agregar esto.
