// Interfaz de OCR. La UI solo conoce esta abstracción, no la implementación.
// Permite cambiar Tesseract por Mathpix (vía serverless) sin tocar la interfaz.
export interface OcrProvider {
  /** Reconoce el texto/ecuación de una imagen y devuelve un candidato editable. */
  recognize(image: Blob | File, onProgress?: (pct: number) => void): Promise<string>;
}

// Module-level constants for pre-compiled regular expressions to optimize execution time
const REGEX_MULT = /[×✕✖]/g;
const REGEX_DIV = /[÷]/g;
const REGEX_MINUS = /−/g;
const REGEX_QUOTES = /[“”]/g;
const REGEX_SQUARE = /²/g;
const REGEX_CUBE = /³/g;
const REGEX_SQRT = /√/g;
const REGEX_PI = /π/g;
const REGEX_POW_SPACES = /\s*\^\s*/g;
const REGEX_SPACES = /\s+/g;

/**
 * Limpia el texto crudo del OCR para acercarlo a una expresión utilizable.
 * El resultado siempre lo revisa y edita el usuario antes de graficar.
 */
export function cleanOcrText(text: string): string {
  if (!text) return '';
  const cleanedText = text
    .toLowerCase()
    .replace(REGEX_MULT, '*')
    .replace(REGEX_DIV, '/')
    .replace(REGEX_MINUS, '-')
    .replace(REGEX_QUOTES, '')
    .replace(REGEX_SQUARE, '^2')
    .replace(REGEX_CUBE, '^3')
    .replace(REGEX_SQRT, 'sqrt')
    .replace(REGEX_PI, 'pi')
    .replace(REGEX_POW_SPACES, '^');

  return cleanedText
    .split('\n')
    .map((line) => line.trim())
    // Ignore empty lines and lines starting with comments (# or //)
    .filter((line) => line.length > 0 && !line.startsWith('#') && !line.startsWith('//'))
    .map((line) => line.replace(REGEX_SPACES, ' ').trim())
    .join(', ');
}

