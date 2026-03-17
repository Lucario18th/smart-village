import { IsBoolean, IsEnum } from 'class-validator';
import { AccountType } from '@prisma/client';

export class UpdateAccountSettingsDto {
  @IsEnum(AccountType)
  accountType!: AccountType;

  @IsBoolean()
  isPublicAppApiEnabled!: boolean;
}
