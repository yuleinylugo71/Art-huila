import { ConfigService } from '@nestjs/config';
export declare class MipaqueteService {
    private configService;
    private townsCache;
    constructor(configService: ConfigService);
    private getTowns;
    private getCityId;
    private getLocalShippingRates;
    getShippingQuote(origin: string, destinationCity: string, weight?: number): Promise<{
        isFallback: boolean;
        originCity: string;
        cost: any;
        estimatedDays: any;
        carrier: any;
        fallbackMessage: null;
        options: any;
    }>;
    generateGuide(orderId: string): Promise<{
        guideNumber: any;
        trackingUrl: any;
    }>;
}
