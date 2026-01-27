import { Expose } from "class-transformer";

// Class that will be used by serialize interceptor to define how User entities are transformed when sent in responses.
export class UserDto {
    @Expose()
    id: string;

    @Expose()
    email: string;
}