// Visualización del campo vectorial: una rejilla de flechas que muestra F(x,y,z).
import * as THREE from 'three';
import type { VectorField } from '../core/fields';
import type { Dim } from '../core/types';
import * as V from '../core/vector';

const COLOR = 0x38bdf8;

export class FieldView {
  readonly group = new THREE.Group();
  private arrows: THREE.ArrowHelper[] = [];

  /** Reconstruye la rejilla de flechas en torno al centro de la curva. */
  setField(
    field: VectorField | null,
    center: THREE.Vector3,
    radius: number,
    dim: Dim,
  ): void {
    this.clear();
    if (!field) return;

    const R = Math.max(radius, 1.5) * 1.2;
    const n = 5; // muestras por eje
    const step = (2 * R) / (n - 1);
    const zLevels = dim === '2d' ? [0] : [-R / 2, 0, R / 2];

    // Normalización de longitudes para que las flechas no tapen la escena.
    let maxMag = 1e-9;
    const samples: { pos: THREE.Vector3; dir: V.Vec3; mag: number }[] = [];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        for (const z of zLevels) {
          const pos = new THREE.Vector3(
            center.x - R + i * step,
            center.y - R + j * step,
            (dim === '2d' ? 0 : center.z) + z,
          );
          const f = field.eval([pos.x, pos.y, pos.z]);
          if (!V.isFiniteVec(f)) continue;
          const mag = V.norm(f);
          maxMag = Math.max(maxMag, mag);
          samples.push({ pos, dir: f, mag });
        }
      }
    }

    const targetLen = step * 0.8;
    for (const s of samples) {
      if (s.mag < 1e-9) continue;
      const dir = new THREE.Vector3(s.dir[0], s.dir[1], s.dir[2]).normalize();
      const len = targetLen * (0.35 + 0.65 * (s.mag / maxMag));
      const arrow = new THREE.ArrowHelper(dir, s.pos, len, COLOR, len * 0.3, len * 0.2);
      (arrow.line.material as THREE.Material).transparent = true;
      (arrow.line.material as THREE.Material).opacity = 0.75;
      this.arrows.push(arrow);
      this.group.add(arrow);
    }
  }

  clear(): void {
    for (const a of this.arrows) {
      this.group.remove(a);
      a.dispose();
    }
    this.arrows = [];
  }
}
