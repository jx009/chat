import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
      status: (code: number) => {
        json: (payload: unknown) => void;
      };
    }>();
    const request = ctx.getRequest<{ url: string }>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const errorResponse = exception.getResponse();
      const payload =
        typeof errorResponse === "string"
          ? { message: errorResponse }
          : (errorResponse as { code?: number; message?: string | string[] });
      const message =
        payload.message ?? exception.message;

      response.status(status).json({
        code: payload.code ?? status,
        message: Array.isArray(message) ? message.join(", ") : message,
        data: null,
        path: request.url,
        timestamp: new Date().toISOString(),
      });

      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
      data: null,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
