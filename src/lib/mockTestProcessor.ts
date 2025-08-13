import { geminiService } from './gemini';
import { supabase } from './supabase';

export interface MCQQuestion {
  question_text: string;
  options: string[];
  correct_answer: number; // 0-based index
  explanation?: string;
  topic?: string;
  difficulty: 'easy' | 'moderate' | 'difficult';
}

export interface MockTestProcessingResult {
  success: boolean;
  questions: MCQQuestion[];
  totalQuestions: number;
  error?: string;
}

export class MockTestProcessor {
  /**
   * Process a PDF file to extract MCQs and create a mock test
   */
  static async processPDFForMockTest(
    pdfUrl: string, 
    mockTestId: string, 
    subjectId: string
  ): Promise<MockTestProcessingResult> {
    try {
      // Step 1: Extract text from PDF using Gemini
      const extractedText = await this.extractTextFromPDF(pdfUrl);
      
      // Step 2: Parse MCQs using AI
      const questions = await this.parseMCQsFromText(extractedText, subjectId);
      
      // Step 3: Save questions to database
      await this.saveQuestionsToDatabase(questions, mockTestId, subjectId);
      
      // Step 4: Update mock test with question count
      await this.updateMockTestQuestionCount(mockTestId, questions.length);
      
      return {
        success: true,
        questions,
        totalQuestions: questions.length
      };
      
    } catch (error) {
      console.error('Mock test processing error:', error);
      return {
        success: false,
        questions: [],
        totalQuestions: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extract text content from PDF using Gemini AI
   */
  private static async extractTextFromPDF(pdfUrl: string): Promise<string> {
    const prompt = `
      You are an expert at extracting text content from PDFs. 
      Please extract all the text content from this PDF, focusing on:
      - Multiple choice questions (MCQs)
      - Question stems and options
      - Correct answers
      - Any explanations or context
      
      Format the output as clean, readable text that can be processed for MCQ extraction.
    `;

    try {
      const response = await geminiService.generateContent(prompt, pdfUrl);
      return response || 'No text could be extracted from PDF';
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error}`);
    }
  }

  /**
   * Parse MCQs from extracted text using Gemini AI
   */
  private static async parseMCQsFromText(text: string, subjectId: string): Promise<MCQQuestion[]> {
    const prompt = `
      You are an expert at parsing multiple choice questions from text.
      
      Please analyze the following text and extract all MCQs. For each question, provide:
      1. The question text
      2. Four options (A, B, C, D)
      3. The correct answer (specify which option is correct)
      4. An explanation if available
      5. The topic/subject area
      6. Difficulty level (easy, moderate, or difficult)
      
      Format your response as a JSON array with this structure:
      [
        {
          "question_text": "What is the SI unit of force?",
          "options": ["Newton", "Joule", "Watt", "Pascal"],
          "correct_answer": 0,
          "explanation": "Force is measured in Newtons",
          "topic": "Mechanics",
          "difficulty": "moderate"
        }
      ]
      
      Important:
      - Use 0-based indexing for correct_answer (0=A, 1=B, 2=C, 3=D)
      - Ensure each question has exactly 4 options
      - Set difficulty based on question complexity
      - Only include valid MCQs with clear questions and options
      
      Text to analyze:
      ${text}
    `;

    try {
      const response = await geminiService.generateContent(prompt);
      
      if (!response) {
        throw new Error('No response from AI service');
      }

      // Try to parse the JSON response
      let questions: MCQQuestion[];
      try {
        // Look for JSON in the response (AI might add extra text)
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          questions = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in AI response');
        }
      } catch (parseError) {
        throw new Error(`Failed to parse AI response as JSON: ${parseError}`);
      }

      // Validate questions structure
      const validatedQuestions = questions.filter(q => 
        q.question_text && 
        q.options && 
        q.options.length === 4 &&
        typeof q.correct_answer === 'number' &&
        q.correct_answer >= 0 && 
        q.correct_answer <= 3
      );

      return validatedQuestions;
      
    } catch (error) {
      throw new Error(`Failed to parse MCQs: ${error}`);
    }
  }

  /**
   * Save extracted questions to the database
   */
  private static async saveQuestionsToDatabase(
    questions: MCQQuestion[], 
    mockTestId: string, 
    subjectId: string
  ): Promise<void> {
    const questionsToInsert = questions.map(q => ({
      mock_test_id: mockTestId,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      subject_id: subjectId,
      difficulty_level: q.difficulty,
      explanation: q.explanation,
      topic: q.topic
    }));

    const { error } = await supabase
      .from('mock_questions')
      .insert(questionsToInsert);

    if (error) {
      throw new Error(`Failed to save questions to database: ${error.message}`);
    }
  }

  /**
   * Update mock test with the actual question count
   */
  private static async updateMockTestQuestionCount(mockTestId: string, questionCount: number): Promise<void> {
    const { error } = await supabase
      .from('mock_tests')
      .update({ 
        total_questions: questionCount,
        status: 'ready' // Mark as ready for use
      })
      .eq('id', mockTestId);

    if (error) {
      throw new Error(`Failed to update mock test: ${error.message}`);
    }
  }

  /**
   * Get processing status of a mock test
   */
  static async getProcessingStatus(mockTestId: string): Promise<{
    status: 'processing' | 'ready' | 'failed';
    totalQuestions: number;
    processedQuestions: number;
  }> {
    try {
      const { data: mockTest, error: mockError } = await supabase
        .from('mock_tests')
        .select('status, total_questions')
        .eq('id', mockTestId)
        .single();

      if (mockError) throw mockError;

      const { count: processedQuestions, error: countError } = await supabase
        .from('mock_questions')
        .select('*', { count: 'exact', head: true })
        .eq('mock_test_id', mockTestId);

      if (countError) throw countError;

      return {
        status: mockTest.status || 'processing',
        totalQuestions: mockTest.total_questions || 0,
        processedQuestions: processedQuestions || 0
      };
    } catch (error) {
      throw new Error(`Failed to get processing status: ${error}`);
    }
  }
}
