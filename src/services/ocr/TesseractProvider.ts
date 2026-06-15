// Implementación de OCR en el cliente con Tesseract.js. Gratis y sin servidor.
// La librería se carga de forma diferida (dynamic import) para no pesar en el arranque.
import { cleanOcrText, type OcrProvider } from './OcrProvider';

export class TesseractProvider implements OcrProvider {
  async recognize(image: Blob | File, onProgress?: (pct: number) => void): Promise<string> {
    const Tesseract = (await import('tesseract.js')).default;
    const { data } = await Tesseract.recognize(image, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });
    return cleanOcrText(data.text);
  }
}
