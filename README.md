<p align="right"><a href="README.md">Versión en Español</a> · <a href="README.en.md">English Version</a></p>

<p align="center">
  <img src="docs/banner.png" alt="Curvana Banner" width="100%">
</p>

# Curvana: Simulador Interactivo de Parametrizaciones de Curvas en 2D y 3D para Cálculo Multivariable

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.21303284.svg)](https://doi.org/10.5281/zenodo.21303284)
[![Release](https://img.shields.io/github/v/release/kegouro/curvana?style=flat-square)](https://github.com/kegouro/curvana/releases/tag/v0.1.2)
[![Live](https://img.shields.io/badge/demo-kegouro.github.io%2Fcurvana-7c5cff?style=flat-square)](https://kegouro.github.io/curvana/)

Curvana es una plataforma educativa y de simulación científica orientada a la visualización rigurosa e interactiva de parametrizaciones de curvas, geometría diferencial clásica e integrales de línea de campos tanto escalares como vectoriales. Concebida como una herramienta pedagógica para la enseñanza de Cálculo Multivariable (particularmente en cursos universitarios de ingeniería y ciencias físicas), la herramienta permite a estudiantes y docentes analizar de forma dinámica la interconexión entre la descripción algebraica de una curva, sus propiedades geométricas intrínsecas y el comportamiento de campos físicos o matemáticos definidos sobre su trayectoria.

---

## Tabla de Contenidos
1. Fundamentos Matemáticos Implementados
2. Arquitectura de Software y Módulos
3. Características y Modos de Entrada
4. Optimización de Rendimiento y Algoritmos
5. Verificación Científica y Suite de Pruebas
6. Guía de Configuración y Desarrollo
7. Compilación y Distribución
8. Licencia y Citas

---

## 1. Fundamentos Matemáticos Implementados

La aplicación ejecuta cálculos numéricos y simbólicos en tiempo real basados en los siguientes modelos teóricos de la geometría diferencial y el análisis multivariable:

### Parametrización de Curvas
Una curva $C$ en el espacio tridimensional se describe mediante una función vectorial continua de una variable real:
$$\mathbf{r}(t) = (x(t), y(t), z(t)), \quad t \in [t_{\min}, t_{\max}]$$
Para curvas en el plano bidimensional, se omite la componente $z(t)$.

### Geometría Diferencial de la Curva (Triedro de Frenet-Serret)
Para cada instante del parámetro $t$, el sistema calcula la base ortonormal móvil que caracteriza la geometría local de la curva, asumiendo que la curva es regular ($\|\mathbf{r}'(t)\| \neq 0$):
- **Vector Tangente Unitario ($\mathbf{T}$)**: Señala la dirección instantánea del movimiento.
  $$\mathbf{T}(t) = \frac{\mathbf{r}'(t)}{\|\mathbf{r}'(t)\|}$$
- **Vector Normal Unitario ($\mathbf{N}$)**: Apunta hacia el centro de curvatura de la trayectoria.
  $$\mathbf{N}(t) = \frac{\mathbf{T}'(t)}{\|\mathbf{T}'(t)\|}$$
- **Vector Binormal Unitario ($\mathbf{B}$)**: Define el plano osculador junto con $\mathbf{T}$.
  $$\mathbf{B}(t) = \mathbf{T}(t) \times \mathbf{N}(t)$$
- **Curvatura ($\kappa$)**: Cuantifica qué tan rápido la curva cambia de dirección respecto a su longitud de arco.
  $$\kappa(t) = \frac{\|\mathbf{r}'(t) \times \mathbf{r}''(t)\|}{\|\mathbf{r}'(t)\|^3}$$
- **Longitud de Arco ($s$)**: Distancia acumulada recorrida a lo largo de la curva desde el límite inferior:
  $$s(t) = \int_{t_{\min}}^{t} \|\mathbf{r}'(\tau)\| \, d\tau$$

### Integrales de Línea
- **Sobre un Campo Escalar $f(x, y, z)$**: Representa magnitudes acumuladas como la masa de un filamento con densidad variable.
  $$\int_{C} f \, ds = \int_{t_{\min}}^{t_{\max}} f(\mathbf{r}(t)) \|\mathbf{r}'(t)\| \, dt$$
- **Sobre un Campo Vectorial $\mathbf{F}(x, y, z)$**: Cuantifica el trabajo físico realizado por una fuerza a lo largo de la trayectoria.
  $$\int_{C} \mathbf{F} \cdot d\mathbf{r} = \int_{t_{\min}}^{t_{\max}} \mathbf{F}(\mathbf{r}(t)) \cdot \mathbf{r}'(t) \, dt$$

---

## 2. Arquitectura de Software y Módulos

El proyecto sigue una estricta separación de responsabilidades a través de una arquitectura desacoplada basada en capas. Esto garantiza la testabilidad y el mantenimiento del motor matemático central sin dependencias de la interfaz de usuario o las tecnologías de renderizado.

```
src/
  core/        # Capa Matemática Pura (sin DOM, independiente de Three.js)
    vector     # Operaciones vectoriales tridimensionales de bajo nivel
    parser     # Validador sintáctico y compilador de expresiones con math.js
    curve      # Representación y muestreo de funciones vectoriales
    differential # Derivación numérica, triedro de Frenet y curvatura
    fields     # Definición de campos matemáticos e integrales de línea
    interpolator # Rejillas de precomputación e interpolación lineal O(1)
    cartesian  # Reconocimiento algebraico y parametrización automática
    state      # Modelado de estado interno y serialización de URL
  render/      # Motor Gráfico WebGL (con Three.js)
    scene      # Inicialización y administración del Viewport 3D
    curveMesh  # Renderizado de trayectorias con soporte para discontinuidades
    frame      # Representación visual del triedro de Frenet-Serret
    fieldViz   # Visualización espacial de campos vectoriales mediante flechas
  ui/          # Interfaz de Usuario y DOM (Vainilla CSS y HTML5)
    controlPanel # Formularios de entrada paramétrica, cartesiana y biblioteca
    componentPlots # Gráficos 2D de coordenadas x(t), y(t), z(t) en canvas
    transportBar # Controladores de reproducción temporal, slider y velocidad
    equationView # Renderizado matemático interactivo con KaTeX
  services/ocr # Módulo de Reconocimiento Óptico de Caracteres
    OcrProvider  # Proveedor abstracto y normalizador de texto OCR
    TesseractProvider # Integración directa con el motor Tesseract.js
  app.ts       # Orquestador del ciclo de vida global de la aplicación
```

La regla fundamental de dependencia es jerárquica y unidireccional: las capas `ui/` y `render/` dependen directamente de `core/`, pero la capa `core/` no tiene conocimiento alguno de la interfaz gráfica, lo que facilita su ejecución y prueba en entornos headless (como Node.js o suites de CI).

---

## 3. Características y Modos de Entrada

Curvana ofrece un flujo de trabajo altamente versátil a través de tres modos de interacción matemática (modelo de entrada híbrido):

### Biblioteca de Curvas Estándar
Acceso inmediato a trayectorias paramétricas clásicas útiles para analizar propiedades físicas o geométricas. Incluye: rectas segmentadas, circunferencias, elipses, parábolas parabólicas, hélices cilíndricas tridimensionales, espirales logarítmicas, curvas de Lissajous, espirales cónicas y la Curva de Viviani (intersección entre una esfera y un cilindro tangente).

### Reconocimiento de Ecuaciones Cartesianas
Permite al usuario ingresar una ecuación algebraica convencional para que el sistema deduzca e implemente automáticamente su parametrización equivalente en 2D o 3D:
- Reconoce rectas en el plano ($ax + by = c$).
- Proyecta funciones explícitas del tipo $y = f(x)$ usando la parametrización natural $\mathbf{r}(t) = (t, f(t))$.
- Resuelve cónicas generales como circunferencias ($x^2 + y^2 = R^2$) y elipses ($x^2/a^2 + y^2/b^2 = 1$).
- Identifica de forma simbólica intersecciones espaciales complejas en 3D, tales como cilindros coplanares en los planos proyectivos $xy$, $yz$ o $xz$ intersectados con planos oblicuos (por ejemplo, el sistema de ecuaciones cartesianas $x^2 + z^2 = 9, y = 2x + 1$).

### Entrada Paramétrica Libre
Permite escribir fórmulas personalizadas para las funciones coordenadas $x(t)$, $y(t)$ y $z(t)$ utilizando una sintaxis matemática robusta suministrada por `math.js`, definiendo el intervalo continuo $[t_{\min}, t_{\max}]$.

### Procesamiento de Ecuaciones por OCR
Soporta la carga directa o captura fotográfica de ecuaciones algebraicas y paramétricas. Mediante un proveedor OCR basado en `Tesseract.js` en el navegador, extrae el texto, filtra el ruido sintáctico, normaliza la notación y carga la parametrización resultante directamente en la aplicación.

---

## 4. Optimización de Rendimiento y Algoritmos

Con el objetivo de garantizar animaciones a 60 fotogramas por segundo (FPS) sin provocar sobrecarga de cómputo en la CPU ni problemas de basura en memoria (garbage collection), el sistema implementa mecanismos avanzados de precomputación e interpolación:

### Precálculo Estático del Muestreo ( Simpson e Interpolación O(1) )
En lugar de evaluar la regla de integración numérica de Simpson sobre toda la longitud recorrida en cada ciclo del bucle de animación (operación que se volvería más costosa a medida que $t$ avanza hacia $t_{\max}$), Curvana precalcula un arreglo estático indexado durante la fase de compilación de la curva.
- Se divide el intervalo total en una rejilla homogénea de 400 subintervalos.
- Se evalúa de antemano el valor acumulado de la longitud de arco $s(t)$ y de las integrales de línea escalar y vectorial para cada uno de los nodos de la rejilla.
- Durante el ciclo de animación en tiempo real, el valor de la integral para cualquier parámetro arbitrario $t$ se aproxima en tiempo constante $O(1)$ realizando una interpolación lineal entre los dos nodos más cercanos de la rejilla.

### Evitación de Reflujos de Diseño (Layout Thrashing)
El módulo `componentPlots.ts` utiliza un observador de cambios de tamaño (`ResizeObserver`) para actualizar las dimensiones de los lienzos canvas HTML5 únicamente en respuesta a eventos de redimensionamiento de ventana. Esto evita invocar métodos costosos como `getBoundingClientRect()` o actualizar estilos geométricos dentro de los ciclos de dibujo iterativos, suprimiendo las advertencias de rendimiento del navegador.

### Validación de Expresiones Mediante Recorrido del Árbol Sintáctico (AST)
El compilador de expresiones de `parser.ts` analiza la sintaxis matemática mediante la construcción del árbol sintáctico abstracto (AST) con `math.parse`. En lugar de evaluar la función en puntos aleatorios para verificar su validez, el sistema recorre el árbol de nodos de forma estática garantizando que:
- Todos los identificadores correspondan a variables permitidas (por ejemplo, $t$ en curvas paramétricas, o bien $x, y, z$ en campos) o a constantes y funciones legítimas de `math.js`.
- No existan operadores binarios mal formados o consecutivos.
- No se introduzcan métodos de prototipo u objetos no numéricos que comprometan la seguridad de la ejecución.

---

## 5. Verificación Científica y Suite de Pruebas

El sistema incluye una amplia cobertura de pruebas unitarias y de integración desarrolladas bajo la suite `Vitest`. Las pruebas garantizan la correctitud de los cálculos comparándolos con soluciones analíticas clásicas de la física y las matemáticas multivariables:

- **Ortonormalidad del Triedro Móvil**: Comprobación de que para toda curva regular evaluada, los vectores $\mathbf{T}$, $\mathbf{N}$ y $\mathbf{B}$ tienen magnitud unitaria y son mutuamente ortogonales en todo instante ($\mathbf{T} \cdot \mathbf{N} = 0$, $\mathbf{T} \cdot \mathbf{B} = 0$, $\|\mathbf{B}\| = 1$).
- **Curvatura Analítica**: Validación matemática del cálculo numérico contra valores teóricos conocidos, como la curvatura constante de un círculo de radio $R$ ($\kappa = 1/R$) y de una hélice regular.
- **Teoremas de Integración (Campos Conservativos)**: Verificación de que la integral de línea de un campo vectorial conservativo $\mathbf{F} = \nabla \phi$ sobre una curva depende exclusivamente de los puntos de frontera, cumpliendo el Teorema Fundamental del Cálculo para Integrales de Línea:
  $$\int_{C} \nabla \phi \cdot d\mathbf{r} = \phi(\mathbf{r}(t_{\max})) - \phi(\mathbf{r}(t_{\min}))$$
- **Aplicación del Teorema de Green**: Comprobación en curvas planas cerradas de que la integral de línea del campo vectorial $\mathbf{F} = (-y, x)$ corresponde exactamente a dos veces el área delimitada por la elipse o círculo parametrizado.
- **Robustez ante Singularidades**: Comprobación de que trayectorias con asíntotas o coordenadas no finitas (como $y = 1/t$ en entornos que contienen al cero) son aisladas correctamente por el renderizador `curveMesh.ts`, evitando el trazado erróneo de segmentos dirigidos hacia el origen $(0,0,0)$.

---

## 6. Guía de Configuración y Desarrollo

### Requisitos del Sistema
- Node.js versión 20.0.0 o superior.
- Administrador de paquetes npm (incluido con Node.js).

### Instalación de Dependencias
Clone el repositorio en su máquina local y acceda a la carpeta raíz del proyecto para descargar los paquetes requeridos:
```bash
git clone https://github.com/kegouro/curvana.git
cd curvana
npm install
```

### Ejecución en Servidor de Desarrollo
Para levantar el servidor de desarrollo local interactivo con Vite:
```bash
npm run dev
```
La aplicación estará disponible en la dirección local indicada por la terminal, por defecto: `http://localhost:5173`.

### Ejecución de Pruebas Unitarias e Integración
Para ejecutar el banco de pruebas completo una sola vez:
```bash
npm run test
```
Para activar el modo de observación continua (watch mode) de las pruebas durante el desarrollo:
```bash
npm run test:watch
```

---

## 7. Compilación y Distribución

### Compilación Web para Producción
Para generar los archivos optimizados listos para su distribución y alojamiento en la web:
```bash
npm run build
```
Este comando ejecuta la comprobación de tipos de TypeScript y compila el bundle estático en la carpeta `dist/`.

### Empaquetado para Escritorio (Electron)
Curvana se puede distribuir de manera nativa en sistemas operativos de escritorio.

Para ejecutar la aplicación en el entorno Electron de desarrollo local:
```bash
npm run app
```

Para generar los instaladores empaquetados específicos para su plataforma local (los archivos compilados se almacenarán en el directorio `release/`):
```bash
npm run dist
```

Adicionalmente, se disponen de scripts dedicados por plataforma:
- **macOS (DMG y ZIP)**: `npm run dist:mac`
- **Windows (Instalador NSIS y Portable)**: `npm run dist:win`
- **Linux (AppImage y paquete DEB)**: `npm run dist:linux`

Los flujos de integración continua del repositorio ejecutan compilaciones cruzadas en servidores nativos de GitHub Actions al crear etiquetas de lanzamiento (tags que coincidan con el patrón `v*`), publicando automáticamente los binarios generados en las versiones de lanzamiento (Releases) del repositorio.

---

## 8. Licencia y Citas

Este software se distribuye bajo los términos de la Licencia de Código Abierto MIT. El código fuente es de libre acceso, modificación y distribución comercial o académica bajo los términos descritos en el archivo LICENSE.

### Registro Digital (DOI)
El proyecto cuenta con registro en Zenodo para su citación formal en investigaciones científicas u obras educativas. Puede consultar el identificador de objeto digital (DOI) y el archivo de especificación en formato CITATION.cff para obtener los metadatos de referencia en BibTeX o RIS.

<sub>Curvana forma parte del Proyecto Pharos, un esfuerzo tecnológico orientado al desarrollo de infraestructura científica y educativa sin barreras de entrada para estudiantes y científicos a nivel global. · Diseñado e implementado por José Labarca Baeza.</sub>
