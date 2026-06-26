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
    } | {
        isFallback: boolean;
        originCity: string;
        cost: number;
        estimatedDays: number;
        carrier: string;
        fallbackMessage: string;
        options: {
            carrier: string;
            price: number;
            estimatedDays: number;
        }[];
    }>;
    generateGuide(order: any): Promise<{
        guideNumber: string;
        trackingUrl: string;
        carrier: string;
    }>;
    getCoverageLocations(): Promise<{
        [department: string]: string[];
    }>;
    private getLocalFallbackCoverage;
}
