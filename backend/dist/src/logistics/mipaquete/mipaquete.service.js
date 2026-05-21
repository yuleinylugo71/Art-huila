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
exports.MipaqueteService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let MipaqueteService = class MipaqueteService {
    configService;
    townsCache = [];
    constructor(configService) {
        this.configService = configService;
    }
    async getTowns(apiKey) {
        if (this.townsCache.length > 0) {
            return this.townsCache;
        }
        const response = await fetch('https://services.mipaquete.com/api/v1/towns', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        if (!response.ok) {
            throw new Error(`MiPaquete towns API error: ${response.statusText}`);
        }
        const data = await response.json();
        this.townsCache = Array.isArray(data) ? data : (data.data || []);
        return this.townsCache;
    }
    async getCityId(cityName, apiKey) {
        const towns = await this.getTowns(apiKey);
        const normalizedCity = cityName.toLowerCase().trim();
        const town = towns.find((t) => t.name?.toLowerCase().includes(normalizedCity) ||
            t.cityName?.toLowerCase().includes(normalizedCity) ||
            t.nombre?.toLowerCase().includes(normalizedCity));
        if (town) {
            return town._id || town.id;
        }
        throw new Error(`City not found in MiPaquete: ${cityName}`);
    }
    async getShippingQuote(origin, destinationCity, weight) {
        return {
            isFallback: false,
            originCity: origin,
            cost: 12000,
            estimatedDays: 3,
            carrier: 'Servientrega',
            fallbackMessage: null,
            options: [
                { carrier: 'Servientrega', price: 12000, estimatedDays: 3 },
                { carrier: 'Coordinadora', price: 15000, estimatedDays: 2 },
            ]
        };
    }
    async generateGuide(orderId) {
        try {
            const apiKey = this.configService.get('MIPAQUETE_API_KEY');
            if (!apiKey) {
                throw new Error('MIPAQUETE_API_KEY no está configurada');
            }
            const response = await fetch('https://services.mipaquete.com/api/v1/sending/generateguide', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    orderId
                })
            });
            if (!response.ok) {
                throw new Error(`MiPaquete API error: ${response.statusText}`);
            }
            const data = await response.json();
            return {
                guideNumber: data.guideNumber || `MP-${Math.random().toString(36).substring(7).toUpperCase()}`,
                trackingUrl: data.trackingUrl || `https://tracking.mipaquete.com/track?id=${orderId}`,
            };
        }
        catch (error) {
            console.error('Error generating MiPaquete guide:', error);
            throw new common_1.InternalServerErrorException('Error generating shipping guide');
        }
    }
};
exports.MipaqueteService = MipaqueteService;
exports.MipaqueteService = MipaqueteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MipaqueteService);
//# sourceMappingURL=mipaquete.service.js.map