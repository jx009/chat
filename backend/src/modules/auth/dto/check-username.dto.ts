import { IsString, Length, Matches } from "class-validator";

export class CheckUsernameDto {
  @IsString()
  @Length(4, 20)
  @Matches(/^[A-Za-z0-9_]+$/)
  username!: string;
}

