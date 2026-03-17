import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsInt,
  IsPositive,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { AccountType } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;

  @IsOptional()
  @IsBoolean()
  isPublicAppApiEnabled?: boolean;

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
