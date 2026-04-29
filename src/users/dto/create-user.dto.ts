import { IsNumber, IsString, IsOptional, IsEnum, Min } from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class CreateUserDto {
  @IsNumber()
  @Min(1)
  telegramId: number;

  @IsString()
  fullName: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
