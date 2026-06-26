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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MipaqueteService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
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
        const response = await fetch('https://api-v2.mpr.mipaquete.com/getLocations', {
            method: 'GET',
            headers: {
                'apikey': apiKey,
                'session-tracker': crypto.randomUUID()
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
            const response = await fetch('https://api-v2.mpr.mipaquete.com/quoteShipping', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': apiKey,
                    'session-tracker': crypto.randomUUID()
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
                isFallback: true,
                originCity: origin,
                cost: rates.cost,
                estimatedDays: rates.estimatedDays,
                carrier: rates.carrier,
                fallbackMessage: 'Tarifa estimada por zona geográfica. El costo final puede variar.',
                options: rates.options,
            };
        }
    }
    async generateGuide(order) {
        try {
            const apiKey = this.configService.get('MIPAQUETE_API_KEY');
            if (!apiKey) {
                throw new Error('MIPAQUETE_API_KEY no configurada');
            }
            const originId = await this.getCityId('Neiva', apiKey);
            const destCityName = order.shipping_address?.city || order.shipping_city || order.city || 'Bogotá';
            const destId = await this.getCityId(destCityName, apiKey);
            const totalWeight = order.items?.reduce((sum, item) => sum + (item.product?.weight || 0.5) * item.quantity, 0) || 1;
            const declaredValue = Number(order.total_amount || order.total || 10000);
            const payload = {
                type: 1,
                origin: originId,
                destiny: destId,
                width: 20,
                height: 15,
                large: 25,
                weight: totalWeight,
                declared_value: declaredValue,
                quantity: 1,
                payment_type: 1,
                name: order.shipping_address?.receiver_name || order.buyer_name || order.user?.full_name || 'Cliente',
                address: order.shipping_address?.address || order.address || 'Calle 1 # 1-1',
                phone: order.shipping_address?.phone || order.buyer_phone || order.user?.phone || '3108617630',
                email: order.user?.email || order.buyer_email || 'correo@ejemplo.com',
                description: `Pedido ArtHuila #${order.id.slice(0, 8)}`,
                reference: order.id
            };
            const response = await fetch('https://api-v2.mpr.mipaquete.com/createSending', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': apiKey,
                    'session-tracker': crypto.randomUUID()
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(`MiPaquete createSending error: ${JSON.stringify(data)}`);
            }
            return {
                guideNumber: data.guideNumber || data.guide || data.numero_guia,
                trackingUrl: data.trackingUrl || data.url_rastreo || `https://mipaquete.com/tracking/${data.guideNumber || data.guide || data.numero_guia}`,
                carrier: data.carrier || data.transportadora || 'MiPaquete'
            };
        }
        catch (error) {
            console.error('Error generating MiPaquete guide:', error);
            throw error;
        }
    }
    async getCoverageLocations() {
        try {
            const apiKey = this.configService.get('MIPAQUETE_API_KEY');
            if (!apiKey) {
                throw new Error('MIPAQUETE_API_KEY no está configurada');
            }
            const towns = await this.getTowns(apiKey);
            const grouped = {};
            for (const t of towns) {
                const dept = (t.stateName || t.departamento || t.state || 'Otros').toUpperCase().trim();
                const city = t.name || t.cityName || t.nombre;
                if (city && dept) {
                    if (!grouped[dept]) {
                        grouped[dept] = new Set();
                    }
                    const formattedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
                    grouped[dept].add(formattedCity);
                }
            }
            const result = {};
            for (const dept of Object.keys(grouped)) {
                result[dept] = Array.from(grouped[dept]).sort();
            }
            return result;
        }
        catch (error) {
            console.warn('Error fetching coverage from MiPaquete API, using local fallback:', error.message);
            return this.getLocalFallbackCoverage();
        }
    }
    getLocalFallbackCoverage() {
        return {
            'HUILA': [
                'Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Campoalegre', 'Palermo',
                'Rivera', 'Algeciras', 'Yaguará', 'Agrado', 'Tarqui', 'Suaza', 'Acevedo',
                'San Agustín', 'Isnos', 'Timaná', 'Nátaga', 'Tesalia'
            ],
            'TOLIMA': ['Ibagué', 'Espinal', 'Honda'],
            'CAQUETA': ['Florencia'],
            'PUTUMAYO': ['Mocoa', 'Puerto Asís'],
            'CAUCA': ['Popayán', 'Santander de Quilichao'],
            'CUNDINAMARCA': ['Bogotá', 'Soacha', 'Zipaquirá', 'Chía'],
            'VALLE DEL CAUCA': ['Cali', 'Palmira', 'Buenaventura', 'Cartago', 'Buga', 'Tuluá'],
            'RISARALDA': ['Pereira', 'Dosquebradas'],
            'CALDAS': ['Manizales'],
            'QUINDIO': ['Armenia'],
            'META': ['Villavicencio'],
            'BOYACA': ['Tunja'],
            'ANTIOQUIA': ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Rionegro'],
            'SANTANDER': ['Barrancabermeja', 'Bucaramanga', 'Girón', 'Floridablanca'],
            'NORTE DE SANTANDER': ['Cúcuta'],
            'ATLANTICO': ['Barranquilla', 'Soledad'],
            'BOLIVAR': ['Cartagena'],
            'MAGDALENA': ['Santa Marta'],
            'CORDOBA': ['Montería'],
            'SUCRE': ['Sincelejo'],
            'CESAR': ['Valledupar'],
            'LA GUAJIRA': ['Riohacha'],
            'AMAZONAS': ['Leticia'],
            'VAUPES': ['Mitú'],
            'GUAINIA': ['Puerto Inírida'],
            'GUAVIARE': ['San José del Guaviare'],
            'CHOCO': ['Quibdó'],
            'ARAUCA': ['Arauca'],
            'CASANARE': ['Yopal'],
            'SAN ANDRES Y PROVIDENCIA': ['San Andrés', 'Providencia'],
            'VICHADA': ['Puerto Carreño']
        };
    }
};
exports.MipaqueteService = MipaqueteService;
exports.MipaqueteService = MipaqueteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MipaqueteService);
//# sourceMappingURL=mipaquete.service.js.map