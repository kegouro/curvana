import './style.css';
import 'katex/dist/katex.min.css';
import { App } from './app';

const root = document.getElementById('app');
if (root) {
  new App(root);
} else {
  console.error('No se encontró el contenedor #app.');
}
