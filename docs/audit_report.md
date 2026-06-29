# Reporte de Auditoría y Control de Calidad — Curvana

Este documento presenta un análisis minucioso de la arquitectura, el rendimiento y la robustez del simulador **Curvana**, identificando fallos lógicos, cuellos de botella en la visualización, limitaciones matemáticas y propuestas de optimización.

---

## 1. Bugs de Lógica y Validaciones Matemáticas

### 🔴 Bug 1: Rechazo de Ecuaciones Válidas por Punto de Prueba Fijo (`t = 0.41`)
* **Ubicación:** [parser.ts](file:///Users/kegouro/HIBRIS/Proyectos/Curvana/src/core/parser.ts#L38-L56)
* **Gravedad:** Alta (Afecta la usabilidad principal)
* **Descripción:** Para verificar que una ecuación paramétrica no tiene variables no declaradas y devuelve números reales, el parser compila la expresión y la evalúa en un único punto fijo `t = 0.41`.
* **Caso Extremo Fallido:** Si un usuario escribe una curva perfectamente válida en su rango de definición pero indefinida en `t = 0.41` (por ejemplo, `x(t) = log(t - 1)` en el rango `t ∈ [2, 5]`, o `x(t) = sqrt(-t)` en el rango `t ∈ [-5, -1]`), la evaluación de prueba dará como resultado un número complejo (en `math.js`) u otro error. El parser lo interpretará como no numérico y lanzará un error de validación, impidiendo al usuario graficarla.
* **Solución propuesta:** En lugar de evaluar en un punto fijo, el parser debe analizar el árbol sintáctico (AST) generado por `math.parse` para verificar que los únicos nodos de tipo `SymbolNode` corresponden a variables autorizadas (`t` o constantes de math.js como `pi`, `e`). Esto valida la sintaxis sin ejecutar y sin depender del dominio del parámetro.

---

### 🔴 Bug 2: Bucle Infinito Hacia el Infinito Negativo (`tMin >= tMax`)
* **Ubicación:** [controlPanel.ts](file:///Users/kegouro/HIBRIS/Proyectos/Curvana/src/ui/controlPanel.ts#L103) y [app.ts](file:///Users/kegouro/HIBRIS/Proyectos/Curvana/src/app.ts#L317-L324)
* **Gravedad:** Alta (Causa inestabilidad en la animación)
* **Descripción:** No hay validación en el panel de control que asegure que el límite inferior `t mín` sea menor que el superior `t máx`. Si el usuario introduce valores tales que `tMin >= tMax` (por ejemplo, `tMin = 2`, `tMax = 0` o dejándolos en blanco, lo que se parsea como `0`):
  1. El rango `span = tMax - tMin` se vuelve negativo.
  2. En el bucle de animación, la actualización del parámetro es `t += speed * span * dt / SWEEP_MS`, lo que causa que `t` decrezca hacia $-\infty$.
  3. El control de bucle `if (t >= tMax)` nunca se cumple porque `t` decrece y se aleja de `tMax`. La animación continúa retrocediendo infinitamente.
* **Solución propuesta:** Añadir una validación en `submitParam()` de `controlPanel.ts` que muestre un error descriptivo si `tMin >= tMax` o si alguno es `NaN`.

---

### 🟡 Bug 3: Truncamiento de Ecuaciones Multilínea en el OCR
* **Ubicación:** [OcrProvider.ts](file:///Users/kegouro/HIBRIS/Proyectos/Curvana/src/services/ocr/OcrProvider.ts#L12-L17)
* **Gravedad:** Media (Rompe la funcionalidad OCR para curvas 3D)
* **Descripción:** La función `cleanOcrText` toma el texto reconocido por Tesseract, aplica un split por salto de línea (`\n`) y **solo se queda con la primera línea**.
* **Caso Extremo Fallido:** Si un usuario sube una imagen con una intersección 3D (definida por dos ecuaciones escritas en líneas separadas, por ejemplo, `x^2 + y^2 = 4` y `z = x + y`), el OCR desechará por completo la segunda ecuación. Como resultado, la aplicación la interpretará como una curva en 2D y fallará al representar la intersección 3D real.
* **Solución propuesta:** Limpiar el texto línea por línea y unirlas usando el delimitador de intersección ` ∩ ` o un salto de línea limpio, permitiendo que el motor de cartesianas procese ambas expresiones.

---

### 🟡 Bug 4: Representación Falsa de Singularidades hacia el Origen `(0,0,0)`
* **Ubicación:** [curveMesh.ts](file:///Users/kegouro/HIBRIS/Proyectos/Curvana/src/render/curveMesh.ts#L52-L56)
* **Gravedad:** Media (Error visual/didáctico)
* **Descripción:** Al muestrear puntos para dibujar la curva en Three.js, si un punto evalúa a un valor no finito (por ejemplo, división por cero en `1/t` para `t = 0`), el visualizador reemplaza las coordenadas indefinidas por `0`.
* **Caso Extremo Fallido:** En una hipérbola como `y = 1/t` en `t ∈ [-1, 1]`, la curva se representará con un segmento continuo que baja a $-\infty$, cruza abruptamente por el origen físico `(0,0,0)`, y sube hacia $+\infty$. Esto es matemáticamente erróneo e introduce líneas residuales confusas en la escena 3D.
* **Solución propuesta:** Detectar valores no finitos y omitir la adición de dicho segmento en la geometría, o bien separar el trazado en múltiples sub-líneas independientes.

---

## 2. Cuellos de Botella de Rendimiento (Performance)

### 🔴 Rendimiento 1: Carga Excesiva de Evaluaciones en Cada Frame ($O(N)$ vs $O(1)$)
* **Ubicación:** [fields.ts](file:///Users/kegouro/HIBRIS/Proyectos/Curvana/src/core/fields.ts#L43-L60) e [integrate.ts](file:///Users/kegouro/HIBRIS/Proyectos/Curvana/src/core/integrate.ts)
* **Descripción:** La longitud de arco y las integrales de línea de campos escalares/vectoriales se evalúan utilizando cuadratura numérica (regla de Simpson) con $N = 400$ muestras en cada frame de la animación. Esto provoca que el motor math.js evalúe fórmulas compiladas en JS más de 1,200 veces por frame, lo cual sobrecarga drásticamente la CPU y drena batería.
* **Solución propuesta:** Dado que la curva es estática durante la animación (solo se desplaza el parámetro de reproducción), las integrales acumuladas se pueden precalcular en $N$ puntos de control al cargar la curva. En cada frame de animación, el valor para el `t` actual se obtiene en $O(1)$ mediante una interpolación lineal rápida de los datos precalculados.

---

### 🔴 Rendimiento 2: Layout Thrashing (Reflow del Navegador) a 60 FPS
* **Ubicación:** [componentPlots.ts](file:///Users/kegouro/HIBRIS/Proyectos/Curvana/src/ui/componentPlots.ts#L63-L65)
* **Descripción:** En la función `draw()` de las minigráficas 2D, se ejecuta `canvas.getBoundingClientRect()` y se reasigna `canvas.width` y `canvas.height` en **cada llamada de redibujado** (que ocurre a cada frame durante la animación). Esto provoca layout thrashing porque fuerza al navegador a recalcular estilos geométricos en el hilo principal antes de pintar el siguiente frame.
* **Solución propuesta:** Separar la lógica de redimensionamiento de la de pintado. El tamaño de los canvases debe calcularse únicamente cuando ocurra un evento de redimensionamiento de ventana (`resize`) o mediante un `ResizeObserver` global, no en cada frame del bucle de animación.

---

## 3. Experiencia de Usuario y Sugerencias de Arquitectura

### 💡 Sugerencia 1: Soporte de Cilindros en Planos Cruzados (`yz` y `xz`)
* **Ubicación:** [cartesian.ts](file:///Users/kegouro/HIBRIS/Proyectos/Curvana/src/core/cartesian.ts#L295-L336)
* **Descripción:** El reconocedor de intersecciones 3D solo detecta cilindros definidos en el plano `xy` (`x^2 + y^2 = R^2`) intersecados con una tapa `z = g(x,y)`.
* **Mejora:** En Cálculo 3, es sumamente común trabajar con cilindros paralelos a otros ejes, como `y^2 + z^2 = 9` (cilindro horizontal) cortado por un plano `x = 2`. Ampliar `recognizePair` para que soporte cilindros en los tres planos coordenados enriquecería el valor pedagógico de la herramienta.

---

### 💡 Sugerencia 2: Insensibilidad a Mayúsculas/Minúsculas en Entrada Paramétrica
* **Ubicación:** [parser.ts](file:///Users/kegouro/HIBRIS/Proyectos/Curvana/src/core/parser.ts#L25)
* **Descripción:** Las entradas paramétricas y de campos escalares/vectoriales son sensibles a mayúsculas. Escribir `COS(T)` o `X^2 + Y^2` resulta en un error de compilación.
* **Mejora:** Aplicar un formateo previo a minúsculas (`toLowerCase()`) en las expresiones del usuario antes de pasarlas a compilación, tal como ya se hace con las ecuaciones cartesianas.

---

### 💡 Sugerencia 3: Falta de Retroalimentación de Error en Campos
* **Ubicación:** [app.ts](file:///Users/kegouro/HIBRIS/Proyectos/Curvana/src/app.ts#L201-L212)
* **Descripción:** Cuando el usuario introduce una fórmula de campo escalar o vectorial inválida (por ejemplo, con errores de sintaxis), la app captura silenciosamente el error y deshabilita la capa sin notificar al usuario.
* **Mejora:** Colocar un elemento de mensaje debajo de los inputs de capas (similar al de parametrización cartesiana y paramétrica) para mostrar qué error matemático o sintáctico ocurrió.

---

### 💡 Sugerencia 4: OCR Offline para el Entorno de Escritorio (Electron)
* **Ubicación:** [TesseractProvider.ts](file:///Users/kegouro/HIBRIS/Proyectos/Curvana/src/services/ocr/TesseractProvider.ts#L8)
* **Descripción:** Tesseract.js descarga por defecto los archivos de entrenamiento lingüístico (`eng.traineddata`) desde un CDN externo (como UNPKG). Si el simulador se ejecuta offline (muy probable en su empaquetado de escritorio con Electron), la función OCR fallará silenciosamente mostrando un error genérico.
* **Mejora:** Configurar Tesseract.js para cargar los modelos lingüísticos y los scripts del worker desde recursos locales empaquetados en la distribución de la app, permitiendo un funcionamiento 100% offline.
