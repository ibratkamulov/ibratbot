import {
  Injectable,
  Logger,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Register a new user. Throws ConflictException if telegramId already exists.
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const user = new this.userModel(createUserDto);
      const saved = await user.save();
      this.logger.log(`New user registered: ${saved.telegramId} (${saved.fullName})`);
      return saved;
    } catch (error: any) {
      // MongoDB duplicate key error code
      if (error.code === 11000) {
        throw new ConflictException(
          `User with telegramId ${createUserDto.telegramId} already exists`,
        );
      }
      this.logger.error('Failed to create user', error.stack);
      throw new InternalServerErrorException('Could not register user');
    }
  }

  /**
   * Check whether a user with the given telegramId is already registered.
   */
  async existsByTelegramId(telegramId: number): Promise<boolean> {
    const count = await this.userModel.countDocuments({ telegramId }).exec();
    return count > 0;
  }

  /**
   * Fetch all registered users, sorted by registration date (newest last).
   */
  async findAll(): Promise<User[]> {
    return this.userModel.find().sort({ createdAt: 1 }).lean().exec();
  }

  /**
   * Find a single user by their Telegram ID.
   */
  async findByTelegramId(telegramId: number): Promise<User | null> {
    return this.userModel.findOne({ telegramId }).lean().exec();
  }
}
