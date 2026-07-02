<p align="right"><a href="README.md">Spanish Version</a> · <a href="README.en.md">English Version</a></p>

<p align="center">
  <img src="docs/banner.png" alt="Curvana Banner" width="100%">
</p>

# Curvana: Interactive Simulator of 2D and 3D Curve Parametrizations for Multivariable Calculus

Curvana is an educational and scientific simulation platform oriented towards the rigorous and interactive visualization of curve parametrizations, classical differential geometry, and line integrals over both scalar and vector fields. Conceived as a pedagogical tool for teaching Multivariable Calculus (particularly in university courses of engineering and physical sciences), the tool allows students and instructors to dynamically analyze the interconnection between the algebraic description of a curve, its intrinsic geometric properties, and the behavior of physical or mathematical fields defined along its trajectory.

---

## Table of Contents
1. Implemented Mathematical Foundations
2. Software Architecture and Modules
3. Features and Input Modes
4. Performance Optimization and Algorithms
5. Scientific Verification and Test Suite
6. Configuration and Development Guide
7. Compilation and Distribution
8. License and Citations

---

## 1. Implemented Mathematical Foundations

The application executes real-time numerical and symbolic calculations based on the following theoretical models of differential geometry and multivariable analysis:

### Curve Parametrization
A curve $C$ in three-dimensional space is described by a continuous vector-valued function of a single real variable:
$$\mathbf{r}(t) = (x(t), y(t), z(t)), \quad t \in [t_{\min}, t_{\max}]$$
For curves in the two-dimensional plane, the $z(t)$ component is omitted.

