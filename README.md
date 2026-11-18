# 🐉 Conoce un poco más sobre mí — Portafolio interactivo

Un portafolio en forma de pequeño videojuego: en vez de un scroll de arriba a
abajo, caminas con un dragoncito para descubrir quién soy, en qué he trabajado
y cómo contactarme.

**🔗 Sitio en vivo:** `https://raideos.github.io/Portafolio/`

---

## ¿Qué es esto?

Soy Carlos Becerra, desarrollador de videojuegos, y quería un espacio digital
que se sintiera coherente con lo que hago. Así que en vez del típico sitio de
portafolio, construí uno navegable, donde cada parada abre un panel con
información sobre mí, mis proyectos, otras experiencias y mis datos de contacto.

El proyecto tiene dos versiones que comparten el mismo contenido:

| Versión | Archivo | Descripción |
|---|---|---|
| **Estudio** (clásica) | `index.html` | Cuatro habitaciones en 2D que recorres de izquierda a derecha. |
| **Libro pop-up** (nueva) | `explorar.html` | Un mundo 3D sobre las páginas de un libro de cuentos: los árboles, carteles y tarjetas son recortes de papel que se levantan cuando te acercas. |

## Cómo se juega

- **Moverse**: flechas o `WASD` en computador. En celular, joystick táctil
  (versión Estudio) o tocar el suelo (versión Libro).
- **Interactuar**: acércate a una parada y presiona `E`, o haz clic/tap sobre
  ella o sobre la burbuja que aparece.
- **Navegación rápida**: los botones de arriba te llevan directo a cualquier
  sección sin tener que caminar.
- **Ver en lista** (☰, versión Libro): muestra todo el portafolio en un solo
  panel, con pestañas por sección, para quien prefiera leer sin explorar.
- **Extras**: modo claro/oscuro e idioma español/inglés. La elección se
  recuerda entre visitas.

## Características

- Contenido separado del código: todos los textos, imágenes y links viven en
  `data/content.json`, así que se puede actualizar sin tocar el motor.
- Bilingüe (ES/EN).
- Responsive: en celular los paneles de detalle ocupan toda la pantalla.
- Reproductor de música embebido (YouTube o Spotify; detecta el link
  automáticamente).
- Imágenes optimizadas en WebP para que el sitio cargue rápido.
- **Versión Libro:**
  - Recortes de papel que se levantan con un pequeño rebote al acercarte.
  - Los proyectos forman un camino: una línea de tiempo de 2014 a hoy.
  - Ambiente con movimiento: hojas al viento, árboles que se mecen, pájaros y
    sombras de nubes.
  - Modo noche con luciérnagas y un farol que lleva el personaje.
  - Paleta "cozy" en blancos cálidos y naranja claro.

## Estructura del proyecto

```
Portafolio/
├── index.html           ← versión Estudio (2D)
├── explorar.html        ← versión Libro pop-up (3D)
├── css/style.css        ← estilos compartidos (explorar.html agrega los suyos)
├── js/
│   ├── app.js           ← motor de la versión Estudio
│   └── explorar.js      ← motor de la versión Libro
├── data/content.json    ← TODO el contenido: textos, links y rutas de imagen
└── images/
    ├── profile/         ← foto de perfil
    ├── interests/       ← imágenes de "Mis gustos"
    ├── games/           ← carátulas de videojuegos favoritos
    ├── projects/        ← portadas de proyectos (normal + "-hover")
    └── favicon/         ← íconos del sitio
```

## Tecnología

- **Versión Estudio**: Canvas 2D nativo y JavaScript plano.
- **Versión Libro**: [Three.js](https://threejs.org/) (cargado desde CDN, sin
  instalar nada). El arte de papel (árboles, casa, carteles, tarjetas) se dibuja
  con código en un canvas y se usa como textura.
- El contenido se carga desde JSON con `fetch()`. No hay paso de build ni
  dependencias que instalar; la tipografía viene de Google Fonts.

---

## Guía rápida de mantenimiento

### Probar en local

Como el sitio carga `data/content.json` con `fetch()`, **no funciona abriendo
el HTML con doble clic**. Se necesita un servidor local; por ejemplo, desde la
carpeta del proyecto:

```bash
python -m http.server 8000
```

Luego abre `http://localhost:8000` (Estudio) o
`http://localhost:8000/explorar.html` (Libro). También sirve la extensión
"Live Server" de VS Code.

### Agregar o editar un proyecto

1. Pon las imágenes en `images/projects/`: una portada (`MiJuego.webp`) y,
   opcionalmente, una para el efecto hover (`MiJuego-hover.webp`).
2. En `data/content.json`, dentro de `"proyectos"`, agrega un bloque como este:

   ```json
   {
     "year": 2026,
     "title": { "es": "Mi Juego", "en": "My Game" },
     "description": { "es": "Descripción...", "en": "Description..." },
     "link": "https://usuario.itch.io/mi-juego",
     "image": "images/projects/MiJuego.webp",
     "tags": { "es": ["Unity", "PC"], "en": ["Unity", "PC"] },
     "imageHover": "images/projects/MiJuego-hover.webp"
   }
   ```

3. No hace falta ordenarlos: ambas versiones los ordenan por `year`. En la
   versión Libro aparecen solos en el camino de proyectos.

Otras secciones del JSON: `sobreMi` (historia, gustos, videojuegos, música),
`reconocimientos` y `contacto`. Para el correo usa `mailto:tu@correo.com`, así
el botón abre el programa de correo.

### Reglas del JSON

- Todas las llaves y textos van entre comillas dobles.
- **No** va coma después del último elemento de una lista u objeto.
- No se permiten comentarios.
- Cada texto visible va como `{ "es": "...", "en": "..." }`.

Si algo se rompe, el sitio muestra un aviso de error de carga. Puedes validar
el archivo en [jsonlint.com](https://jsonlint.com).

### Imágenes

- Formato recomendado: **WebP**. Portadas de proyecto de unos **1200 px** de
  ancho; fotos de gustos y videojuegos de unos **480 px** en el lado corto.
- Se pueden convertir y comprimir gratis en [squoosh.app](https://squoosh.app).
- Ojo con mayúsculas y minúsculas: en GitHub Pages `Foto.webp` y `foto.webp`
  son archivos distintos.

### Publicar (GitHub Desktop)

- `main` es lo que está publicado en GitHub Pages: cada **Push origin** sobre
  `main` actualiza el sitio en unos minutos.
- Para probar cambios grandes sin afectar el sitio, trabaja en otra rama.
  Cuando esté lista, únela a `main` con **Branch → Merge into current branch**
  (estando en `main`) y haz **Push origin**.

## Contacto

Encuéntrame en la sección de Contacto del sitio, o directamente en mis redes
(revisa `data/content.json` → `contacto` para los links actualizados).
