import { IsString, MaxLength } from "class-validator";

export class SuggestUsernameDto {
  @IsString()
  @MaxLength(50)
  username!: string;
}

