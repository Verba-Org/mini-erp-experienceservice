import { Controller, Post , Body, Get, Param, Query , Delete, Patch, Session , UseInterceptors, UseGuards } from '@nestjs/common';
import { CreateUserDtos } from './dtos/create-user.dtos';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UsersService } from './users.service';
import { Serialize } from 'src/common/interceptors/serialize.interceptors';
import { AuthService } from './auth.service';
import { UserDto } from './dtos/user.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
// import { CurrentUserInterceptor } from 'src/common/interceptors/current-user.interceptor';
import { User } from './users.entity';
import { AuthGuard } from 'src/common/guards/auth.guard';


@Controller('auth')
@Serialize(UserDto) // apply to all routes in this controller
// useInterceptors to apply the CurrentUserInterceptor to this controller
// @UseInterceptors(CurrentUserInterceptor) // commenting this out to use global interceptor instead - check users.module.ts for the configuration.
export class UsersController {

    constructor(private usersService: UsersService , private authService: AuthService) {}

    @Post('/signup')
    async createUser(@Body() user: CreateUserDtos, @Session() session: any) {
        const storedUser = await this.authService.signUp(user.email, user.password);
        session.userId = storedUser.id;
        return storedUser;
    }

    @Post('/signin')
    async signIn(@Body() user: CreateUserDtos, @Session() session: any) {
        const storedUser = await this.authService.signIn(user.email, user.password);
        // store the user id inside the session object which is managed by cookie-session middleware
        session.userId = storedUser.id;
        return storedUser;
    }

    // Return the currently signed-in user using the CurrentUser decorator and interceptor
    @Get('/whoami')
    // Guard the route using AuthGuard and ensure only authenticated users can access it
    @UseGuards(AuthGuard)
    whoAmI(@CurrentUser() user: User) {
        // return this.usersService.findOne(session.userId);
        return user;
    }

    @Post('/signout')
    signOut(@Session() session: any) {
        // Set the userId to null to sign out
        session.userId = null;
    }

    @Get('/:id')
    getUser(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }
    
    @Get()
    // lots of code, use decorator to apply interceptor
    // @UseInterceptors(new SerializeInterceptor(UserDto))
    @Serialize(UserDto)
    getUsersByEmail(@Query('email') email: string) {
        return this.usersService.find(email);
    }

    @Delete('/:id')
    deleteUser(@Param('id') id: string) {
        return this.usersService.remove(id);
    }

    @Patch('/:id')
    updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
        // returns a promoise of the updated user. NestJS handles the async/await internally.
        return this.usersService.update(id, body);
    }

}
