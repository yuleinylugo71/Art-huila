import { IsEmail, IsIn, IsString, MinLength, Matches, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  full_name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número',
  })
  password: string;

  @IsIn(['artesano', 'comprador'])
  role: 'artesano' | 'comprador';
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class RefreshDto {
  @IsString()
  refresh_token: string;
}

export class RegisterArtisanDto extends RegisterDto {
  @IsOptional()
  @IsString()
  id_number?: string;

  @IsString()
  cultural_history: string;

  @IsString()
  category_id: string;

  @IsString()
  region_id: string;

  @IsString()
  truthfulness_declaration: string; // From FormData it comes as string "true"
}
