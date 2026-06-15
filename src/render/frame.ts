// Dibuja el triedro de Frenet (T, N, B) y/o solo la tangente en el punto móvil.
import * as THREE from 'three';
import type { Vec3 } from '../core/vector';
import type { Frame } from '../core/differential';

const COL_T = 0xfbbf24; // tangente — ámbar
const COL_N = 0x60a5fa; // normal — azul
const COL_B = 0xf472b6; // binormal — rosa

export class FrenetView {
  readonly group = new THREE.Group();
  private readonly arrowT: THREE.ArrowHelper;
  private readonly arrowN: THREE.ArrowHelper;
  private readonly arrowB: THREE.ArrowHelper;

  constructor() {
    const o = new THREE.Vector3();
    const d = new THREE.Vector3(1, 0, 0);
    this.arrowT = new THREE.ArrowHelper(d, o, 1.4, COL_T, 0.3, 0.18);
    this.arrowN = new THREE.ArrowHelper(d, o, 1.4, COL_N, 0.3, 0.18);
    this.arrowB = new THREE.ArrowHelper(d, o, 1.4, COL_B, 0.3, 0.18);
    this.group.add(this.arrowT, this.arrowN, this.arrowB);
  }

  update(origin: Vec3, frame: Frame, show: { tangent: boolean; frenet: boolean }): void {
    const o = new THREE.Vector3(origin[0], origin[1], origin[2]);
    const set = (arrow: THREE.ArrowHelper, dir: Vec3, visible: boolean) => {
      arrow.visible = visible;
      if (!visible) return;
      const d = new THREE.Vector3(dir[0], dir[1], dir[2]);
      if (d.lengthSq() < 1e-9) {
        arrow.visible = false;
        return;
      }
      arrow.position.copy(o);
      arrow.setDirection(d.normalize());
    };
    set(this.arrowT, frame.T, show.tangent || show.frenet);
    set(this.arrowN, frame.N, show.frenet);
    set(this.arrowB, frame.B, show.frenet);
  }
}
