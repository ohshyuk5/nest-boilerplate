import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SignUpDto } from '@routes/auth/dtos/sign-up.dto';
import { User } from '@routes/users/schemas/user.entity';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  private logger = new Logger('UsersService');

  async createUser(signUpDto: SignUpDto): Promise<any> {
    const { username, password } = signUpDto;
    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt());

    return this.usersRepository
      .insert({
        username: username,
        password: hashedPassword,
      })
      .catch((err) => {
        this.logger.error(`createUser :: ${err}`);
        return null;
      });
  }

  async getUser(username: string) {
    return this.usersRepository.findOne({
      where: { username: username },
    });
  }
}