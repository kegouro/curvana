// Interfaz de OCR. La UI solo conoce esta abstracción, no la implementación.
// Permite cambiar Tesseract por Mathpix (vía serverless) sin tocar la interfaz.
export interface OcrProvider {
  /** Reconoce el texto/ecuación de una imagen y devuelve un candidato editable. */
  recognize(image: Blob | File, onProgress?: (pct: number) => void): Promise<string>;
}

/**
 * Limpia el texto crudo del OCR para acercarlo a una expresión utilizable.
 * El resultado siempre lo revisa y edita el usuario antes de graficar.
 */
export function cleanOcrText(text: string): string {
  const firstLine =
    text
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length > 0) ?? '';

  return firstLine
    .replace(/[×✕✖]/g, '*')
    .replace(/[÷]/g, '/')
    .replace(/−/g, '-')
    .replace(/[“”]/g, '')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/√/g, 'sqrt')
    .replace(/π/g, 'pi')
    .replace(/\s+/g, ' ')
    .trim();
}
