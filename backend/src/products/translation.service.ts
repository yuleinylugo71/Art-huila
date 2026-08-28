import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type ProductTranslationInput = Record<string, unknown>;

const TRANSLATABLE_FIELDS = [
  'name',
  'cultural_origin',
  'technique',
  'significance',
  'short_description',
  'materials',
  'dimensions',
  'weight',
  'care_instructions',
] as const;

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  constructor(private readonly configService: ConfigService) {}

  async translateProductToEnglish<T extends ProductTranslationInput>(
    product: T,
  ): Promise<T> {
    const translated: Record<string, unknown> = { ...product };

    await Promise.all(
      TRANSLATABLE_FIELDS.map(async (field) => {
        const targetField = `${field}_en`;
        if (translated[targetField] || !translated[field]) return;

        const result = await this.translateText(String(translated[field]));
        if (result) translated[targetField] = result;
      }),
    );

    return translated as T;
  }

  private async translateText(text: string): Promise<string | null> {
    const value = text.trim();
    if (!value) return null;

    const provider = (
      this.configService.get<string>('TRANSLATION_PROVIDER') || 'mymemory'
    ).toLowerCase();

    try {
      if (provider === 'libretranslate') {
        return this.translateWithLibreTranslate(value);
      }

      if (provider === 'disabled' || provider === 'none') {
        return null;
      }

      return this.translateWithMyMemory(value);
    } catch (error) {
      this.logger.warn(`No se pudo traducir texto de producto: ${error}`);
      return null;
    }
  }

  private async translateWithLibreTranslate(text: string): Promise<string | null> {
    const endpoint =
      this.configService.get<string>('LIBRETRANSLATE_URL') ||
      'https://libretranslate.com/translate';
    const apiKey = this.configService.get<string>('LIBRETRANSLATE_API_KEY');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'es',
        target: 'en',
        format: 'text',
        ...(apiKey ? { api_key: apiKey } : {}),
      }),
    });

    if (!response.ok) return null;
    const data = (await response.json()) as { translatedText?: string };
    return data.translatedText?.trim() || null;
  }

  private async translateWithMyMemory(text: string): Promise<string | null> {
    const url = new URL('https://api.mymemory.translated.net/get');
    url.searchParams.set('q', text);
    url.searchParams.set('langpair', 'es|en');

    const response = await fetch(url);
    if (!response.ok) return null;
    const data = (await response.json()) as {
      responseData?: { translatedText?: string };
    };

    return data.responseData?.translatedText?.trim() || null;
  }
}
