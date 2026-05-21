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
exports.StatsController = void 0;
const common_1 = require("@nestjs/common");
const products_service_1 = require("./products/products.service");
const artisans_service_1 = require("./artisans/artisans.service");
let StatsController = class StatsController {
    productsService;
    artisansService;
    constructor(productsService, artisansService) {
        this.productsService = productsService;
        this.artisansService = artisansService;
    }
    async getStats() {
        const productsCount = await this.productsService.getCount();
        const artisans = await this.artisansService.findAll('verified');
        return {
            artisans_count: artisans.length,
            products_count: productsCount,
            avg_rating: 4.8,
            delivery_days: '3-5',
        };
    }
};
exports.StatsController = StatsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StatsController.prototype, "getStats", null);
exports.StatsController = StatsController = __decorate([
    (0, common_1.Controller)('stats'),
    __metadata("design:paramtypes", [products_service_1.ProductsService,
        artisans_service_1.ArtisansService])
], StatsController);
//# sourceMappingURL=stats.controller.js.map