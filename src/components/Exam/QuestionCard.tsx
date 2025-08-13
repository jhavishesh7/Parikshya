import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { useExamStore } from '../../store/examStore';
import { geminiService } from '../../lib/gemini';

const QuestionCard: React.FC = () => {
  const { currentQuestion, submitAnswer, timeRemaining } = useExamStore();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (optionIndex: number) => {
    setSelectedAnswer(optionIndex);
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null || !currentQuestion) return;
    
    setLoading(true);
    await submitAnswer(selectedAnswer);
    
    // Generate explanation after submitting
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    const explanationText = await geminiService.generateExplanation(
      currentQuestion, 
      selectedAnswer, 
      isCorrect
    );
    
    setExplanation(explanationText);
    setShowExplanation(true);
    setLoading(false);
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setExplanation('');
    setShowExplanation(false);
  };

  if (!currentQuestion) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">Loading next question...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Difficulty</p>
              <p className={`font-semibold capitalize ${
                currentQuestion.difficulty === 'easy' ? 'text-green-400' :
                currentQuestion.difficulty === 'moderate' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {currentQuestion.difficulty}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className={`text-lg font-mono font-bold ${
              timeRemaining < 300 ? 'text-red-400' : 'text-blue-400'
            }`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>

        {currentQuestion.topic && (
          <div className="inline-block bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
            {currentQuestion.topic}
          </div>
        )}
      </div>

      {/* Question */}
      <div className="p-6">
        <h3 className="text-lg font-medium text-white mb-6 leading-relaxed">
          {currentQuestion.question_text}
        </h3>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => !showExplanation && handleAnswerSelect(index)}
              disabled={showExplanation}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                selectedAnswer === index
                  ? showExplanation
                    ? selectedAnswer === currentQuestion.correct_answer
                      ? 'border-green-500 bg-green-500/10 text-green-400'
                      : 'border-red-500 bg-red-500/10 text-red-400'
                    : 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : showExplanation && index === currentQuestion.correct_answer
                    ? 'border-green-500 bg-green-500/10 text-green-400'
                    : 'border-gray-600 bg-gray-700/30 text-gray-300 hover:border-gray-500 hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                  selectedAnswer === index
                    ? showExplanation
                      ? selectedAnswer === currentQuestion.correct_answer
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-red-500 bg-red-500 text-white'
                      : 'border-blue-500 bg-blue-500 text-white'
                    : showExplanation && index === currentQuestion.correct_answer
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-600'
                }`}>
                  {String.fromCharCode(65 + index)}
                  {showExplanation && selectedAnswer === index && selectedAnswer !== currentQuestion.correct_answer && '✗'}
                  {showExplanation && index === currentQuestion.correct_answer && '✓'}
                </div>
                <span>{option}</span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Explanation */}
        {showExplanation && explanation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-700/50 rounded-lg p-4 mb-6"
          >
            <div className="flex items-start space-x-3">
              {selectedAnswer === currentQuestion.correct_answer ? (
                <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
              )}
              <div>
                <h4 className="text-white font-semibold mb-2">
                  {selectedAnswer === currentQuestion.correct_answer ? 'Correct!' : 'Incorrect'}
                </h4>
                <div className="text-gray-300 whitespace-pre-wrap">{explanation}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Button */}
        <div className="flex justify-center">
          {!showExplanation ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null || loading}
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
                selectedAnswer !== null && !loading
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                'Submit Answer'
              )}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNextQuestion}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all duration-200 shadow-lg shadow-green-500/25"
            >
              Next Question
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default QuestionCard;