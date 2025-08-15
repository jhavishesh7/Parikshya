import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Target } from 'lucide-react';

interface MockTestResult {
  id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken_minutes: number;
  completed_at: string;
}

interface MockTestResultsProps {
  results: MockTestResult[];
}

const MockTestResults: React.FC<MockTestResultsProps> = ({ results }) => {
  if (!results || results.length === 0) {
    return (
      <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50">
        <div className="text-center text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p>No mock test results yet</p>
          <p className="text-sm">Complete some mock tests to see your results here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Target className="w-5 h-5 mr-2 text-primary-400" />
        Recent Mock Test Results
      </h3>
      
      <div className="space-y-3">
        {results.slice(0, 5).map((result, index) => {
          const accuracy = (result.correct_answers / result.total_questions) * 100;
          const isGoodPerformance = accuracy >= 80;
          const isPoorPerformance = accuracy < 60;
          
          return (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-lg border ${
                isGoodPerformance 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : isPoorPerformance 
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-blue-500/10 border-blue-500/30'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  {isGoodPerformance ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : isPoorPerformance ? (
                    <XCircle className="w-5 h-5 text-red-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-blue-400" />
                  )}
                  
                  <div>
                    <p className="text-white font-medium">
                      {result.correct_answers}/{result.total_questions} correct
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(result.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-bold text-lg ${
                    isGoodPerformance ? 'text-green-400' 
                    : isPoorPerformance ? 'text-red-400'
                    : 'text-blue-400'
                  }`}>
                    {accuracy.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {result.time_taken_minutes} min
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {results.length > 5 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Showing 5 of {results.length} results
          </p>
        </div>
      )}
    </div>
  );
};

export default MockTestResults;
