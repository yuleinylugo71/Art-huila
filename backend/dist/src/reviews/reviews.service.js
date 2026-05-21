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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const review_entity_1 = require("./entities/review.entity");
const product_entity_1 = require("../products/entities/product.entity");
const orders_service_1 = require("../orders/orders.service");
const order_entity_1 = require("../orders/entities/order.entity");
const mail_service_1 = require("../mail/mail.service");
let ReviewsService = class ReviewsService {
    reviewRepo;
    productRepo;
    ordersService;
    mailService;
    constructor(reviewRepo, productRepo, ordersService, mailService) {
        this.reviewRepo = reviewRepo;
        this.productRepo = productRepo;
        this.ordersService = ordersService;
        this.mailService = mailService;
    }
    async create(userId, data) {
        const product = await this.productRepo.findOneBy({ id: data.productId });
        if (!product)
            throw new common_1.NotFoundException('Producto no encontrado');
        const orders = await this.ordersService.findByUser(userId);
        const deliveredOrders = orders.filter(o => o.status === order_entity_1.OrderStatus.DELIVERED);
        const hasBought = deliveredOrders.some(o => o.items.some(i => i.product.id === data.productId));
        if (!hasBought) {
            const orderCount = orders.length;
            const deliveredCount = deliveredOrders.length;
            throw new common_1.BadRequestException(`No se pudo verificar la compra. Pedidos totales: ${orderCount}, Entregados: ${deliveredCount}. ` +
                `Para calificar, el pedido debe estar en estado 'delivered'.`);
        }
        const review = this.reviewRepo.create({
            rating: data.rating,
            comment: data.comment,
            product,
            user: { id: userId },
        });
        return this.reviewRepo.save(review);
    }
    async findByProduct(productId) {
        return this.reviewRepo.find({
            where: { product: { id: productId } },
            relations: ['user'],
            order: { created_at: 'DESC' },
        });
    }
    async findAll() {
        return this.reviewRepo.find({
            relations: ['user', 'product'],
            order: { created_at: 'DESC' },
        });
    }
    async findReported() {
        return this.reviewRepo.find({
            where: { is_reported: true },
            relations: ['user', 'product'],
            order: { created_at: 'DESC' },
        });
    }
    async report(id, reason) {
        const review = await this.reviewRepo.findOneBy({ id });
        if (!review)
            throw new common_1.NotFoundException('Reseña no encontrada');
        review.is_reported = true;
        review.report_reason = reason;
        return this.reviewRepo.save(review);
    }
    async resetReport(id) {
        const review = await this.reviewRepo.findOneBy({ id });
        if (!review)
            throw new common_1.NotFoundException('Reseña no encontrada');
        review.is_reported = false;
        review.report_reason = null;
        return this.reviewRepo.save(review);
    }
    async findOne(id) {
        return this.reviewRepo.findOne({ where: { id }, relations: ['user', 'product'] });
    }
    async remove(id) {
        const review = await this.reviewRepo.findOneBy({ id });
        if (!review)
            throw new common_1.NotFoundException('Reseña no encontrada');
        await this.reviewRepo.remove(review);
    }
    async respond(id, userId, response) {
        const review = await this.reviewRepo.findOne({
            where: { id },
            relations: ['user', 'product', 'product.artisan', 'product.artisan.user'],
        });
        if (!review)
            throw new common_1.NotFoundException('Reseña no encontrada');
        if (review.product.artisan.user.id !== userId) {
            throw new common_1.ForbiddenException('Solo el artesano que vendió el producto puede responder');
        }
        if (review.artisan_response) {
            throw new common_1.BadRequestException('Ya has respondido a esta reseña');
        }
        review.artisan_response = response;
        review.responded_at = new Date();
        const saved = await this.reviewRepo.save(review);
        try {
            await this.mailService.sendArtisanResponseEmail(review.user.email, review.user.full_name, review.product.artisan.user.full_name, review.product.name);
        }
        catch (e) {
            console.error('Error sending review response email:', e);
        }
        return saved;
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        orders_service_1.OrdersService,
        mail_service_1.MailService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map