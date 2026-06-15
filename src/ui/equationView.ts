// Renderiza la cartesiana y la parametrización en LaTeX con KaTeX.
import katex from 'katex';

export class EquationView {
  constructor(private readonly el: HTMLElement) {}

  render(cartesian: string | null, param: string | null): void {
    this.el.innerHTML = '';
    if (cartesian) this.el.appendChild(this.block('Cartesiana', cartesian));
    if (param) this.el.appendChild(this.block('Parametrización', param));
  }

  private block(label: string, latex: string): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'eq-block';
    const tag = document.createElement('div');
    tag.className = 'eq-label';
    tag.textContent = label;
    const body = document.createElement('div');
    body.className = 'eq-body';
    body.innerHTML = katex.renderToString(latex, {
      throwOnError: false,
      displayMode: false,
    });
    wrap.append(tag, body);
    return wrap;
  }
}
