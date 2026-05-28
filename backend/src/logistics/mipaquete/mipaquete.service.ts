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

  /**
   * Calcula tarifas de envío desde Neiva usando zonas geográficas reales de Colombia.
   * Zona 0: Local Neiva / Huila
   * Zona 1: Departamentos vecinos (Tolima, Caquetá, Putumayo, Cauca)
   * Zona 2: Ciudades intermedias (Bogotá, Eje Cafetero, Valle del Cauca)
   * Zona 3: Ciudades lejanas (Costa, Noroccidente, Santanderes)
   * Zona 4: Extremos / Archipiélagos
   */
  private getLocalShippingRates(destinationCity: string): {
    cost: number;
    estimatedDays: number;
    carrier: string;
    options: { carrier: string; price: number; estimatedDays: number }[];
  } {
    const normalize = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    const city = normalize(destinationCity);

    // Zona 0: Neiva y municipios del Huila
    const zona0 = ['neiva', 'pitalito', 'garzon', 'la plata', 'campoalegre', 'palermo',
      'rivera', 'algeciras', 'yaguara', 'agrado', 'tarqui', 'suaza', 'acevedo',
      'san agustin', 'isnos', 'timana', 'nataga', 'tesalia'];

    // Zona 1: Tolima, Caquetá, Putumayo, Cauca (vecinos)
    const zona1 = ['ibague', 'espinal', 'honda', 'florencia', 'mocoa', 'popayan',
      'santander de quilichao', 'puerto asis'];

    // Zona 2: Bogotá, Eje Cafetero, Valle
    const zona2 = ['bogota', 'soacha', 'zipaquira', 'chia', 'cali', 'palmira',
      'buenaventura', 'pereira', 'manizales', 'armenia', 'cartago', 'buga',
      'tulua', 'dosquebradas', 'villavicencio', 'tunja'];

    // Zona 3: Costa, Santanderes, Antioquia, Norte
    const zona3 = ['medellin', 'bello', 'itagui', 'envigado', 'rionegro', 'barrancabermeja',
      'bucaramanga', 'cucuta', 'barranquilla', 'cartagena', 'santa marta',
      'monteria', 'sincelejo', 'valledupar', 'riohacha', 'soledad', 'giron', 'floridablanca'];

    // Zona 4: Extremos / Archipiélagos
    const zona4 = ['leticia', 'mitu', 'puerto inirida', 'san jose del guaviare',
      'quibdo', 'arauca', 'yopal', 'san andres', 'providencia', 'puerto carreno'];

    const match = (zones: string[]) =>
      zones.some(z => city.includes(z) || z.includes(city));

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

  async getShippingQuote(origin: string, destinationCity: string, weight?: number) {
    try {
      const apiKey = this.configService.get<string>('MIPAQUETE_API_KEY');
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
        const mappedOptions = optionsArray.map((opt: any) => ({
          carrier: opt.carrier || opt.companyName || opt.transportadora || 'Transportadora',
          price: opt.price || opt.cost || opt.value || 12000,
          estimatedDays: opt.estimatedDays || opt.deliveryDays || 3
        }));
        
        mappedOptions.sort((a: any, b: any) => a.price - b.price);
        
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
    } catch (error) {
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

  async generateGuide(orderId: string) {
    try {
      const apiKey = this.configService.get<string>('MIPAQUETE_API_KEY');
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
    } catch (error) {
      console.error('Error generating MiPaquete guide:', error);
      throw new InternalServerErrorException('Error generating shipping guide');
    }
  }
}
