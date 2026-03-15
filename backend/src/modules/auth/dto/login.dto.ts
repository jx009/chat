import { IsString, Length, Matches, MinLength } from "class-validator";

export class LoginDto {
  @IsString()
  @Length(4, 20)
  @Matches(/^[A-Za-z0-9_]+$/)
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
