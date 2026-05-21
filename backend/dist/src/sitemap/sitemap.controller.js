"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SitemapController = void 0;
const common_1 = require("@nestjs/common");
const products_service_1 = require("../products/products.service");
const config_1 = require("@nestjs/config");
let SitemapController = class SitemapController {
    productsService;
    configService;
    constructor(productsService, configService) {
        this.productsService = productsService;
        this.configService = configService;
    }
    async getSitemap() {
        const products = await this.productsService.findAll();
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:8080';
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
};
exports.SitemapController = SitemapController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.Header)('Content-Type', 'application/xml'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SitemapController.prototype, "getSitemap", null);
exports.SitemapController = SitemapController = __decorate([
    (0, common_1.Controller)('sitemap.xml'),
    __metadata("design:paramtypes", [products_service_1.ProductsService,
        config_1.ConfigService])
], SitemapController);
//# sourceMappingURL=sitemap.controller.js.map