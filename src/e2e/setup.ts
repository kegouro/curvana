import { vi } from 'vitest';

// 1. Mock WebGLRenderer inside three
vi.mock('three', async () => {
  const original = await vi.importActual('three') as any;
  return {
    ...original,
    WebGLRenderer: class WebGLRenderer {
      domElement = document.createElement('canvas');
      shadowMap = { enabled: false };
      setPixelRatio() {}
      setSize() {}
      render() {}
      setClearColor() {}
      clear() {}
    }
  };
});

// 2. Mock OrbitControls from three/examples
vi.mock('three/examples/jsm/controls/OrbitControls.js', () => {
  return {
    OrbitControls: class OrbitControls {
      enableDamping = false;
      dampingFactor = 0;
      enableRotate = false;
      target = {
        copy: () => {},
        set: () => {},
      };
      update() {}
    }
  };
});

// 3. Mock ResizeObserver globally
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// 4. Mock HTMLCanvasElement context & bounding rect
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function (contextId: string) {
    if (contextId === '2d') {
      return {
        clearRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fill: () => {},
        arc: () => {},
        closePath: () => {},
        scale: () => {},
        translate: () => {},
        rotate: () => {},
        save: () => {},
        restore: () => {},
        fillText: () => {},
        measureText: () => ({ width: 10 }),
        createLinearGradient: () => ({ addColorStop: () => {} }),
      } as any;
    }
    return null;
  } as any;

  HTMLCanvasElement.prototype.getBoundingClientRect = function () {
    return {
      width: 300,
      height: 150,
      top: 0,
      left: 0,
      bottom: 150,
      right: 300,
      x: 0,
      y: 0,
      toJSON: () => {},
    };
  };
}

// 5. Mock tesseract.js module
vi.mock('tesseract.js', () => {
  return {
    default: {
      recognize: async (_image: any, _lang: string, options: any) => {
        // Allow tests to override the returned OCR text
        const text = (globalThis as any).__MOCK_OCR_TEXT__ || 'x^2 + y^2 = 4';
        
        // Simulate progress logging if callback provided
        if (options && options.logger) {
          options.logger({ status: 'recognizing text', progress: 0.5 });
          options.logger({ status: 'recognizing text', progress: 1.0 });
        }
        
        return {
          data: {
            text,
          },
        };
      },
    },
  };
});

// 6. Mock navigator.clipboard
if (typeof navigator !== 'undefined') {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: async (text: string) => {
        (globalThis as any).__COPIED_TEXT__ = text;
      }
    },
    configurable: true,
    writable: true,
  });
}
