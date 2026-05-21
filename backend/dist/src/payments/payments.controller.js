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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const payments_service_1 = require("./payments.service");
const config_1 = require("@nestjs/config");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const orders_service_1 = require("../orders/orders.service");
let PaymentsController = class PaymentsController {
    paymentsService;
    ordersService;
    configService;
    constructor(paymentsService, ordersService, configService) {
        this.paymentsService = paymentsService;
        this.ordersService = ordersService;
        this.configService = configService;
    }
    async getEpaycoConfig() {
        return {
            publicKey: this.configService.get('EPAYCO_PUBLIC_KEY'),
        };
    }
    async createPreference(orderId, user) {
        const order = await this.ordersService.findOne(orderId, user);
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return this.paymentsService.createPreference(order);
    }
    async handleWebhook(body, query) {
        console.log('Webhook received:', { body, query });
        await this.paymentsService.handleWebhook({ ...body, ...query });
        return { status: 'ok' };
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Get)('epayco-config'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getEpaycoConfig", null);
__decorate([
    (0, common_1.Post)('create-preference/:orderId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createPreference", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "handleWebhook", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService,
        orders_service_1.OrdersService,
        config_1.ConfigService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map