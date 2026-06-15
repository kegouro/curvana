// Escena Three.js: cámara, controles orbitales, ejes, grilla y luces.
// Solo presentación: no contiene lógica matemática.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Dim } from '../core/types';

export class Viewport {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly controls: OrbitControls;
  private readonly container: HTMLElement;
  private readonly axes: THREE.AxesHelper;
  private readonly grid: THREE.GridHelper;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene.background = new THREE.Color(0x0a140e);

    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;
    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.01, 1000);
    this.camera.position.set(6, 5, 8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 7);
    this.scene.add(dir);

    this.grid = new THREE.GridHelper(20, 20, 0x1e3a2a, 0x14241a);
    (this.grid.material as THREE.Material).transparent = true;
    (this.grid.material as THREE.Material).opacity = 0.5;
    // GridHelper está en el plano XZ; lo giramos al plano XY (matemático).
    this.grid.rotation.x = Math.PI / 2;
    this.scene.add(this.grid);

    this.axes = new THREE.AxesHelper(4);
    this.scene.add(this.axes);

    window.addEventListener('resize', () => this.resize());
    // Se reajusta al tamaño real del contenedor (flexbox puede no estar listo al construir).
    new ResizeObserver(() => this.resize()).observe(container);
  }

  /** Ajusta cámara y controles según la dimensión. */
  setDim(dim: Dim): void {
    if (dim === '2d') {
      this.camera.position.set(0, 0, 12);
      this.camera.up.set(0, 1, 0);
      this.controls.enableRotate = false;
      this.controls.target.set(0, 0, 0);
    } else {
      this.camera.position.set(6, 5, 8);
      this.camera.up.set(0, 0, 1);
      this.controls.enableRotate = true;
      this.controls.target.set(0, 0, 0);
    }
    this.controls.update();
  }

  /** Encuadra la cámara a una caja dada por su centro y radio. */
  frame(center: THREE.Vector3, radius: number, dim: Dim): void {
    const r = Math.max(radius, 1);
    this.controls.target.copy(center);
    if (dim === '2d') {
      this.camera.position.set(center.x, center.y, r * 2.6);
    } else {
      this.camera.position.set(center.x + r * 1.4, center.y - r * 1.6, center.z + r * 1.4);
    }
    this.controls.update();
  }

  resize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  render(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
