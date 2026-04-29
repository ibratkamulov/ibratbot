import { Injectable } from '@nestjs/common';

export interface Question {
  text: string;
  answer: number;
}

export interface QuizSession {
  questions: Question[];
  currentIndex: number;
  correctCount: number;
}

export interface AnswerResult {
  correct: boolean;
  finished: boolean;
  finalScore: number;        // valid only when finished=true
  currentIndex: number;      // question index that was just answered (0-based)
  questions: Question[];     // full list so we can show the correct answer
}

const sessions = new Map<number, QuizSession>();

type Operator = '+' | '-' | '×' | '÷';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion(): Question {
  const ops: Operator[] = ['+', '-', '×', '÷'];
  const op = ops[randomInt(0, 3)];
  let a: number, b: number, answer: number;

  switch (op) {
    case '+':
      a = randomInt(1, 50); b = randomInt(1, 50); answer = a + b; break;
    case '-':
      a = randomInt(10, 50); b = randomInt(1, a); answer = a - b; break;
    case '×':
      a = randomInt(2, 12); b = randomInt(2, 12); answer = a * b; break;
    case '÷':
    default:
      b = randomInt(2, 12); answer = randomInt(2, 12); a = b * answer; break;
  }

  return { text: `${a} ${op} ${b} = ?`, answer };
}

@Injectable()
export class QuizService {
  startSession(telegramId: number): QuizSession {
    const questions = Array.from({ length: 10 }, generateQuestion);
    const session: QuizSession = { questions, currentIndex: 0, correctCount: 0 };
    sessions.set(telegramId, session);
    return session;
  }

  getSession(telegramId: number): QuizSession | undefined {
    return sessions.get(telegramId);
  }

  hasActiveSession(telegramId: number): boolean {
    return sessions.has(telegramId);
  }

  submitAnswer(telegramId: number, userAnswer: number): AnswerResult | null {
    const session = sessions.get(telegramId);
    if (!session) return null;

    const answeredIndex = session.currentIndex;
    const correct = userAnswer === session.questions[answeredIndex].answer;

    if (correct) session.correctCount++;
    session.currentIndex++;

    const finished = session.currentIndex >= 10;
    const finalScore = session.correctCount;
    const questions = session.questions;

    if (finished) sessions.delete(telegramId);

    return { correct, finished, finalScore, currentIndex: answeredIndex, questions };
  }
}
