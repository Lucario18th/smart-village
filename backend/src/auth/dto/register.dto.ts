import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsInt,
  IsPositive,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsInt()
  @IsPositive()
  postalCodeId!: number;

  @IsOptional()
  @IsString()
  villageName?: string;

  @IsOptional()
  @IsString()
  locationName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  infoText?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  municipalityCode?: string;
}
