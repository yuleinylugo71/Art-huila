"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const Joi = __importStar(require("joi"));
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const artisans_module_1 = require("./artisans/artisans.module");
const products_module_1 = require("./products/products.module");
const catalog_module_1 = require("./catalog/catalog.module");
const categories_module_1 = require("./categories/categories.module");
const regions_module_1 = require("./regions/regions.module");
const cloudinary_module_1 = require("./cloudinary/cloudinary.module");
const mail_module_1 = require("./mail/mail.module");
const admin_module_1 = require("./admin/admin.module");
const audit_module_1 = require("./audit/audit.module");
const orders_module_1 = require("./orders/orders.module");
const reviews_module_1 = require("./reviews/reviews.module");
const payments_module_1 = require("./payments/payments.module");
const sitemap_controller_1 = require("./sitemap/sitemap.controller");
const stats_controller_1 = require("./stats.controller");
const logistics_module_1 = require("./logistics/logistics.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                envFilePath: ['.env', '../.env'],
                isGlobal: true,
                validationSchema: Joi.object({
                    DATABASE_URL: Joi.string().required(),
                    JWT_SECRET: Joi.string().required(),
                    JWT_REFRESH_SECRET: Joi.string().required(),
                    CLOUDINARY_CLOUD_NAME: Joi.string().required(),
                    CLOUDINARY_API_KEY: Joi.string().required(),
                    CLOUDINARY_API_SECRET: Joi.string().required(),
                    MAIL_USER: Joi.string().required(),
                    MAIL_PASS: Joi.string().required(),
                    DB_SYNCHRONIZE: Joi.string().optional(),
                }),
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    type: 'postgres',
                    url: configService.get('DATABASE_URL'),
                    autoLoadEntities: true,
                    synchronize: configService.get('DB_SYNCHRONIZE') === 'true',
                }),
                inject: [config_1.ConfigService],
            }),
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            artisans_module_1.ArtisansModule,
            products_module_1.ProductsModule,
            catalog_module_1.CatalogModule,
            categories_module_1.CategoriesModule,
            regions_module_1.RegionsModule,
            cloudinary_module_1.CloudinaryModule,
            mail_module_1.MailModule,
            admin_module_1.AdminModule,
            audit_module_1.AuditModule,
            orders_module_1.OrdersModule,
            reviews_module_1.ReviewsModule,
            payments_module_1.PaymentsModule,
            logistics_module_1.LogisticsModule,
        ],
        controllers: [app_controller_1.AppController, sitemap_controller_1.SitemapController, stats_controller_1.StatsController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map