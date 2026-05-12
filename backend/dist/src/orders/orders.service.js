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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("./entities/order.entity");
const order_item_entity_1 = require("./entities/order-item.entity");
const product_entity_1 = require("../products/entities/product.entity");
let OrdersService = class OrdersService {
    ordersRepository;
    orderItemsRepository;
    productsRepository;
    dataSource;
    constructor(ordersRepository, orderItemsRepository, productsRepository, dataSource) {
        this.ordersRepository = ordersRepository;
        this.orderItemsRepository = orderItemsRepository;
        this.productsRepository = productsRepository;
        this.dataSource = dataSource;
    }
    async create(createOrderDto, user) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            let totalAmount = 0;
            const orderItems = [];
            const order = new order_entity_1.Order();
            order.user = user;
            order.shipping_address = createOrderDto.shipping_address;
            order.payment_method = createOrderDto.payment_method;
            order.status = order_entity_1.OrderStatus.PENDING;
            for (const itemDto of createOrderDto.items) {
                const product = await queryRunner.manager.findOne(product_entity_1.Product, {
                    where: { id: itemDto.productId },
                });
                if (!product) {
                    throw new common_1.NotFoundException(`Product ${itemDto.productId} not found`);
                }
                if (product.stock < itemDto.quantity) {
                    throw new common_1.BadRequestException(`Not enough stock for product: ${product.name}`);
                }
                product.stock -= itemDto.quantity;
                await queryRunner.manager.save(product);
                const subtotal = product.price * itemDto.quantity;
                totalAmount += subtotal;
                const orderItem = new order_item_entity_1.OrderItem();
                orderItem.product = product;
                orderItem.quantity = itemDto.quantity;
                orderItem.unit_price = product.price;
                orderItem.subtotal = subtotal;
                orderItems.push(orderItem);
            }
            order.total_amount = totalAmount;
            const savedOrder = await queryRunner.manager.save(order_entity_1.Order, order);
            for (const item of orderItems) {
                item.order = savedOrder;
                await queryRunner.manager.save(order_item_entity_1.OrderItem, item);
            }
            await queryRunner.commitTransaction();
            return this.ordersRepository.findOne({
                where: { id: savedOrder.id },
                relations: ['items', 'items.product', 'items.product.artisan'],
            });
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    findAll(user) {
        return this.ordersRepository.find({
            where: { user: { id: user.id } },
            relations: ['items', 'items.product', 'items.product.artisan', 'items.product.images'],
            order: { created_at: 'DESC' },
        });
    }
    findOne(id, user) {
        return this.ordersRepository.findOne({
            where: { id, user: { id: user.id } },
            relations: ['items', 'items.product', 'items.product.artisan', 'items.product.images'],
        });
    }
    async processPayment(id, user) {
        const order = await this.findOne(id, user);
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        order.status = order_entity_1.OrderStatus.PAID;
        order.payment_id = `MOCK_PAY_${Date.now()}`;
        return this.ordersRepository.save(order);
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __param(2, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], OrdersService);
//# sourceMappingURL=orders.service.js.map