import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

type ResponsePayload<T> = {
  code: number;
  message: string;
  data: T;
};

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ResponsePayload<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponsePayload<T>> {
    return next.handle().pipe(
      map((data) => ({
        code: 0,
        message: "ok",
        data,
      })),
    );
  }
}

