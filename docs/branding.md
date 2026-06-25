# Curvana — Guía de Estilo y Kit Gráfico

Esta guía define la identidad visual de **Curvana**, garantizando consistencia estética en la aplicación web, de escritorio, y en toda la documentación del repositorio.

---

## 🎨 Paleta de Colores (Tema Verde Pizarra)

Inspirada en el color de las pizarras de tiza universitarias clásicas de los cursos de cálculo, la paleta mezcla tonos verde bosque profundos con un contraste verde lima moderno y brillante.

| Color | Muestra | Nombre | Uso Principal | Variable CSS |
| :--- | :---: | :--- | :--- | :--- |
| **#08120c** | 🟢 | Slate Green Deep | Fondo de pantalla general | `--bg` |
| **#0d1a12** | 🟢 | Slate Green Panel | Fondo del panel de control | `--panel` |
| **#102216** | 🟢 | Slate Green Accent | Fondos secundarios / botones | `--panel-2` |
| **#1e3a2a** | 🟢 | Chalk Line | Bordes, grillas, líneas de división | `--line` |
| **#a3e635** | 🟢 | Lime Green Bright | Acento activo, curvas, botones primarios | `--green` |
| **#4d7c0f** | 🟢 | Lime Green Dim | Bordes inactivos, estados hover | `--green-dim` |
| **#fbbf24** | 🟡 | Amber Warning | Estados de advertencia y progreso (OCR) | `--amber` |
| **#d7ead9** | ⚪ | Chalk White | Texto principal, lectura clara | `--text` |
| **#7c9a85** | 🟢 | Muted Green | Subtítulos, etiquetas secundarias | `--muted` |

---

## ✍️ Tipografía

Para dar un aspecto limpio, moderno y de precisión matemática, se utilizan las siguientes fuentes:

- **Fuentes de Interfaz:** `Inter`, `system-ui`, `-apple-system`, `sans-serif`
  - Se utiliza para textos generales, títulos de panel, e inputs normales.
- **Fuentes de Ecuaciones y Datos:** `JetBrains Mono`, `ui-monospace`, `monospace`
  - Utilizado para inputs numéricos, campos de ecuaciones, y las mini-gráficas de componentes.
- **Ecuaciones Formateadas:** `KaTeX`
  - Para representar de forma nativa e impecable la simbología matemática en LaTeX.

---

## 📦 Elementos de Marca

### 1. Logotipo Principal
Representa un nudo toroidal en 3D (Curva paramétrica proyectada), dibujado con líneas vectoriales de precisión y un trazo suave que simula una curva trazada en la pizarra.

- **Logo PNG:** [logo.png](file:///Users/kegouro/HIBRIS/Proyectos/Curvana/docs/logo.png) (Alta resolución 512x512)
- **Logo SVG:** [logo.svg](file:///Users/kegouro/HIBRIS/Proyectos/Curvana/public/logo.svg) (Versión vectorial transparente, optimizada para la UI)

### 2. Banner del Repositorio
Banner horizontal elegante diseñado para el `README.md` del repositorio de GitHub y como imagen social preview. Muestra el título "Curvana", su bajada, y un gráfico tridimensional de la curva en perspectiva con su triedro.

- **Banner PNG:** [banner.png](file:///Users/kegouro/HIBRIS/Proyectos/Curvana/docs/banner.png) (1280x640)

---

## 💻 Directrices de Uso en el Código

1. **Favicon:**
   Se referencia directamente desde el archivo `index.html` usando el logotipo vectorial SVG:
   ```html
   <link rel="icon" href="/logo.svg" type="image/svg+xml" />
   ```

2. **Panel de Control:**
   El logotipo SVG se inyecta directamente dentro de la barra de título de la barra de control para un escalado perfecto y nítido.
