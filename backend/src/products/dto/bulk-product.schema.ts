import { z } from 'zod';

export const ProductBulkSchema = z.object({
  name: z.string()
    .min(5, 'Mínimo 5 caracteres')
    .max(120, 'Máximo 120 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-]+$/, 'Solo letras, números y guiones'),
  
  slug: z.string()
    .max(150)
    .regex(/^[a-z0-9\-]*$/, 'Solo minúsculas, números y guiones')
    .optional()
    .or(z.literal('')),
  
  price: z.coerce.number()
    .positive('Precio debe ser mayor a 0')
    .max(999999999.99, 'Precio máximo: $999,999,999.99')
    .transform(val => Number(val.toFixed(2))),
  
  stock: z.coerce.number()
    .int('Stock debe ser entero')
    .nonnegative('Stock no puede ser negativo')
    .max(999999, 'Stock máximo: 999,999 unidades'),
  
  cultural_origin: z.string()
    .min(10, 'Describe el origen cultural (mínimo 10 caracteres)')
    .max(5000),
  
  technique: z.string()
    .min(10, 'Describe la técnica artesanal (mínimo 10 caracteres)')
    .max(5000),
  
  significance: z.string()
    .min(20, 'Explica el significado cultural (mínimo 20 caracteres)')
    .max(5000),
  
  short_description: z.string()
    .max(150, 'Máximo 150 caracteres')
    .optional(),
  
  materials: z.string().max(5000).optional(),
  dimensions: z.string().max(255).optional(),
  weight: z.string().max(255).optional(),
  care_instructions: z.string().max(5000).optional(),
  
  category_name: z.string().min(1, 'Categoría requerida'),
  region_name: z.string().min(1, 'Región requerida'),
  
  image_urls: z.string()
    .transform(str => str.split('|').map(s => s.trim()).filter(Boolean))
    .optional(),
  
  status: z.enum(['draft', 'published', 'out_of_stock', 'hidden'])
    .default('draft')
    .optional(),
  
  is_handmade: z.coerce.boolean().default(true).optional(),
  
  meta_title: z.string().max(255).optional(),
  meta_description: z.string().max(5000).optional(),
});

export type ProductBulkType = z.infer<typeof ProductBulkSchema>;
