import { UseInterceptors , NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable} from "rxjs";
import { map } from "rxjs/operators";
import { plainToInstance } from "class-transformer";


// Decorator factory function to apply the SerializeInterceptor with the specified DTO class.
export function Serialize(dto: any) {
    return UseInterceptors(new SerializeInterceptor(dto));
}


export class SerializeInterceptor implements NestInterceptor {

    constructor(private dto: any) {}
 
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        // Run something before a request is handled by the request handler
        // console.log('Im running before the handler', context);
        
        return next.handle().pipe(
            map((data: any) => {
                // Run something before the response is sent out
                // console.log('Im running before the response is sent out', data);
                // convert plain object to class instance and exclude any properties not defined with @Expose() decorator
                return plainToInstance(this.dto, data, { excludeExtraneousValues: true });
                // return data;
            })
        );
    }
}