import { supabase } from './supabase';
import { TriviaQuestion, TriviaCategory } from '../types';

// Private in-memory store so correct answers are not exposed in React state before submission
const answerVault = new Map<string, { correctAnswer: string; explanation: string }>();

export const triviaService = {
   /**
    * Verify a chosen answer against the private vault
    */
   verifyAnswer(questionId: string, chosen: string | null): { isCorrect: boolean; correctAnswer: string; explanation: string } {
      const entry = answerVault.get(questionId);
      if (!entry) {
         return { isCorrect: false, correctAnswer: '', explanation: '' };
      }
      const isCorrect = Boolean(chosen && chosen.trim() === entry.correctAnswer.trim());
      return {
         isCorrect,
         correctAnswer: entry.correctAnswer,
         explanation: entry.explanation,
      };
   },

   /**
    * Fetch questions from Supabase with optional category and difficulty filtering
    */
   async getQuestions(options?: {
      category?: TriviaCategory;
      difficulty?: 'easy' | 'medium' | 'hard';
      limit?: number;
   }): Promise<TriviaQuestion[]> {
      try {
         let query = supabase.from('questions').select('*');

         if (options?.category && options.category !== 'all') {
            query = query.eq('category', options.category);
         }

         if (options?.difficulty) {
            query = query.eq('difficulty', options.difficulty);
         }

         const { data, error } = await query;

         if (error) {
            console.error('Supabase trivia query error:', error);
            throw error;
         }

         if (!data || data.length === 0) {
            return [];
         }

         // Map and normalize options; store answers privately in answerVault
         const formatted: TriviaQuestion[] = data.map((item: any) => {
            const qId = String(item.id);
            answerVault.set(qId, {
               correctAnswer: item.correct_answer || '',
               explanation: item.explanation || '',
            });

            return {
               id: qId,
               question: item.question,
               options: Array.isArray(item.options) ? item.options : JSON.parse(item.options || '[]'),
               correct_answer: '', // Hidden until submitted via verifyAnswer
               explanation: '',    // Hidden until submitted via verifyAnswer
               category: item.category || 'general',
               difficulty: item.difficulty || 'medium',
               season: item.season ?? null,
               source: item.source || 'official_f1',
               created_at: item.created_at,
            };
         });

         // 1. Deduplicate by question text (in case seed script was executed multiple times in Supabase)
         const seen = new Set<string>();
         const uniqueQuestions: TriviaQuestion[] = [];
         for (const q of formatted) {
            const key = q.question.trim().toLowerCase();
            if (!seen.has(key)) {
               seen.add(key);
               uniqueQuestions.push(q);
            }
         }

         // 2. Fisher-Yates unbiased shuffle
         for (let i = uniqueQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [uniqueQuestions[i], uniqueQuestions[j]] = [uniqueQuestions[j], uniqueQuestions[i]];
         }

         if (options?.limit && options.limit > 0) {
            return uniqueQuestions.slice(0, options.limit);
         }

         return uniqueQuestions;
      } catch (err) {
         console.error('Failed to fetch trivia questions from Supabase:', err);
         throw err;
      }
   },

   /**
    * Fetch category question count statistics
    */
   async getCategoryStats(): Promise<Record<string, number>> {
      try {
         const { data, error } = await supabase.from('questions').select('category');
         if (error || !data) return {};

         const counts: Record<string, number> = {};
         data.forEach((row: { category: string }) => {
            counts[row.category] = (counts[row.category] || 0) + 1;
         });
         return counts;
      } catch {
         return {};
      }
   },
};
