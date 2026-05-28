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
const mail_service_1 = require("../mail/mail.service");
const mipaquete_service_1 = require("../logistics/mipaquete/mipaquete.service");
let OrdersService = class OrdersService {
    ordersRepository;
    orderItemsRepository;
    productsRepository;
    mailService;
    mipaqueteService;
    dataSource;
    constructor(ordersRepository, orderItemsRepository, productsRepository, mailService, mipaqueteService, dataSource) {
        this.ordersRepository = ordersRepository;
        this.orderItemsRepository = orderItemsRepository;
        this.productsRepository = productsRepository;
        this.mailService = mailService;
        this.mipaqueteService = mipaqueteService;
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
            let originCity = 'Neiva';
            for (const itemDto of createOrderDto.items) {
                const product = await queryRunner.manager.findOne(product_entity_1.Product, {
                    where: { id: itemDto.productId },
                    relations: ['artisan', 'artisan.region']
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
            const quote = await this.mipaqueteService.getShippingQuote(originCity, createOrderDto.shipping_address.city || 'Bogotá', 1);
            order.shipping_cost = quote.cost;
            order.estimated_delivery_days = quote.estimatedDays;
            order.shipping_company = quote.carrier;
            order.total_amount = totalAmount + Number(order.shipping_cost);
            order.items = orderItems;
            const savedOrder = await queryRunner.manager.save(order_entity_1.Order, order);
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
    findAll() {
        return this.ordersRepository.find({
            relations: ['user', 'items', 'items.product', 'items.product.artisan', 'items.product.images'],
            order: { created_at: 'DESC' },
        });
    }
    async getShippingQuoteForCart(destinationCity, items) {
        let originCity = 'Neiva';
        const quote = await this.mipaqueteService.getShippingQuote(originCity, destinationCity, 1);
        return {
            ...quote
        };
    }
    findByUser(userId) {
        return this.ordersRepository.find({
            where: { user: { id: userId } },
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
        return this.markAsPaid(id, `MOCK_PAY_${Date.now()}`);
    }
    async markAsPaid(orderId, paymentId) {
        const order = await this.ordersRepository.findOne({ where: { id: orderId } });
        if (!order) {
            throw new common_1.NotFoundException(`Order ${orderId} not found`);
        }
        order.status = order_entity_1.OrderStatus.PAID;
        order.payment_id = paymentId;
        const savedOrder = await this.ordersRepository.save(order);
        try {
            const fullOrder = await this.ordersRepository.findOne({
                where: { id: orderId },
                relations: ['user', 'items', 'items.product', 'items.product.artisan', 'items.product.artisan.user']
            });
            if (fullOrder) {
                await this.mailService.sendOrderConfirmationEmail(fullOrder.user.email, fullOrder.user.full_name, fullOrder.id, fullOrder.total_amount);
                for (const item of fullOrder.items) {
                    const artisanUser = item.product.artisan?.user;
                    if (artisanUser) {
                        await this.mailService.sendSaleNotificationEmail(artisanUser.email, artisanUser.full_name, item.product.name, item.quantity);
                    }
                }
            }
        }
        catch (error) {
            console.error('Error sending order notification emails:', error);
        }
        return savedOrder;
    }
    async updateStatus(id, status, user) {
        const order = await this.ordersRepository.findOne({
            where: { id },
            relations: ['items', 'items.product']
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (user) {
            const role = user.role;
            if (role === 'artesano') {
                if (order.status === order_entity_1.OrderStatus.PAID && status === order_entity_1.OrderStatus.PREPARING) {
                }
                else if (order.status === order_entity_1.OrderStatus.PREPARING && status === order_entity_1.OrderStatus.SHIPPED) {
                }
                else {
                    throw new common_1.BadRequestException('El artesano solo puede cambiar el estado de Pagado a En preparación o de En preparación a Despachado.');
                }
            }
            else if (role === 'admin') {
                if (status === order_entity_1.OrderStatus.CANCELLED || status === order_entity_1.OrderStatus.DELIVERED) {
                }
                else {
                    throw new common_1.BadRequestException('El administrador solo puede marcar un pedido como Cancelado o Entregado.');
                }
            }
        }
        if (status === order_entity_1.OrderStatus.CANCELLED && order.status !== order_entity_1.OrderStatus.CANCELLED) {
            for (const item of order.items) {
                const product = item.product;
                product.stock += item.quantity;
                await this.productsRepository.save(product);
            }
        }
        order.status = status;
        return this.ordersRepository.save(order);
    }
    async updateTracking(id, trackingNumber, shippingCompany) {
        const order = await this.ordersRepository.findOne({ where: { id } });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        order.tracking_number = trackingNumber;
        order.shipping_company = shippingCompany;
        order.status = order_entity_1.OrderStatus.SHIPPED;
        return this.ordersRepository.save(order);
    }
    async findArtisanSales(userId) {
        return this.orderItemsRepository.find({
            where: { product: { artisan: { user: { id: userId } } } },
            relations: ['order', 'order.user', 'product', 'product.images'],
            order: { order: { created_at: 'DESC' } },
        });
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
        mail_service_1.MailService,
        mipaquete_service_1.MipaqueteService,
        typeorm_2.DataSource])
], OrdersService);
//# sourceMappingURL=orders.service.js.map