// Dibuja la curva: trazo completo tenue, tramo recorrido hasta t (brillante)
// y el punto móvil. Opcionalmente colorea por un campo escalar.
import * as THREE from 'three';
import type { Curve } from '../core/curve';
import type { ScalarField } from '../core/fields';

const FAINT = 0x2f6b46;
const BRIGHT = 0xa3e635;
const POINT = 0xfbbf24;

export class CurveView {
  readonly group = new THREE.Group();
  private samples = 600;
  private points: THREE.Vector3[] = [];
  private fullLine: THREE.Line;
  private tracedLine: THREE.Line;
  private readonly point: THREE.Mesh;

  constructor() {
    const fullGeo = new THREE.BufferGeometry();
    this.fullLine = new THREE.Line(
      fullGeo,
      new THREE.LineBasicMaterial({ color: FAINT, transparent: true, opacity: 0.55 }),
    );

    const tracedGeo = new THREE.BufferGeometry();
    this.tracedLine = new THREE.Line(
      tracedGeo,
      new THREE.LineBasicMaterial({ vertexColors: false, color: BRIGHT }),
    );

    this.point = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 20, 20),
      new THREE.MeshStandardMaterial({ color: POINT, emissive: 0x6b4e00, emissiveIntensity: 0.5 }),
    );

    this.group.add(this.fullLine, this.tracedLine, this.point);
  }

  /** Recalcula la geometría completa al cambiar la curva. */
  setCurve(curve: Curve, scalar: ScalarField | null): void {
    const { tMin, tMax } = curve;
    this.points = [];
    const colors: number[] = [];
    let min = Infinity;
    let max = -Infinity;
    const raw: number[] = [];

    for (let i = 0; i <= this.samples; i++) {
      const t = tMin + ((tMax - tMin) * i) / this.samples;
      const p = curve.eval(t);
      const v = new THREE.Vector3(
        Number.isFinite(p[0]) ? p[0] : NaN,
        Number.isFinite(p[1]) ? p[1] : NaN,
        Number.isFinite(p[2]) ? p[2] : NaN,
      );
      this.points.push(v);
      if (scalar) {
        const s = scalar.eval(p);
        raw.push(s);
        if (Number.isFinite(s)) {
          min = Math.min(min, s);
          max = Math.max(max, s);
        }
      }
    }

    this.fullLine.geometry.setFromPoints(this.points);

    // Coloreado por campo escalar (azul→verde→amarillo) sobre la línea completa.
    const mat = this.fullLine.material as THREE.LineBasicMaterial;
    if (scalar && max > min) {
      const tmp = new THREE.Color();
      for (const s of raw) {
        const n = Number.isFinite(s) ? (s - min) / (max - min) : 0;
        tmp.setHSL(0.62 - 0.45 * n, 0.75, 0.55);
        colors.push(tmp.r, tmp.g, tmp.b);
      }
      this.fullLine.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      mat.vertexColors = true;
      mat.opacity = 0.9;
    } else {
      this.fullLine.geometry.deleteAttribute('color');
      mat.vertexColors = false;
      mat.opacity = 0.55;
    }
    mat.needsUpdate = true;

    this.tracedLine.geometry.setFromPoints(this.points);
    this.tracedLine.geometry.setDrawRange(0, 1);
  }

  /** Actualiza el tramo recorrido y el punto móvil para el parámetro t. */
  setT(curve: Curve, t: number): void {
    const { tMin, tMax } = curve;
    const frac = tMax === tMin ? 0 : (t - tMin) / (tMax - tMin);
    const count = Math.max(1, Math.round(frac * this.samples) + 1);
    this.tracedLine.geometry.setDrawRange(0, Math.min(count, this.points.length));

    const p = curve.eval(t);
    if (Number.isFinite(p[0]) && Number.isFinite(p[1]) && Number.isFinite(p[2])) {
      this.point.position.set(p[0], p[1], p[2]);
      this.point.visible = true;
    } else {
      this.point.visible = false;
    }
  }

  /** Centro y radio de la curva, para encuadrar la cámara. */
  bounds(): { center: THREE.Vector3; radius: number } {
    const box = new THREE.Box3();
    for (const p of this.points) if (Number.isFinite(p.length())) box.expandByPoint(p);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    return { center, radius: Math.max(size.x, size.y, size.z) / 2 };
  }
}
