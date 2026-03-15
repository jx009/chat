import { Body, Controller, Get, Ip, Post, Query } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { AuthService } from "./auth.service";
import { CheckUsernameDto } from "./dto/check-username.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";
import { SuggestUsernameDto } from "./dto/suggest-username.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get("check-username")
  checkUsername(@Query() query: CheckUsernameDto) {
    return this.authService.checkUsername(query.username);
  }

  @Public()
  @Get("suggest-username")
  suggestUsername(@Query() query: SuggestUsernameDto) {
    return this.authService.suggestUsername(query.username);
  }

  @Public()
  @Post("register")
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Public()
  @Post("login")
  login(@Body() body: LoginDto, @Ip() ip: string) {
    return this.authService.login(body, ip);
  }

  @Public()
  @Post("refresh")
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body.refreshToken);
  }
}