### Curve Differential Geometry (Frenet-Serret Frame)
For each instant of the parameter $t$, the system computes the moving orthonormal basis that characterizes the local geometry of the curve, assuming the curve is regular ($\|\mathbf{r}'(t)\| \neq 0$):
- **Unit Tangent Vector ($\mathbf{T}$)**: Indicates the instantaneous direction of motion.
  $$\mathbf{T}(t) = \frac{\mathbf{r}'(t)}{\|\mathbf{r}'(t)\|}$$
- **Unit Normal Vector ($\mathbf{N}$)**: Points towards the center of curvature of the trajectory.
  $$\mathbf{N}(t) = \frac{\mathbf{T}'(t)}{\|\mathbf{T}'(t)\|}$$
- **Unit Binormal Vector ($\mathbf{B}$)**: Defines the osculating plane along with $\mathbf{T}$.
  $$\mathbf{B}(t) = \mathbf{T}(t) \times \mathbf{N}(t)$$
- **Curvature ($\kappa$)**: Quantifies how fast the curve changes direction with respect to its arc length.
  $$\kappa(t) = \frac{\|\mathbf{r}'(t) \times \mathbf{r}''(t)\|}{\|\mathbf{r}'(t)\|^3}$$
- **Arc Length ($s$)**: Accumulated distance traveled along the curve from the lower bound:
  $$s(t) = \int_{t_{\min}}^{t} \|\mathbf{r}'(\tau)\| \, d\tau$$

### Line Integrals
- **Over a Scalar Field $f(x, y, z)$**: Represents accumulated quantities such as the mass of a wire with variable density.
  $$\int_{C} f \, ds = \int_{t_{\min}}^{t_{\max}} f(\mathbf{r}(t)) \|\mathbf{r}'(t)\| \, dt$$
- **Over a Vector Field $\mathbf{F}(x, y, z)$**: Quantifies the physical work performed by a force along the trajectory.
  $$\int_{C} \mathbf{F} \cdot d\mathbf{r} = \int_{t_{\min}}^{t_{\max}} \mathbf{F}(\mathbf{r}(t)) \cdot \mathbf{r}'(t) \, dt$$

---

## 2. Software Architecture and Modules

The project follows a strict separation of concerns through a decoupled layered architecture. This guarantees testability and maintenance of the central mathematical engine without dependencies on the user interface or rendering technologies.

```
src/
  core/        # Pure Mathematical Layer (no DOM, Three.js-independent)
    vector     # Low-level 3D vector operations
    parser     # Syntax validator and expression compiler with math.js
    curve      # Representation and sampling of vector functions
    differential # Numerical differentiation, Frenet frame, and curvature
    fields     # Mathematical field definition and line integrals
    interpolator # O(1) linear interpolation and precomputation grids
    cartesian  # Algebraic recognition and automatic parametrization
    state      # Internal state modeling and URL serialization
  render/      # WebGL Graphic Engine (using Three.js)
    scene      # Initialization and administration of the 3D Viewport
    curveMesh  # Trajectory rendering with support for discontinuities
    frame      # Visual representation of the Frenet-Serret frame
    fieldViz   # Spatial visualization of vector fields using arrows
  ui/          # User Interface and DOM (Vanilla CSS and HTML5)
    controlPanel # Parametric, Cartesian, and library input forms
    componentPlots # 2D coordinate graphs for x(t), y(t), z(t) on canvas
    transportBar # Temporal playback controls, slider, and playback speed
    equationView # Interactive mathematical rendering with KaTeX
  services/ocr # Optical Character Recognition Module
    OcrProvider  # Abstract provider and OCR text normalizer
    TesseractProvider # Direct integration with the Tesseract.js engine
  app.ts       # Orchestrator of the global application lifecycle
```

The fundamental dependency rule is hierarchical and unidirectional: the `ui/` and `render/` layers depend directly on `core/`, but the `core/` layer has no knowledge whatsoever of the graphical interface, facilitating its execution and testing in headless environments (such as Node.js or CI suites).

---

## 3. Features and Input Modes

Curvana offers a highly versatile workflow through three mathematical interaction modes (hybrid input model):

### Standard Curve Library
Immediate access to classical parametric trajectories useful for analyzing physical or geometric properties. It includes: segmented lines, circles, ellipses, parabolic curves, three-dimensional cylindrical helices, logarithmic spirals, Lissajous curves, conical spirals, and Viviani's Curve (the intersection between a sphere and a tangent cylinder).

### Cartesian Equation Recognition
Allows the user to input a conventional algebraic equation for the system to automatically derive and implement its equivalent parametrization in 2D or 3D:
- Recognizes lines in the plane ($ax + by = c$).
- Projects explicit functions of the type $y = f(x)$ using the natural parametrization $\mathbf{r}(t) = (t, f(t))$.
- Resolves general conics such as circles ($x^2 + y^2 = R^2$) and ellipses ($x^2/a^2 + y^2/b^2 = 1$).
- Symbolically identifies complex 3D spatial intersections, such as coplanar cylinders in the projective planes $xy$, $yz$, or $xz$ intersected with oblique planes (for example, the system of Cartesian equations $x^2 + z^2 = 9, y = 2x + 1$).

### Free Parametric Input
Allows writing custom formulas for the coordinate functions $x(t)$, $y(t)$, and $z(t)$ using a robust mathematical syntax provided by `math.js`, defining the continuous interval $[t_{\min}, t_{\max}]$.

### Equation Processing by OCR
Supports direct upload or photographic capture of algebraic and parametric equations. Using an OCR provider based on `Tesseract.js` in the browser, it extracts text, filters syntactic noise, normalizes notation, and loads the resulting parametrization directly into the application.

---

## 4. Performance Optimization and Algorithms

With the goal of guaranteeing animations at 60 frames per second (FPS) without causing CPU computation overload or memory garbage collection issues, the system implements advanced precomputation and interpolation mechanisms:

### Static Sampling Precomputation ( Simpson & O(1) Interpolation )
Instead of evaluating Simpson's numerical integration rule over the entire traveled length in each cycle of the animation loop (an operation that would become more expensive as $t$ advances towards $t_{\max}$), Curvana precomputes an indexed static array during the curve compilation phase.
- The total interval is divided into a homogeneous grid of 400 subintervals.
- The accumulated value of the arc length $s(t)$ and the scalar and vector line integrals are evaluated in advance for each of the grid nodes.
- During the real-time animation cycle, the value of the integral for any arbitrary parameter $t$ is approximated in constant time $O(1)$ by performing a linear interpolation between the two closest nodes of the grid.

### Layout Thrashing Avoidance
The `componentPlots.ts` module uses a resize observer (`ResizeObserver`) to update HTML5 canvas dimensions only in response to window resize events. This avoids invoking expensive methods like `getBoundingClientRect()` or updating geometric styles inside iterative draw loops, suppressing browser performance warnings.

### Expression Validation via Abstract Syntax Tree (AST) Traversal
The expression compiler in `parser.ts` analyzes mathematical syntax by constructing the abstract syntax tree (AST) with `math.parse`. Instead of evaluating the function at random points to check its validity, the system traverses the node tree statically, guaranteeing that:
- All identifiers correspond to permitted variables (e.g., $t$ in parametric curves, or $x, y, z$ in fields) or legitimate `math.js` constants and functions.
- There are no malformed or consecutive binary operators.
- No prototype methods or non-numerical objects are introduced that compromise execution safety.

---

## 5. Scientific Verification and Test Suite

The system includes broad coverage of unit and integration tests developed under the `Vitest` suite. The tests guarantee the correctness of calculations by comparing them with classical analytical solutions from multivariable physics and mathematics:

- **Moving Frame Orthonormalidad**: Verification that for every evaluated regular curve, the vectors $\mathbf{T}$, $\mathbf{N}$, and $\mathbf{B}$ have unit magnitude and are mutually orthogonal at all times ($\mathbf{T} \cdot \mathbf{N} = 0$, $\mathbf{T} \cdot \mathbf{B} = 0$, $\|\mathbf{B}\| = 1$).
- **Analytical Curvature**: Mathematical validation of numerical computation against known theoretical values, such as the constant curvature of a circle of radio $R$ ($\kappa = 1/R$) and a regular helix.
- **Integration Theorems (Conservative Fields)**: Verification that the line integral of a conservative vector field $\mathbf{F} = \nabla \phi$ along a curve depends exclusively on the boundary points, complying with the Fundamental Theorem of Calculus for Line Integrals:
  $$\int_{C} \nabla \phi \cdot d\mathbf{r} = \phi(\mathbf{r}(t_{\max})) - \phi(\mathbf{r}(t_{\min}))$$
- **Green's Theorem Application**: Verification in closed planar curves that the line integral of the vector field $\mathbf{F} = (-y, x)$ corresponds exactly to twice the area enclosed by the parametrized ellipse or circle.
- **Robustness Against Singularities**: Verification that trajectories with asymptotes or non-finite coordinates (such as $y = 1/t$ in domains containing zero) are correctly isolated by the `curveMesh.ts` renderer, avoiding the erroneous drawing of segments directed towards the origin $(0,0,0)$.

---

## 6. Configuration and Development Guide

### System Requirements
- Node.js version 20.0.0 or higher.
- npm package manager (included with Node.js).

### Dependency Installation
Clone the repository to your local machine and access the project root folder to download the required packages:
```bash
git clone https://github.com/kegouro/curvana.git
cd curvana
npm install
```

### Running the Development Server
To launch the interactive local development server with Vite:
```bash
npm run dev
```
The application will be available at the local address indicated in the terminal, by default: `http://localhost:5173`.

### Running Unit and Integration Tests
To execute the complete test suite once:
```bash
npm run test
```
To activate the continuous watch mode of tests during development:
```bash
npm run test:watch
```

---

## 7. Compilation and Distribution

### Web Compilation for Production
To generate the optimized files ready for distribution and web hosting:
```bash
npm run build
```
This command runs TypeScript type checking and compiles the static bundle into the `dist/` folder.

### Desktop Packaging (Electron)
Curvana can be distributed natively as desktop operating system applications.

To run the application in the local Electron development environment:
```bash
npm run app
```

To generate the specific packaged installers for your local platform (compiled files will be stored in the `release/` directory):
```bash
npm run dist
```

Additionally, dedicated scripts per platform are available:
- **macOS (DMG and ZIP)**: `npm run dist:mac`
- **Windows (NSIS Installer and Portable)**: `npm run dist:win`
- **Linux (AppImage and DEB package)**: `npm run dist:linux`

The repository's continuous integration workflows execute cross-compilations on native GitHub Actions servers when creating release tags (tags matching the `v*` pattern), automatically publishing the generated binaries to the repository's Releases.

---

## 8. License and Citations

This software is distributed under the terms of the MIT Open Source License. The source code is freely accessible, modifiable, and distributable for commercial or academic use under the terms described in the LICENSE file.

### Digital Object Identifier (DOI)
The project is registered on Zenodo for formal citation in scientific research or educational works. You can consult the digital object identifier (DOI) and the specification file in CITATION.cff format to obtain reference metadata in BibTeX or RIS formats.

<sub>Curvana is part of the Pharos Project, a technological effort oriented towards developing scientific and educational infrastructure with no entry barriers for students and scientists globally. · Designed and implemented by José Labarca Baeza.</sub>
