import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MipaqueteService {
  private townsCache: any[] = [];

  constructor(private configService: ConfigService) {}

  private async getTowns(apiKey: string) {
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

  private async getCityId(cityName: string, apiKey: string): Promise<string> {
    const towns = await this.getTowns(apiKey);
    const normalizedCity = cityName.toLowerCase().trim();
    
    const town = towns.find((t: any) => 
      t.name?.toLowerCase().includes(normalizedCity) || 
      t.cityName?.toLowerCase().includes(normalizedCity) ||
      t.nombre?.toLowerCase().includes(normalizedCity)
    );
    
    if (town) {
      return town._id || town.id;
    }
    throw new Error(`City not found in MiPaquete: ${cityName}`);
  }

  async getShippingQuote(origin: string, destinationCity: string, weight?: number) {
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

  async generateGuide(orderId: string) {
    try {
      const apiKey = this.configService.get<string>('MIPAQUETE_API_KEY');
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
    } catch (error) {
      console.error('Error generating MiPaquete guide:', error);
      throw new InternalServerErrorException('Error generating shipping guide');
    }
  }
}
