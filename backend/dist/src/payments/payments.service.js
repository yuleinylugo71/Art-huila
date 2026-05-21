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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const orders_service_1 = require("../orders/orders.service");
const crypto = __importStar(require("crypto"));
let PaymentsService = class PaymentsService {
    configService;
    ordersService;
    constructor(configService, ordersService) {
        this.configService = configService;
        this.ordersService = ordersService;
    }
    async createPreference(order) {
        return { status: 'epayco-direct' };
    }
    async handleWebhook(data) {
        try {
            const p_cust_id_client = this.configService.get('EPAYCO_P_CUST_ID');
            const p_key = this.configService.get('EPAYCO_P_KEY');
            const x_ref_payco = data.x_ref_payco;
            const x_transaction_id = data.x_transaction_id;
            const x_amount = data.x_amount;
            const x_currency_code = data.x_currency_code;
            const x_signature = data.x_signature;
            const x_id_invoice = data.x_id_invoice;
            if (!x_ref_payco || !x_transaction_id || !x_amount || !x_currency_code || !x_signature) {
                console.warn('Incomplete ePayco webhook data');
                return;
            }
            const signature = crypto
                .createHash('sha256')
                .update(`${p_cust_id_client}^${p_key}^${x_ref_payco}^${x_transaction_id}^${x_amount}^${x_currency_code}`)
                .digest('hex');
            if (signature === x_signature) {
                const x_cod_response = data.x_cod_response;
                if (x_cod_response === 1 || x_cod_response === '1') {
                    if (x_id_invoice) {
                        await this.ordersService.markAsPaid(x_id_invoice, x_ref_payco);
                        console.log(`Order ${x_id_invoice} marked as PAID via Webhook (ePayco)`);
                    }
                }
            }
            else {
                console.warn('Invalid ePayco webhook signature');
            }
        }
        catch (error) {
            console.error('Error handling webhook:', error);
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => orders_service_1.OrdersService))),
    __metadata("design:paramtypes", [config_1.ConfigService,
        orders_service_1.OrdersService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map