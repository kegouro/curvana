import { vi } from 'vitest';
import { App } from '../app';

export interface AppInstance {
  app: App;
  container: HTMLElement;
  cleanup: () => void;
}

/**
 * Mounts the Curvana application into the DOM under JSDOM.
 */
export function mountApp(): AppInstance {
  // Clear any existing body elements
  document.body.innerHTML = '';
  
  // Create a root container
  const container = document.createElement('div');
  container.id = 'app';
  document.body.appendChild(container);
  
  // Reset location hash if not already set
  if (!window.location.hash) {
    window.location.hash = '';
  }
  
  // Instantiate App
  const app = new App(container);
  
  // Return instance and cleanup helper
  const cleanup = () => {
    // Stop any animation loops by resetting requestAnimationFrame or cleaning body
    app.destroy?.();
    document.body.innerHTML = '';
    window.location.hash = '';
    vi.restoreAllMocks();
  };
  
  return { app, container, cleanup };
}

/**
 * Simulates typing text into an input element and dispatching events.
 */
export function typeInto(input: HTMLInputElement, text: string) {
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Simulates pressing the Enter key on an input.
 */
export function pressEnter(input: HTMLInputElement) {
  const event = new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
  });
  input.dispatchEvent(event);
}

/**
 * Simulates clicking on a button or element.
 */
export function click(element: HTMLElement) {
  element.click();
}

/**
 * Simulates selecting an option in a select element.
 */
export function changeSelect(select: HTMLSelectElement, value: string) {
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Simulates checking or unchecking a checkbox.
 */
export function setCheckbox(checkbox: HTMLInputElement, checked: boolean) {
  checkbox.checked = checked;
  checkbox.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Simulates dragging and dropping a File onto a drop zone.
 */
export function dragAndDropFile(element: HTMLElement, file: File) {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  
  const dropEvent = new DragEvent('drop', {
    bubbles: true,
    dataTransfer,
  });
  
  element.dispatchEvent(dropEvent);
}

/**
 * Simulates selecting a file using an <input type="file">.
 */
export function uploadFile(input: HTMLInputElement, file: File) {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  input.files = dataTransfer.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}
