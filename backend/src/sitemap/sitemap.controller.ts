import { Controller, Get, Header } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { ConfigService } from '@nestjs/config';
import { ArtisansService } from '../artisans/artisans.service';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Controller('sitemap.xml')
export class SitemapController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly artisansService: ArtisansService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @Header('Content-Type', 'application/xml')
  async getSitemap() {
    const [products, artisans] = await Promise.all([
      this.productsService.findForSitemap(),
      this.artisansService.findForSitemap(),
    ]);
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const baseUrl = frontendUrl.replace(/\/$/, '');

    const urls = [
      {
        loc: `${baseUrl}/index.html`,
        priority: '1.0',
        changefreq: 'weekly',
        lastmod: new Date().toISOString(),
      },
      {
        loc: `${baseUrl}/catalogo.html`,
        priority: '0.8',
        changefreq: 'daily',
        lastmod: new Date().toISOString(),
      },
      {
        loc: `${baseUrl}/artesanos.html`,
        priority: '0.7',
        changefreq: 'weekly',
        lastmod: new Date().toISOString(),
      },
    ];

    products.forEach((p) => {
      urls.push({
        loc: `${baseUrl}/producto/${p.slug}`,
        priority: '0.6',
        changefreq: 'weekly',
        lastmod: p.updated_at?.toISOString?.() || new Date().toISOString(),
      });
    });

    artisans.forEach((a) => {
      urls.push({
        loc: `${baseUrl}/artesano/${slugify(a.user?.full_name || 'artesano')}-${a.id}`,
        priority: '0.6',
        changefreq: 'weekly',
        lastmod: a.updated_at?.toISOString?.() || new Date().toISOString(),
      });
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
    .map(
      (url) => `
  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <priority>${url.priority}</priority>
    <changefreq>${url.changefreq}</changefreq>
  </url>`,
    )
    .join('')}
</urlset>`;

    return xml;
  }
}
