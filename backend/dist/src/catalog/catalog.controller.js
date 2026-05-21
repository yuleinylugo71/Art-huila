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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogController = void 0;
const common_1 = require("@nestjs/common");
const catalog_service_1 = require("./catalog.service");
let CatalogController = class CatalogController {
    catalogService;
    constructor(catalogService) {
        this.catalogService = catalogService;
    }
    findAll(regions, categories, minPrice, maxPrice, sortBy, page, limit, artisanId) {
        return this.catalogService.findAll({
            regions: regions ? regions.split(',') : undefined,
            categories: categories ? categories.split(',') : undefined,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            sortBy,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            artisanId,
        });
    }
};
exports.CatalogController = CatalogController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('regions')),
    __param(1, (0, common_1.Query)('categories')),
    __param(2, (0, common_1.Query)('minPrice')),
    __param(3, (0, common_1.Query)('maxPrice')),
    __param(4, (0, common_1.Query)('sortBy')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __param(7, (0, common_1.Query)('artisanId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "findAll", null);
exports.CatalogController = CatalogController = __decorate([
    (0, common_1.Controller)('catalog'),
    __metadata("design:paramtypes", [catalog_service_1.CatalogService])
], CatalogController);
//# sourceMappingURL=catalog.controller.js.map