# 🐉 Conoce un poco más sobre mí — Portafolio interactivo

Un portafolio en forma de pequeño videojuego: en vez de un scroll de arriba a
abajo, caminas por un estudio en con un dragoncito para descubrir
quién soy, en qué he trabajado, y cómo contactarme.

**🔗 Sitio en vivo:** `https://raideos.github.io/Portafolio/`

---

## ¿Qué es esto?

Soy Carlos Becerra, desarrollador de videojuegos, y quería un espacio digital
que se sintiera coherente con lo que hago — así que en vez del típico sitio de
portafolio, construí uno navegable: cuatro habitaciones, cada una con objetos
interactivos que abren paneles con información sobre mí, mis proyectos, otras
experiencias y mis datos de contacto.

## Cómo se juega

- **Moverse**: flechas o `WASD` en computador; joystick táctil en celular.
- **Interactuar**: acércate a un objeto (aparece una burbuja) y presiona `E`,
  toca la burbuja, o haz clic/tap directo sobre el objeto.
- **Navegación rápida**: los botones de arriba te llevan directo a cualquier
  sección sin tener que caminar.
- **Extras**: modo claro/oscuro e idioma español/inglés, ambos en la esquina
  superior — la elección se recuerda entre visitas.

## Características

- 100% HTML, CSS y JavaScript "vanilla" — sin frameworks, sin paso de build,
  sin dependencias que instalar.
- Contenido separado del código: todos los textos, imágenes y links viven en
  un archivo `data/content.json`, así que se puede actualizar sin tocar el
  motor del sitio.
- Bilingüe (ES/EN) de fábrica.
- Responsive: mismo sitio, mismo código, para computador y celular.
- Reproductor de música embebido (YouTube o Spotify, detecta el link
  automáticamente).
- Efecto de imagen con hover en la línea de tiempo de proyectos.

## Estructura del proyecto

```
portafolio-web/
├── index.html
├── css/style.css
├── js/app.js
├── data/content.json
└── images/
```

## Tecnología

Canvas 2D nativo del navegador para el mundo jugable, JavaScript plano para
la lógica, y `fetch()` para cargar el contenido desde JSON. Sin librerías
externas de por medio (salvo la tipografía, vía Google Fonts).

## Contacto

Encuéntrame en la sección de Contacto del sitio, o directamente en mis redes
(revisa `data/content.json` → `contacto` para los links actualizados).
