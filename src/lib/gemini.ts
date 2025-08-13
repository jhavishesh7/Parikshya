import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  async analyzePerformance(responses: any[], questions: any[]): Promise<any> {
    const prompt = `
    Analyze the following student performance data and provide detailed insights:
    
    Responses: ${JSON.stringify(responses)}
    Questions: ${JSON.stringify(questions)}
    
    Please provide:
    1. Overall performance summary
    2. Weak topics identification
    3. Strong topics identification  
    4. Specific recommendations for improvement
    5. Study plan suggestions
    
    Format the response as JSON with the following structure:
    {
      "overall_score": number,
      "accuracy_percentage": number,
      "weak_topics": string[],
      "strong_topics": string[],
      "recommendations": string[],
      "study_plan": string,
      "next_focus_areas": string[]
    }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error('Gemini analysis error:', error);
      return null;
    }
  }

  async selectAdaptiveQuestion(
    userAbility: number,
    previousQuestions: string[],
    availableQuestions: any[],
    examType: 'IOE' | 'CEE'
  ): Promise<any> {
    const prompt = `
    Select the most appropriate next question for adaptive testing:
    
    User ability estimate (theta): ${userAbility}
    Previous questions answered: ${previousQuestions.length}
    Available questions: ${JSON.stringify(availableQuestions.map(q => ({
      id: q.id,
      difficulty: q.difficulty,
      topic: q.topic,
      irt_difficulty: q.irt_difficulty,
      success_rate: q.times_correct / Math.max(q.times_attempted, 1)
    })))}
    Exam type: ${examType}
    
    Select a question that:
    1. Matches the user's current ability level
    2. Provides maximum information for ability estimation
    3. Hasn't been asked recently
    4. Covers important topics for ${examType}
    
    Return the question ID and reasoning as JSON:
    {
      "question_id": "string",
      "reasoning": "string",
      "expected_difficulty": number
    }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error('Gemini question selection error:', error);
      return null;
    }
  }

  async generateExplanation(question: any, userAnswer: number, isCorrect: boolean): Promise<string> {
    const prompt = `
    Provide a detailed explanation for this question:
    
    Question: ${question.question_text}
    Options: ${question.options.join(', ')}
    Correct Answer: ${question.options[question.correct_answer]}
    User's Answer: ${question.options[userAnswer]}
    Result: ${isCorrect ? 'Correct' : 'Incorrect'}
    
    Provide:
    1. Why the correct answer is right
    2. Why other options are wrong
    3. Key concepts to understand
    4. Study tips for this topic
    
    Keep it educational and encouraging.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini explanation error:', error);
      return 'Unable to generate explanation at this time.';
    }
  }

  async chatAssistant(message: string, userContext: any): Promise<string> {
    const prompt = `
    You are an AI study assistant for NEB exam preparation (IOE/CEE). 
    
    User context: ${JSON.stringify(userContext)}
    User message: ${message}
    
    Provide helpful, accurate responses related to:
    - Study strategies
    - Topic explanations
    - Exam tips
    - Performance improvement
    
    Keep responses concise but informative.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini chat error:', error);
      return 'I apologize, but I am unable to respond at this time. Please try again later.';
    }
  }

  async calibrateQuestionDifficulty(questions: any[], responseData: any[]): Promise<any[]> {
    const prompt = `
    Analyze question performance data and recalibrate difficulty parameters:
    
    Questions: ${JSON.stringify(questions)}
    Response Data: ${JSON.stringify(responseData)}
    
    For each question, provide updated IRT parameters:
    - difficulty (b): how hard the question is
    - discrimination (a): how well it differentiates ability levels  
    - guessing (c): probability of guessing correctly
    
    Return as JSON array with question_id and updated parameters.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error('Gemini calibration error:', error);
      return questions;
    }
  }
}

export const geminiService = new GeminiService();