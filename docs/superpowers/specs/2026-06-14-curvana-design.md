# Curvana — Documento de diseño

**Fecha:** 2026-06-14
**Autor:** José Labarca
**Estado:** Aprobado

## Propósito

Curvana es un **simulador interactivo de parametrizaciones** para Cálculo 3 / Mate 023.
Permite enseñar a parametrizar curvas en **2D y 3D**, visualizar cómo el parámetro `t`
"construye" la curva al avanzar un slider, y conectar la parametrización con los temas
centrales del curso: **integrales de línea** sobre campos escalares y vectoriales, y
**análisis diferencial** de curvas (vector tangente, normal, binormal / triedro de Frenet,
longitud de arco y curvatura).

## Audiencia y uso

- **Profesor en clase:** carga ejemplos rápidos desde la biblioteca y proyecta la animación.
- **Alumno explorando:** escribe sus propias curvas, sube una foto/captura de una ecuación
  (OCR) y comparte un enlace con un caso específico.

## Stack

- **Vite + TypeScript** (proyecto modular, tipado).
- **Three.js** para el render 3D.
- **math.js** para parsear y evaluar expresiones.
- **KaTeX** para renderizar ecuaciones (cartesiana y parametrización).
- **Tesseract.js** para OCR en el cliente (detrás de una interfaz `OcrProvider`).
- **Vitest** para tests del núcleo matemático.
- Deploy automático a **GitHub Pages** vía GitHub Actions.
- Tema visual verde "pizarra".

## Principio arquitectónico: separación backend (lógica) / frontend (presentación)

Regla de dependencia estricta:

- `core/` es el **motor matemático puro**: no importa Three.js, no toca el DOM.
  Es determinista y 100% testeable de forma aislada.
- `render/` (Three.js) y `ui/` (DOM) **solo consumen y representan** lo que `core/` calcula.
- Dirección de dependencias: `ui/`, `render/` → `core/`. **Nunca** al revés.
- Los servicios externos (OCR) viven detrás de interfaces (`services/ocr/OcrProvider`),
  de modo que la UI no conoce la implementación concreta.

## Arquitectura por módulos

### `core/` — matemática pura (sin DOM, sin Three.js)

- `types.ts` — tipos compartidos (`Vec3`, `CurveModel`, `ParamExpr`, `AppState`, etc.).
- `vector.ts` — utilidades vectoriales (suma, cruz, norma, normalizar).
- `parser.ts` — envoltura de math.js: compila expresiones de `t` (y de `x,y,z` para campos),
  con mensajes de error amigables.
- `curve.ts` — modelo de curva `r(t) = (x(t), y(t), z(t))`; evalúa el punto y deriva
  numéricamente `r'(t)`, `r''(t)` (diferencias centradas).
- `differential.ts` — tangente unitaria `T`, normal `N`, binormal `B` (Frenet),
  curvatura `κ = |r' × r''| / |r'|³`, y longitud de arco `s(t)`.
- `fields.ts` — campo escalar `f(x,y,z)` y vectorial `F(x,y,z)`; integrandos de
  `∫ f ds` y `∫ F · dr`.
- `integrate.ts` — cuadratura numérica (regla compuesta) acumulada hasta `t`.
- `library.ts` — catálogo de curvas estándar: nombre, cartesiana (LaTeX), parametrización,
  rango de `t` por defecto y parámetros editables.
- `cartesian.ts` — reconocedor de ecuaciones cartesianas comunes → parametrización.
- `state.ts` — estado serializable ↔ URL (compartir por enlace).

### `render/` — Three.js

- `scene.ts` — escena, cámara orbital, ejes, grilla, luces, redimensionado.
- `curveMesh.ts` — curva completa tenue + tramo trazado hasta `t` brillante + punto móvil.
- `frame.ts` — flechas del triedro `T`, `N`, `B` en el punto móvil.
- `fieldViz.ts` — flechas del campo vectorial en una grilla y coloreado del campo
  escalar a lo largo de la curva.

