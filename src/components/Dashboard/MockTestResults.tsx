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
      <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
        <h3 className="text-xl font-bold text-white mb-4">Mock Test Results</h3>
        {results.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No mock test results yet.</p>
            <p className="text-sm">Take some mock tests to see your results here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.slice(0, 5).map((result, index) => {
              const accuracy = (result.correct_answers / result.total_questions) * 100;
              return (
                <div key={result.id} className="bg-black/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      {accuracy >= 80 ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : accuracy < 60 ? (
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
                        accuracy >= 80 ? 'text-green-400' 
                        : accuracy < 60 ? 'text-red-400'
                        : 'text-blue-400'
                      }`}>
                        {accuracy.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {result.time_taken_minutes} min
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {results.length > 5 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Showing 5 of {results.length} results
            </p>
          </div>
        )}
      </div>
    );
  }
};

export default MockTestResults;
