<p align="right"><b>🇪🇸 Español</b> · <a href="README.en.md">🇬🇧 English</a></p>

# 〜 Curvana

**Simulador interactivo de parametrizaciones de curvas en 2D y 3D** para Cálculo 3 multivariable (Mate 023).

![Curvana](docs/screenshot.png)

Escribe una curva (en cartesianas, paramétrica o desde una biblioteca), míra cómo el parámetro `t`
la **construye** moviendo un slider, y conéctala con los temas centrales del curso: **integrales de
línea** sobre campos escalares y vectoriales, y el **análisis diferencial** de la curva (triedro de
Frenet, curvatura y longitud de arco).

> Hecho por **José Labarca** · para enseñar a parametrizar funciones y curvas en Cálculo 3.

---

## ✨ Características

- **Tres formas de entrada (modelo híbrido):**
  - **Biblioteca** de curvas estándar (recta, círculo, elipse, parábola, hélice, espiral, Lissajous,
    espiral cónica, curva de Viviani).
  - **Cartesiana**: escribe la ecuación y Curvana **deduce la parametrización** (círculos, elipses,
    parábolas, rectas, `y = f(x)`, e intersecciones 3D como cilindro ∩ plano).
  - **Paramétrica**: escribe `x(t)`, `y(t)`, `z(t)` y el rango de `t`.
- **OCR**: sube una **foto o captura** de una ecuación y se reconoce el texto para editarlo y graficarlo
  (Tesseract.js, en el navegador).
- **Animación con slider**: la curva se traza progresivamente al avanzar `t`, con play/pausa y velocidad.
- **Mini-gráficas de componentes** `x(t)`, `y(t)`, `z(t)`: muestran cómo cada coordenada arma la curva.
- **Análisis diferencial**: vector tangente, triedro de Frenet (T, N, B), curvatura `κ` y longitud de arco `s`.
- **Campos**: superpón un **campo escalar** (colorea la curva) y un **campo vectorial** (flechas), con la
  **integral de línea** `∫f ds` y `∫F·dr` acumulándose en vivo.
- **Compartir por enlace**: el estado se serializa en la URL. **Exportar PNG** del visor.
- Modos **2D** y **3D**, ecuaciones en LaTeX (KaTeX), tema verde "pizarra".

## 🏗️ Arquitectura

Separación estricta entre el **motor** y la **interfaz**:

```
src/
  core/        # Motor matemático PURO (sin DOM, sin Three.js) — 100% testeable
    vector, parser, curve, differential, integrate, fields, library, cartesian, state
  render/      # Three.js: escena, curva, triedro de Frenet, campo vectorial
  ui/          # DOM: panel de control, mini-gráficas, barra de transporte, ecuaciones
  services/ocr # OCR detrás de la interfaz OcrProvider (Tesseract por defecto)
  app.ts       # Orquesta UI ↔ core ↔ render
```

Regla de dependencia: `ui/` y `render/` dependen de `core/`, **nunca al revés**. La UI solo **representa**
lo que el núcleo calcula.

## 🚀 Desarrollo

Requiere Node 20+.

```bash
npm install
npm run dev      # servidor de desarrollo (http://localhost:5173)
npm test         # tests del núcleo matemático (Vitest)
npm run build    # build de producción a dist/
npm run preview  # previsualiza el build
```

## 🌐 Deploy a GitHub Pages

El repositorio incluye un workflow (`.github/workflows/deploy.yml`) que corre los tests, hace el build y
publica `dist/` en GitHub Pages en cada push a `main`. 

## 🖥️ Apps de escritorio (Mac / Windows / Linux)

Curvana también se empaqueta como app nativa con **Electron**.

```bash
npm run app        # corre la app de escritorio localmente
npm run dist       # genera el instalador para TU sistema operativo (en release/)
npm run dist:mac   # .dmg + .zip  (solo en macOS)
npm run dist:win   # .exe (NSIS) + portable  (solo en Windows)
npm run dist:linux # .AppImage + .deb  (solo en Linux)
```

Cada instalador debe construirse en su propio sistema operativo. Para generar los **tres a la vez**,
el repositorio incluye el workflow `.github/workflows/package.yml`, que compila en runners nativos de
GitHub (macOS, Windows y Ubuntu) al hacer push de un tag `v*` (o manualmente desde la pestaña Actions):

```bash
git tag v0.1.0 && git push --tags   # dispara el empaquetado en los tres sistemas
```

Los instaladores quedan como artefactos del workflow y, en tags, adjuntos a una GitHub Release.

## 🧪 Correctitud

El núcleo matemático está cubierto con tests que comparan contra resultados conocidos: curvatura de la
hélice y del círculo, longitud de arco (`2πr`), ortonormalidad del triedro de Frenet, integral de un
campo conservativo (`Δφ`), `∮(-y\,dx + x\,dy) = 2·área`, e identificación de cada familia de cartesianas.

## 🧰 Stack

Vite · TypeScript · Three.js · math.js · KaTeX · Tesseract.js · Vitest.

## 📄 Licencia

MIT © 2026 **José Labarca**.

---

[![DOI](https://zenodo.org/badge/1269645708.svg)](https://zenodo.org/badge/latestdoi/1269645708)

<sub>Parte del **[Pharos Project](https://kegouro.github.io)** — infraestructura científica y educativa sin barreras de entrada. · José Labarca Baeza</sub>
