import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  name: string;

  @IsNumber()
  @Min(0, { message: 'El precio debe ser un número positivo' })
  price: number;

  @IsNumber()
  @Min(0, { message: 'El stock debe ser mayor o igual a 0' })
  stock: number;

  @IsString()
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  category_id: string;

  @IsString()
  @IsNotEmpty({ message: 'El municipio de origen es obligatorio' })
  region_id: string;

  @IsString()
  @IsNotEmpty({ message: 'El origen cultural es obligatorio' })
  cultural_origin: string;

  @IsString()
  @IsNotEmpty({ message: 'La técnica es obligatoria' })
  technique: string;

  @IsString()
  @IsNotEmpty({ message: 'El significado de la pieza es obligatorio' })
  significance: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripción corta es obligatoria' })
  short_description: string;

  @IsString()
  @IsNotEmpty({ message: 'Los materiales son obligatorios' })
  materials: string;

  @IsString()
  @IsNotEmpty({ message: 'Las dimensiones son obligatorias' })
  dimensions: string;

  @IsString()
  @IsNotEmpty({ message: 'El peso es obligatorio' })
  weight: string;

  @IsString()
  @IsNotEmpty({ message: 'Las instrucciones de cuidado son obligatorias' })
  care_instructions: string;

  @IsBoolean()
  @IsOptional()
  is_handmade?: boolean;
}
