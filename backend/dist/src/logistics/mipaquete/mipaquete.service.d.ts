import { ConfigService } from '@nestjs/config';
export declare class MipaqueteService {
    private configService;
    private townsCache;
    constructor(configService: ConfigService);
    private getTowns;
    private getCityId;
    getShippingQuote(origin: string, destinationCity: string, weight?: number): Promise<{
        isFallback: boolean;
        originCity: string;
        cost: number;
        estimatedDays: number;
        carrier: string;
        fallbackMessage: null;
        options: {
            carrier: string;
            price: number;
            estimatedDays: number;
        }[];
    }>;
    generateGuide(orderId: string): Promise<{
        guideNumber: any;
        trackingUrl: any;
    }>;
}
