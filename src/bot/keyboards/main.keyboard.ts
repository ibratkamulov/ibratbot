import { Markup } from 'telegraf';

/** Button labels — single source of truth used in both sending and matching */
export const BUTTONS = {
  REGISTER: '📝 Register',
  STUDENTS_LIST: '👥 Students list',
  START_QUIZ: '🧮 Matematik test',
  NEXT_QUIZ: '🔄 Yana 10 ta savol',
} as const;

/** Main reply keyboard shown after /start */
export const mainKeyboard = Markup.keyboard([
  [BUTTONS.REGISTER, BUTTONS.STUDENTS_LIST],
  [BUTTONS.START_QUIZ],
])
  .resize()
  .persistent();

/** Keyboard shown after quiz is finished */
export const quizDoneKeyboard = Markup.keyboard([
  [BUTTONS.NEXT_QUIZ],
  [BUTTONS.REGISTER, BUTTONS.STUDENTS_LIST],
])
  .resize()
  .persistent();
