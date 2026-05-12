import { IsArray, IsNotEmpty, IsNumber, IsObject, IsString, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsObject()
  @IsNotEmpty()
  shipping_address: any;

  @IsString()
  @IsNotEmpty()
  payment_method: string;
}
