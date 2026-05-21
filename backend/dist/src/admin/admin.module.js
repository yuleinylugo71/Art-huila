"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const admin_controller_1 = require("./admin.controller");
const admin_service_1 = require("./admin.service");
const artisan_profile_entity_1 = require("../artisans/entities/artisan-profile.entity");
const artisans_module_1 = require("../artisans/artisans.module");
const mail_module_1 = require("../mail/mail.module");
const audit_module_1 = require("../audit/audit.module");
const users_module_1 = require("../users/users.module");
const orders_module_1 = require("../orders/orders.module");
const products_module_1 = require("../products/products.module");
const reviews_module_1 = require("../reviews/reviews.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([artisan_profile_entity_1.ArtisanProfile]),
            artisans_module_1.ArtisansModule,
            mail_module_1.MailModule,
            audit_module_1.AuditModule,
            users_module_1.UsersModule,
            orders_module_1.OrdersModule,
            products_module_1.ProductsModule,
            reviews_module_1.ReviewsModule,
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_service_1.AdminService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map