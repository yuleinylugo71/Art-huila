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
exports.CategoriesController = void 0;
const common_1 = require("@nestjs/common");
const categories_service_1 = require("./categories.service");
let CategoriesController = class CategoriesController {
    categoriesService;
    constructor(categoriesService) {
        this.categoriesService = categoriesService;
    }
    async findAll() {
        const categories = await this.categoriesService.findAllWithCount();
        const icons = {
            'Tejeduría': '<i class="fa-solid fa-scissors"></i>',
            'Cerámica': '<i class="fa-solid fa-jar"></i>',
            'Talla en madera': '<i class="fa-solid fa-tree"></i>',
            'Orfebrería': '<i class="fa-solid fa-gem"></i>',
            'Sombrerería': '<i class="fa-solid fa-hat-cowboy"></i>',
        };
        return categories.map(c => ({
            id: c.id,
            name: c.name,
            slug: c.name.toLowerCase().replace(/ /g, '-'),
            icon_emoji: icons[c.name] || '<i class="fa-solid fa-palette"></i>',
            count: c['count'] || 0,
        }));
    }
};
exports.CategoriesController = CategoriesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CategoriesController.prototype, "findAll", null);
exports.CategoriesController = CategoriesController = __decorate([
    (0, common_1.Controller)('categories'),
    __metadata("design:paramtypes", [categories_service_1.CategoriesService])
], CategoriesController);
//# sourceMappingURL=categories.controller.js.map