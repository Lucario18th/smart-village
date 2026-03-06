import { IsEmail, IsString, Matches, Length } from "class-validator";

export class VerifyEmailCodeDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d+$/)
  code!: string;
}
