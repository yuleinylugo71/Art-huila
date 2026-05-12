"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegionsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const region_entity_1 = require("./entities/region.entity");
const regions_service_1 = require("./regions.service");
const regions_controller_1 = require("./regions.controller");
let RegionsModule = class RegionsModule {
};
exports.RegionsModule = RegionsModule;
exports.RegionsModule = RegionsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([region_entity_1.Region])],
        controllers: [regions_controller_1.RegionsController],
        providers: [regions_service_1.RegionsService],
        exports: [regions_service_1.RegionsService],
    })
], RegionsModule);
//# sourceMappingURL=regions.module.js.map