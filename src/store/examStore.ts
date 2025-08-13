import { create } from 'zustand';
import { supabase, Question, TestSession } from '../lib/supabase';
import { geminiService } from '../lib/gemini';

interface ExamState {
  currentSession: TestSession | null;
  currentQuestion: Question | null;
  questionIndex: number;
  timeRemaining: number;
  answers: Record<string, number>;
  loading: boolean;
  
  startSession: (examType: 'IOE' | 'CEE', sessionType: string) => Promise<void>;
  loadNextQuestion: () => Promise<void>;
  submitAnswer: (answer: number) => Promise<void>;
  endSession: () => Promise<void>;
  setTimeRemaining: (time: number) => void;
}

export const useExamStore = create<ExamState>((set, get) => ({
  currentSession: null,
  currentQuestion: null,
  questionIndex: 0,
  timeRemaining: 0,
  answers: {},
  loading: false,

  startSession: async (examType: 'IOE' | 'CEE', sessionType: string) => {
    set({ loading: true });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile) return;

    // Create new test session
    const totalQuestions = examType === 'IOE' ? 100 : 200;
    const durationMinutes = examType === 'IOE' ? 120 : 180;

    const { data: session, error } = await supabase
      .from('test_sessions')
      .insert([{
        user_id: profile.id,
        session_type: sessionType,
        exam_type: examType,
        total_questions: totalQuestions,
        ai_ability_start: profile.ai_ability_estimate,
        duration_minutes: durationMinutes,
      }])
      .select()
      .single();

    if (session && !error) {
      set({ 
        currentSession: session, 
        timeRemaining: durationMinutes * 60,
        questionIndex: 0,
        answers: {},
      });
      
      await get().loadNextQuestion();
    }
    
    set({ loading: false });
  },

  loadNextQuestion: async () => {
    const { currentSession } = get();
    if (!currentSession) return;

    set({ loading: true });

    // Get user's exam type subjects
    const subjectFilter = currentSession.exam_type === 'IOE' 
      ? ['physics', 'chemistry', 'mathematics', 'english']
      : ['physics', 'chemistry', 'biology'];

    const { data: subjects } = await supabase
      .from('subjects')
      .select('id')
      .in('name', subjectFilter);

    if (!subjects) return;

    const { data: availableQuestions } = await supabase
      .from('questions')
      .select('*')
      .in('subject_id', subjects.map(s => s.id))
      .contains('exam_types', [currentSession.exam_type]);

    if (!availableQuestions) return;

    // Use Gemini AI to select next question
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', currentSession.user_id)
      .single();

    if (!profile) return;

    const previousQuestionIds = Object.keys(get().answers);
    const selection = await geminiService.selectAdaptiveQuestion(
      profile.ai_ability_estimate,
      previousQuestionIds,
      availableQuestions,
      currentSession.exam_type
    );

    if (selection) {
      const selectedQuestion = availableQuestions.find(q => q.id === selection.question_id);
      if (selectedQuestion) {
        set({ currentQuestion: selectedQuestion });
      }
    } else {
      // Fallback to random selection
      const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
      set({ currentQuestion: randomQuestion });
    }

    set({ loading: false });
  },

  submitAnswer: async (answer: number) => {
    const { currentSession, currentQuestion, questionIndex, answers } = get();
    if (!currentSession || !currentQuestion) return;

    const isCorrect = answer === currentQuestion.correct_answer;
    const newAnswers = { ...answers, [currentQuestion.id]: answer };

    // Record response
    await supabase
      .from('responses')
      .insert([{
        session_id: currentSession.id,
        question_id: currentQuestion.id,
        user_answer: answer,
        is_correct: isCorrect,
        time_taken_seconds: 30, // This should be calculated from actual time
        ai_confidence_level: 0.8,
      }]);

    // Update session progress
    const questionsAttempted = Object.keys(newAnswers).length;
  const correctAnswers = Object.values(newAnswers).filter(ans => ans === currentQuestion.correct_answer).length;

    await supabase
      .from('test_sessions')
      .update({
        questions_attempted: questionsAttempted,
        correct_answers: correctAnswers,
        completion_percentage: (questionsAttempted / currentSession.total_questions) * 100,
      })
      .eq('id', currentSession.id);

    set({ 
      answers: newAnswers,
      questionIndex: questionIndex + 1,
    });

    // Load next question if not finished
    if (questionsAttempted < currentSession.total_questions) {
      await get().loadNextQuestion();
    } else {
      await get().endSession();
    }
  },

  endSession: async () => {
    const { currentSession, answers } = get();
    if (!currentSession) return;

    const endTime = new Date().toISOString();
    const questionsAttempted = Object.keys(answers).length;

    // Get all responses for analysis
    const { data: responses } = await supabase
      .from('responses')
      .select('*, questions(*)')
      .eq('session_id', currentSession.id);

    if (responses) {
      // Use Gemini AI for performance analysis
      const analysis = await geminiService.analyzePerformance(
        responses,
        responses.map(r => r.questions)
      );

      // Update session with final results
      await supabase
        .from('test_sessions')
        .update({
          end_time: endTime,
          ai_analysis: analysis,
          weak_topics_identified: analysis?.weak_topics || [],
          strong_topics_identified: analysis?.strong_topics || [],
          recommendations: analysis?.study_plan || '',
          ai_ability_end: analysis?.overall_score || currentSession.ai_ability_start,
        })
        .eq('id', currentSession.id);

      // Update user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentSession.user_id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            ai_ability_estimate: analysis?.overall_score || profile.ai_ability_estimate,
            total_questions_answered: profile.total_questions_answered + questionsAttempted,
            correct_answers: profile.correct_answers + currentSession.correct_answers,
            weak_topics: analysis?.weak_topics || profile.weak_topics,
            strong_topics: analysis?.strong_topics || profile.strong_topics,
            last_active: new Date().toISOString(),
          })
          .eq('id', profile.id);
      }
    }

    set({
      currentSession: null,
      currentQuestion: null,
      questionIndex: 0,
      timeRemaining: 0,
      answers: {},
    });
  },

  setTimeRemaining: (time: number) => {
    set({ timeRemaining: time });
    
    if (time <= 0) {
      get().endSession();
    }
  },
}));