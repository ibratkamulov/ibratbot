import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin',
}

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: false } })
export class User {
  @Prop({ required: true, unique: true, type: Number })
  telegramId: number;

  @Prop({ required: true, type: String, trim: true })
  fullName: string;

  @Prop({ required: false, type: String, trim: true, default: '' })
  username: string;

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @Prop({ type: Date })
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Index for fast lookup by telegramId (already unique, but explicit index improves read perf)
UserSchema.index({ telegramId: 1 });
