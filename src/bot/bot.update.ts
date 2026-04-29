import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Update, Start, Hears, Ctx, On } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { QuizService } from './quiz.service';
import { BUTTONS, mainKeyboard, quizDoneKeyboard } from './keyboards/main.keyboard';

@Update()
export class BotUpdate {
  private readonly logger = new Logger(BotUpdate.name);
  private readonly adminId: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly quizService: QuizService,
  ) {
    this.adminId = this.configService.get<number>('app.adminId') ?? 0;
  }

  // ─── /start ───────────────────────────────────────────────────────────────
  @Start()
  async onStart(@Ctx() ctx: Context): Promise<void> {
    const firstName = ctx.from?.first_name ?? 'foydalanuvchi';
    await ctx.reply(
      `👋 Xush kelibsiz, ${firstName}!\n\nQuyidagi tugmalardan foydalaning.`,
      mainKeyboard,
    );
  }

  // ─── 📝 Register ──────────────────────────────────────────────────────────
  @Hears(BUTTONS.REGISTER)
  async onRegister(@Ctx() ctx: Context): Promise<void> {
    if (!ctx.from) { await ctx.reply("❌ Akkauntni aniqlab bo'lmadi."); return; }

    const { id, first_name, last_name, username } = ctx.from;
    const fullName = [first_name, last_name].filter(Boolean).join(' ');

    try {
      if (await this.usersService.existsByTelegramId(id)) {
        await ctx.reply("ℹ️ Siz allaqachon ro'yxatdan o'tgansiz!");
        return;
      }
      const dto: CreateUserDto = { telegramId: id, fullName, username: username ?? '' };
      await this.usersService.create(dto);
      await ctx.reply(`✅ Ro'yxatdan o'tish muvaffaqiyatli!\n\n👤 Ism: ${fullName}\n🆔 ID: ${id}`);
    } catch (err: any) {
      this.logger.error(`Registration failed for ${id}`, err.stack);
      await ctx.reply("❌ Xatolik yuz berdi. Qayta urinib ko'ring.");
    }
  }

  // ─── 👥 Students list ─────────────────────────────────────────────────────
  @Hears(BUTTONS.STUDENTS_LIST)
  async onStudentsList(@Ctx() ctx: Context): Promise<void> {
    if (!ctx.from) return;
    if (ctx.from.id !== this.adminId) {
      await ctx.reply('🚫 Ruxsat yo\'q. Bu buyruq faqat admin uchun.');
      return;
    }
    try {
      const users = await this.usersService.findAll();
      if (users.length === 0) { await ctx.reply("📭 Hali hech kim ro'yxatdan o'tmagan."); return; }
      const lines = users.map((u, i) => `${i + 1}. ${u.fullName}${u.username ? ' @' + u.username : ''}`);
      await ctx.reply(`👥 *Talabalar ro'yxati (${users.length})*\n\n${lines.join('\n')}`, { parse_mode: 'Markdown' });
    } catch (err: any) {
      this.logger.error('Failed to fetch students', err.stack);
      await ctx.reply("❌ Ro'yxatni olishda xatolik.");
    }
  }

  // ─── 🧮 Test boshlash ─────────────────────────────────────────────────────
  @Hears(BUTTONS.START_QUIZ)
  async onStartQuiz(@Ctx() ctx: Context): Promise<void> {
    if (!ctx.from) return;
    await this.beginQuiz(ctx);
  }

  @Hears(BUTTONS.NEXT_QUIZ)
  async onNextQuiz(@Ctx() ctx: Context): Promise<void> {
    if (!ctx.from) return;
    await this.beginQuiz(ctx);
  }

  private async beginQuiz(ctx: Context): Promise<void> {
    const session = this.quizService.startSession(ctx.from!.id);
    await ctx.reply(
      `🧮 *Matematik test boshlandi!*\n\n` +
      `Savol *1 / 10*:\n\n` +
      `❓ *${session.questions[0].text}*\n\n` +
      `Javobingizni raqamda yozing 👇`,
      { parse_mode: 'Markdown' },
    );
  }

  // ─── Barcha text xabarlari ────────────────────────────────────────────────
  @On('text')
  async onText(@Ctx() ctx: Context): Promise<void> {
    if (!ctx.from || !('text' in ctx.message!)) return;
    const text = (ctx.message as any).text as string;
    const telegramId = ctx.from.id;

    if (this.quizService.hasActiveSession(telegramId)) {
      await this.handleQuizAnswer(ctx, text, telegramId);
      return;
    }

    await ctx.reply('🤔 Bu buyruqni tushunmadim.\nQuyidagi tugmalardan foydalaning.', mainKeyboard);
  }

  // ─── Quiz javobini qayta ishlash ──────────────────────────────────────────
  private async handleQuizAnswer(ctx: Context, text: string, telegramId: number): Promise<void> {
    const userAnswer = parseInt(text.trim(), 10);

    if (isNaN(userAnswer)) {
      await ctx.reply('⚠️ Iltimos faqat *raqam* yozing!', { parse_mode: 'Markdown' });
      return;
    }

    const result = this.quizService.submitAnswer(telegramId, userAnswer);
    if (!result) return;

    const { correct, finished, finalScore, currentIndex, questions } = result;
    const correctAnswer = questions[currentIndex].answer;
    const feedbackLine = correct
      ? '✅ *To\'g\'ri!*'
      : `❌ *Noto'g'ri!* To'g'ri javob: *${correctAnswer}*`;

    if (finished) {
      const total = 10;
      const emoji = finalScore === 10 ? '🏆' : finalScore >= 7 ? '🎉' : finalScore >= 5 ? '👍' : '😔';

      await ctx.reply(
        `${feedbackLine}\n\n` +
        `${emoji} *Test yakunlandi!*\n\n` +
        `┌─────────────────\n` +
        `│ 📊 Natija: *${finalScore} / ${total}*\n` +
        `│ ✅ To'g'ri javoblar: *${finalScore}*\n` +
        `│ ❌ Noto'g'ri javoblar: *${total - finalScore}*\n` +
        `└─────────────────\n\n` +
        `Yana o'ynash uchun tugmani bosing 👇`,
        { parse_mode: 'Markdown', ...quizDoneKeyboard },
      );
      return;
    }

    // Keyingi savol
    const session = this.quizService.getSession(telegramId)!;
    const nextQ = session.questions[session.currentIndex];
    const nextNum = session.currentIndex + 1;

    await ctx.reply(
      `${feedbackLine}\n\n` +
      `Savol *${nextNum} / 10*:\n\n` +
      `❓ *${nextQ.text}*\n\n` +
      `Javobingizni raqamda yozing 👇`,
      { parse_mode: 'Markdown' },
    );
  }
}