### `ui/` — paneles (DOM)

- `controlPanel.ts` — modo 2D/3D, selector de entrada (Biblioteca / Cartesiana / Paramétrica),
  inputs `x(t),y(t),z(t)`, rango de `t`, toggles (tangente, Frenet, campos), zona de OCR.
- `componentPlots.ts` — mini-gráficas `x(t), y(t), z(t)` (canvas 2D) con el punto en `t`.
- `transportBar.ts` — slider de `t`, play/pausa, velocidad y lecturas
  (`t`, `s`, `∫ f ds`, `∫ F · dr`, `κ`).
- `equationView.ts` — render LaTeX de la cartesiana y la parametrización.

### `services/ocr/`

- `OcrProvider.ts` — interfaz `recognize(image): Promise<string>`.
- `TesseractProvider.ts` — implementación por defecto (cliente, gratis).
- (Futuro) `MathpixProvider.ts` — vía función serverless, sin tocar la UI.

### `app.ts`

Orquesta UI ↔ core ↔ render: mantiene el estado, recompila la curva al cambiar la entrada,
y en el loop de animación pide al core los valores para el `t` actual y actualiza render y UI.

## Flujo de datos

1. El usuario elige/escribe una curva (biblioteca, cartesiana o paramétrica) o sube una imagen (OCR).
2. `parser` / `cartesian` producen un `CurveModel`.
3. Al mover el slider `t`: `core` calcula el punto `r(t)`, `T/N/B`, `κ`, `s(t)` y las integrales.
4. `render` actualiza el 3D; `componentPlots` y `transportBar` actualizan gráficas y lecturas.
5. `state` se sincroniza con la URL para compartir.

## Reconocedor de cartesianas (modo automático)

Familias soportadas (las útiles en Mate 023):

- Recta, círculo y elipse, parábola.
- Gráfica `y = f(x)` (2D) → `x = t, y = f(t)`.
- Intersecciones típicas en 3D: cilindro ∩ plano, esfera ∩ plano, y gráfica `z = f(x,y)`
  evaluada sobre una curva del plano `xy`.

Si la entrada no se reconoce, se informa con claridad y se sugiere usar el modo paramétrico.

## Manejo de errores

- Parser: mensajes claros (variable desconocida, recordar usar `t`), resaltado del campo
  con error y se mantiene la última curva válida (la escena no se rompe).
- Cartesiana no reconocida: mensaje explicativo + sugerencia de modo paramétrico.
- Puntos no finitos o singularidades: se omiten del trazo.

## Testing

`core/` con Vitest contra resultados conocidos:

- Curvatura de la hélice (constante) y del círculo (`1/r`).
- Longitud de arco del círculo (`2πr`) y de la hélice.
- `∫ F · dr` en un campo conservativo = diferencia de potencial.
- `∫ f ds` con `f = 1` = longitud de arco.
- Reconocedor de cartesianas para cada familia.
- Vectores `T`, `N`, `B` ortonormales.

Render/UI: pruebas ligeras de montaje y de que el slider actualice el estado.

## Roadmap por hitos (commits incrementales)

1. Andamiaje Vite + TS + escena 3D + una curva trazándose con el slider.
2. Entrada paramétrica + parser + mini-gráficas de componentes + modos 2D/3D.
3. Biblioteca + LaTeX + compartir por URL.
4. Análisis diferencial (T/N/B, κ, s).
5. Campos escalar/vectorial + integrales de línea.
6. Reconocedor de cartesianas.
7. OCR (Tesseract) + pulido visual (verde Curvana) + deploy a GitHub Pages + README.

## Fuera de alcance (YAGNI por ahora)

- Mathpix / OCR de manuscrito (se deja el hueco vía `OcrProvider`).
- Export de GIF/video.
- Superficies (la app es de curvas).
