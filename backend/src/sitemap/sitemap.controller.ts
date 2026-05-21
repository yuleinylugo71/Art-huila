import { Controller, Get, Header } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { ConfigService } from '@nestjs/config';

@Controller('sitemap.xml')
export class SitemapController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @Header('Content-Type', 'application/xml')
  async getSitemap() {
    const products = await this.productsService.findAll();
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:8080';

    const urls = [
      { loc: `${frontendUrl}/index.html`, priority: '1.0' },
      { loc: `${frontendUrl}/views/catalogo.html`, priority: '0.8' },
    ];

    products.forEach(p => {
      urls.push({
        loc: `${frontendUrl}/views/producto.html?slug=${p.slug}`,
        priority: '0.6',
      });
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <priority>${url.priority}</priority>
    <changefreq>daily</changefreq>
  </url>`).join('')}
</urlset>`;

    return xml;
  }
}
