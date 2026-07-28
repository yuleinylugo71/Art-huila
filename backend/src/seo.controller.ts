import { Controller, Get, Header, Headers, NotFoundException, Param, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { ProductsService } from './products/products.service';
import { ArtisansService } from './artisans/artisans.service';

function publicPath(file: string): string {
  const candidates = [
    join(process.cwd(), 'public', file),
    join(__dirname, '..', 'public', file),
    join(__dirname, '..', '..', 'public', file),
  ];
  const found = candidates.find((candidate) => existsSync(candidate));
  return found || candidates[0];
}

function escapeHtml(value: unknown): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function truncate(value: string, max = 155): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trim()}…`;
}

function absoluteUrl(baseUrl: string, url: string): string {
  if (!url) return `${baseUrl}/img/placeholder.jpg`;
  if (/^https?:\/\//i.test(url)) return url;
  return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function extractUuid(value: string): string {
  const match = value.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
  );
  return match?.[0] || value;
}

function injectSeo(
  html: string,
  data: {
    title: string;
    description: string;
    canonical: string;
    image: string;
    type: 'product' | 'profile';
    scriptGlobals: Record<string, string>;
    jsonLd: Record<string, any>;
  },
): string {
  const globals = Object.entries(data.scriptGlobals)
    .map(([key, value]) => `window.${key}=${JSON.stringify(value)};`)
    .join('');
  const tags = `
  <meta name="description" content="${escapeHtml(data.description)}">
  <link rel="canonical" href="${escapeHtml(data.canonical)}">
  <meta property="og:type" content="${data.type}">
  <meta property="og:site_name" content="Art Huila">
  <meta property="og:title" content="${escapeHtml(data.title)}">
  <meta property="og:description" content="${escapeHtml(data.description)}">
  <meta property="og:url" content="${escapeHtml(data.canonical)}">
  <meta property="og:image" content="${escapeHtml(data.image)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(data.title)}">
  <meta name="twitter:description" content="${escapeHtml(data.description)}">
  <meta name="twitter:image" content="${escapeHtml(data.image)}">
  <script>${globals}</script>
  <script type="application/ld+json">${JSON.stringify(data.jsonLd)}</script>`;

  return html
    .replace(/<title[^>]*>.*?<\/title>/i, `<title id="page-title">${escapeHtml(data.title)}</title>`)
    .replace('</head>', `${tags}\n</head>`);
}

@Controller()
export class SeoController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly artisansService: ArtisansService,
    private readonly configService: ConfigService,
  ) {}

  private baseUrl(): string {
    return (
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'
    ).replace(/\/$/, '');
  }

  @Get('producto/:slug')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async productPage(
    @Param('slug') slug: string,
    @Query('lang') lang?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const baseUrl = this.baseUrl();
    const product = await this.productsService.findBySlug(slug);
    const useEnglish =
      lang === 'en' || (!lang && acceptLanguage?.toLowerCase().startsWith('en'));
    const productName = useEnglish && product.name_en ? product.name_en : product.name;
    const title =
      (useEnglish ? product.meta_title_en : product.meta_title) ||
      `${productName} | Art Huila`;
    const description = truncate(
      stripTags(
        (useEnglish ? product.meta_description_en : product.meta_description) ||
          (useEnglish ? product.short_description_en : product.short_description) ||
          `${productName}, artesanía del Huila elaborada por ${product.artisan?.user?.full_name || 'artesanos locales'}.`,
      ),
    );
    const image = absoluteUrl(
      baseUrl,
      product.images?.[0]?.url || '/img/placeholder.jpg',
    );
    const canonical = `${baseUrl}/producto/${encodeURIComponent(product.slug)}`;
    const html = readFileSync(publicPath('producto.html'), 'utf8');

    return injectSeo(html, {
      title,
      description,
      canonical,
      image,
      type: 'product',
      scriptGlobals: { __SEO_PRODUCT_SLUG__: product.slug },
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: productName,
        description,
        image,
        url: canonical,
        brand: { '@type': 'Brand', name: 'Art Huila' },
        category: product.category?.name,
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: 'COP',
          availability:
            product.stock > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          url: canonical,
        },
        manufacturer: {
          '@type': 'Person',
          name: product.artisan?.user?.full_name,
        },
      },
    });
  }

  @Get('artesano/:slug')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async artisanPage(@Param('slug') slug: string) {
    const baseUrl = this.baseUrl();
    const artisanId = extractUuid(slug);
    const artisan = await this.artisansService.findById(artisanId);
    if (!artisan) throw new NotFoundException('Artesano no encontrado');
    const name = artisan?.user?.full_name || 'Artesano Art Huila';
    const artisanSlug = `${slugify(name)}-${artisanId}`;
    const title = `${name} | Artesano Art Huila`;
    const description = truncate(
      stripTags(
        artisan?.cultural_history ||
          `${name}, artesano del Huila en Art Huila.`,
      ),
    );
    const image = absoluteUrl(
      baseUrl,
      artisan?.avatar_url || artisan?.gallery?.[0]?.url || '/img/default-avatar.jpg',
    );
    const canonical = `${baseUrl}/artesano/${encodeURIComponent(artisanSlug)}`;
    const html = readFileSync(publicPath('artesano.html'), 'utf8');

    return injectSeo(html, {
      title,
      description,
      canonical,
      image,
      type: 'profile',
      scriptGlobals: { __SEO_ARTISAN_ID__: artisanId },
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name,
        description,
        image,
        url: canonical,
        address: {
          '@type': 'PostalAddress',
          addressRegion: artisan?.region?.name || 'Huila',
          addressCountry: 'CO',
        },
        worksFor: { '@type': 'Organization', name: 'Art Huila' },
      },
    });
  }
}
