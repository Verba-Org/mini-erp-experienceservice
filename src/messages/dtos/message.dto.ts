import { Expose, Transform } from "class-transformer"


export class MessageDto {
    @Expose()
    id: string

    @Expose()
    content: string

    // Transform decorator to customize the serialization of the userId property from the nested user object which is part of the Message entity.
    @Expose()
    @Transform(({ obj }) => obj.user.id)
    userId: string
}   