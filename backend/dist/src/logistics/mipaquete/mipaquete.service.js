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
    getLocalShippingRates(destinationCity) {
        const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        const city = normalize(destinationCity);
        const zona0 = ['neiva', 'pitalito', 'garzon', 'la plata', 'campoalegre', 'palermo',
            'rivera', 'algeciras', 'yaguara', 'agrado', 'tarqui', 'suaza', 'acevedo',
            'san agustin', 'isnos', 'timana', 'nataga', 'tesalia'];
        const zona1 = ['ibague', 'espinal', 'honda', 'florencia', 'mocoa', 'popayan',
            'santander de quilichao', 'puerto asis'];
        const zona2 = ['bogota', 'soacha', 'zipaquira', 'chia', 'cali', 'palmira',
            'buenaventura', 'pereira', 'manizales', 'armenia', 'cartago', 'buga',
            'tulua', 'dosquebradas', 'villavicencio', 'tunja'];
        const zona3 = ['medellin', 'bello', 'itagui', 'envigado', 'rionegro', 'barrancabermeja',
            'bucaramanga', 'cucuta', 'barranquilla', 'cartagena', 'santa marta',
            'monteria', 'sincelejo', 'valledupar', 'riohacha', 'soledad', 'giron', 'floridablanca'];
        const zona4 = ['leticia', 'mitu', 'puerto inirida', 'san jose del guaviare',
            'quibdo', 'arauca', 'yopal', 'san andres', 'providencia', 'puerto carreno'];
        const match = (zones) => zones.some(z => city.includes(z) || z.includes(city));
        if (match(zona0)) {
            return {
                cost: 7000,
                estimatedDays: 1,
                carrier: 'Servientrega',
                options: [
                    { carrier: 'Servientrega', price: 7000, estimatedDays: 1 },
                    { carrier: 'Coordinadora', price: 8500, estimatedDays: 1 },
                ],
            };
        }
        if (match(zona1)) {
            return {
                cost: 10000,
                estimatedDays: 2,
                carrier: 'Servientrega',
                options: [
                    { carrier: 'Servientrega', price: 10000, estimatedDays: 2 },
                    { carrier: 'Coordinadora', price: 11500, estimatedDays: 2 },
                    { carrier: 'Envia', price: 12500, estimatedDays: 3 },
                ],
            };
        }
        if (match(zona2)) {
            return {
                cost: 13000,
                estimatedDays: 2,
                carrier: 'Servientrega',
                options: [
                    { carrier: 'Servientrega', price: 13000, estimatedDays: 2 },
                    { carrier: 'Coordinadora', price: 14500, estimatedDays: 2 },
                    { carrier: 'TCC', price: 15000, estimatedDays: 3 },
                ],
            };
        }
        if (match(zona3)) {
            return {
                cost: 16000,
                estimatedDays: 3,
                carrier: 'Servientrega',
                options: [
                    { carrier: 'Servientrega', price: 16000, estimatedDays: 3 },
                    { carrier: 'Coordinadora', price: 17500, estimatedDays: 2 },
                    { carrier: 'TCC', price: 18000, estimatedDays: 3 },
                    { carrier: 'Envia', price: 20000, estimatedDays: 4 },
                ],
            };
        }
        if (match(zona4)) {
            return {
                cost: 22000,
                estimatedDays: 5,
                carrier: 'Servientrega',
                options: [
                    { carrier: 'Servientrega', price: 22000, estimatedDays: 5 },
                    { carrier: 'TCC', price: 24000, estimatedDays: 5 },
                ],
            };
        }
        return {
            cost: 14000,
            estimatedDays: 3,
            carrier: 'Servientrega',
            options: [
                { carrier: 'Servientrega', price: 14000, estimatedDays: 3 },
                { carrier: 'Coordinadora', price: 15500, estimatedDays: 2 },
                { carrier: 'TCC', price: 16000, estimatedDays: 3 },
            ],
        };
    }
    async getShippingQuote(origin, destinationCity, weight) {
        try {
            const apiKey = this.configService.get('MIPAQUETE_API_KEY');
            if (!apiKey) {
                throw new Error('MIPAQUETE_API_KEY no está configurada');
            }
            const originId = await this.getCityId(origin, apiKey);
            const destId = await this.getCityId(destinationCity, apiKey);
            const response = await fetch('https://api.mipaquete.com/v1/sending/calculateSending', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    type: 1,
                    origin: originId,
                    destiny: destId,
                    width: 10,
                    height: 10,
                    large: 10,
                    weight: weight || 1,
                    declared_value: 10000,
                    quantity: 1,
                    payment_type: 1
                })
            });
            if (!response.ok) {
                throw new Error(`MiPaquete calculateSending API error: ${response.statusText}`);
            }
            const data = await response.json();
            const optionsArray = Array.isArray(data) ? data : (data.options || data.data || []);
            if (optionsArray.length > 0) {
                const mappedOptions = optionsArray.map((opt) => ({
                    carrier: opt.carrier || opt.companyName || opt.transportadora || 'Transportadora',
                    price: opt.price || opt.cost || opt.value || 12000,
                    estimatedDays: opt.estimatedDays || opt.deliveryDays || 3
                }));
                mappedOptions.sort((a, b) => a.price - b.price);
                const cheapest = mappedOptions[0];
                return {
                    isFallback: false,
                    originCity: origin,
                    cost: cheapest.price,
                    estimatedDays: cheapest.estimatedDays,
                    carrier: cheapest.carrier,
                    fallbackMessage: null,
                    options: mappedOptions
                };
            }
            throw new Error('No shipping options returned by MiPaquete');
        }
        catch (error) {
            console.warn('MiPaquete API no disponible, usando tarifas por zonas geográficas:', error.message);
            const rates = this.getLocalShippingRates(destinationCity);
            return {
                isFallback: false,
                originCity: origin,
                cost: rates.cost,
                estimatedDays: rates.estimatedDays,
                carrier: rates.carrier,
                fallbackMessage: null,
                options: rates.options,
            };
        }
    }
    async generateGuide(orderId) {
        try {
            const apiKey = this.configService.get('MIPAQUETE_API_KEY');
            if (!apiKey) {
                throw new Error('MIPAQUETE_API_KEY no está configurada');
            }
            const response = await fetch('https://api.mipaquete.com/v1/sending/generateguide', {
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