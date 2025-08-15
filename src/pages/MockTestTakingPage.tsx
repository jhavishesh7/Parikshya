import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BookOpen, CheckCircle, Clock, Eye, FileText, Play, Target, XCircle, Brain, TrendingUp, Award, ArrowLeft, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const MockTestTakingPage: React.FC = () => {
	const { testId } = useParams<{ testId: string }>();
	const navigate = useNavigate();
	
	const [mockTest, setMockTest] = useState<any>(null);
	const [questions, setQuestions] = useState<any[]>([]);
	const [current, setCurrent] = useState(0);
	const [answers, setAnswers] = useState<{ [id: string]: number }>({});
	const [markedForReview, setMarkedForReview] = useState<{ [id: string]: boolean }>({});
	const [savedQuestions, setSavedQuestions] = useState<{ [id: string]: boolean }>({});
	const [submitted, setSubmitted] = useState(false);
	const [loading, setLoading] = useState(false);
	const [testStarted, setTestStarted] = useState(false);
	const [timeLeft, setTimeLeft] = useState(0);
	const [score, setScore] = useState(0);
	const [showInstructions, setShowInstructions] = useState(true);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [sessionLoading, setSessionLoading] = useState(false);

	useEffect(() => {
		if (testId) {
			fetchMockTest();
		}
	}, [testId]);

	// Timer effect
	useEffect(() => {
		if (!testStarted || timeLeft <= 0) return;
		
		const timer = setInterval(() => {
			setTimeLeft(prev => {
				if (prev <= 1) {
					handleSubmit();
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [testStarted, timeLeft]);

	const fetchMockTest = async () => {
		try {
			setLoading(true);
			
			// Fetch mock test details
			const { data: testData, error: testError } = await supabase
				.from('mock_tests')
				.select(`
					*,
					subjects!inner(display_name, name)
				`)
				.eq('id', testId)
				.single();

			if (testError) {
				console.error('Error fetching mock test:', testError);
				return;
			}

			setMockTest(testData);

			// Fetch questions for this mock test
			const { data: questionsData, error: questionsError } = await supabase
				.from('mock_questions')
				.select(`
					*,
					questions!inner(
						id,
						question_text,
						options,
						correct_answer,
						explanation,
						topic,
						subtopic
					)
				`)
				.eq('mock_test_id', testId)
				.order('created_at', { ascending: true });

			if (questionsError) {
				console.error('Error fetching questions:', questionsError);
				return;
			}

			// Transform the data to match the expected format
			const transformedQuestions = questionsData.map(q => ({
				id: q.questions.id,
				question_text: q.questions.question_text,
				options: q.questions.options,
				correct_answer: q.questions.correct_answer,
				explanation: q.questions.explanation,
				topic: q.questions.topic,
				subtopic: q.questions.subtopic,
				difficulty_level: q.difficulty_level
			}));

			setQuestions(transformedQuestions);
			setTimeLeft(testData.duration_minutes * 60);
		} catch (error) {
			console.error('Error in fetchMockTest:', error);
		} finally {
			setLoading(false);
		}
	};

	// Create mock test session when test starts
	const startTest = async () => {
		try {
			setSessionLoading(true);
			
			// Get current user
			const { data: { user }, error: userError } = await supabase.auth.getUser();
			if (userError || !user) {
				console.error('Error getting user:', userError);
				return;
			}

			// Create mock test session
			const { data: sessionData, error: sessionError } = await supabase
				.from('mock_test_sessions')
				.insert({
					user_id: user.id,
					mock_test_id: testId,
					total_questions: questions.length,
					status: 'in_progress',
					started_at: new Date().toISOString()
				})
				.select()
				.single();

			if (sessionError) {
				console.error('Error creating session:', sessionError);
				return;
			}

			setSessionId(sessionData.id);
			setTestStarted(true);
			setShowInstructions(false);
			
			// This will trigger the trigger_update_profile_on_test_start function
			// which updates total_questions_answered in the profile
			
		} catch (error) {
			console.error('Error starting test:', error);
		} finally {
			setSessionLoading(false);
		}
	};

	const handleSelect = (qid: string, idx: number) => {
		console.log('Selecting answer:', { qid, idx });
		const newAnswers = { ...answers, [qid]: idx };
		console.log('New answers state:', newAnswers);
		setAnswers(newAnswers);
	};

	const handleSaveAndContinue = () => {
		if (answers[q.id]) {
			setSavedQuestions(prev => ({ ...prev, [q.id]: true }));
			// Auto-advance to next question if not the last one
			if (current < questions.length - 1) {
				setCurrent(current + 1);
			}
		}
	};

	const handleMarkForReview = () => {
		setMarkedForReview(prev => ({ ...prev, [q.id]: !prev[q.id] }));
		// Auto-advance to next question if not the last one
		if (current < questions.length - 1) {
			setCurrent(current + 1);
		}
	};

	const handleSubmit = async () => {
		try {
			setSessionLoading(true);
			
		const correctAnswers = questions.filter(q => answers[q.id] === q.correct_answer).length;
			const finalScore = correctAnswers;
			const timeTaken = Math.ceil((mockTest.duration_minutes * 60 - timeLeft) / 60);
			
			setScore(finalScore);
		setSubmitted(true);
		setTestStarted(false);

			// Update the session to completed status
			if (sessionId) {
				const { error: updateError } = await supabase
					.from('mock_test_sessions')
					.update({
						status: 'completed',
						completed_at: new Date().toISOString(),
						questions_attempted: Object.keys(answers).length,
						correct_answers: finalScore,
						score: finalScore,
						time_taken_minutes: timeTaken
					})
					.eq('id', sessionId);

				if (updateError) {
					console.error('Error updating session:', updateError);
				} else {
					// This will trigger the trigger_update_profile_on_test_complete function
					// which updates correct_answers, ai_ability_estimate, and weak/strong topics
					console.log('Session completed successfully');
				}
			}

			// Also save to mock_test_results for historical tracking
			if (sessionId) {
				const { error: resultError } = await supabase
					.from('mock_test_results')
					.insert({
						session_id: sessionId,
						user_id: (await supabase.auth.getUser()).data.user?.id,
						mock_test_id: testId,
						score: finalScore,
						total_questions: questions.length,
						correct_answers: finalScore,
						time_taken_minutes: timeTaken,
						completed_at: new Date().toISOString()
					});

				if (resultError) {
					console.error('Error saving result:', resultError);
				}
			}

		} catch (error) {
			console.error('Error submitting test:', error);
		} finally {
			setSessionLoading(false);
		}
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	const getProgressPercentage = () => {
		return (Object.keys(answers).length / questions.length) * 100;
	};

	const q = questions[current];

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-4">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-400 text-lg">Loading mock test...</p>
				</div>
			</div>
		);
	}

	if (!mockTest || !questions.length) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-4">
				<div className="text-center">
					<AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
					<h3 className="text-2xl font-semibold text-white mb-3">Test Not Found</h3>
					<p className="text-gray-400 text-lg mb-6">The requested mock test could not be found or has no questions.</p>
					<button
						onClick={() => navigate('/mock-tests')}
						className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all duration-200"
					>
						Back to Mock Tests
					</button>
				</div>
			</div>
		);
	}

	// Instructions screen
	if (showInstructions) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-4">
				<div className="w-full max-w-4xl mx-auto">
					{/* Header */}
					<div className="text-center mb-6 sm:mb-8">
						<div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-3xl mb-4 sm:mb-6 shadow-2xl animate-pulse-glow">
							<Target className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
								</div>
						<h1 className="text-2xl sm:text-4xl font-bold text-white mb-3">{mockTest.name}</h1>
						<p className="text-gray-300 text-base sm:text-xl">{mockTest.description}</p>
								<div className="mt-4">
							<span className="text-primary-400 text-base sm:text-lg font-medium">Powered by Parikshya</span>
								</div>
							</div>

					{/* Test Info */}
					<div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-8 border border-dark-700/50 mb-6 sm:mb-8">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
							<div className="space-y-3 sm:space-y-4">
								<div className="flex items-center space-x-3">
									<BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400 flex-shrink-0" />
									<span className="text-white text-sm sm:text-base">Subject: {mockTest.subjects?.display_name}</span>
								</div>
								<div className="flex items-center space-x-3">
									<Clock className="w-4 h-4 sm:w-5 sm:h-5 text-accent-orange-400 flex-shrink-0" />
									<span className="text-white text-sm sm:text-base">Duration: {mockTest.duration_minutes} minutes</span>
								</div>
								<div className="flex items-center space-x-3">
									<FileText className="w-4 h-4 sm:w-5 sm:h-5 text-accent-green-400 flex-shrink-0" />
									<span className="text-white text-sm sm:text-base">Questions: {questions.length}</span>
								</div>
								<div className="flex items-center space-x-3">
									<Target className="w-4 h-4 sm:w-5 sm:h-5 text-accent-blue-400 flex-shrink-0" />
									<span className="text-white text-sm sm:text-base">Passing Score: {mockTest.passing_score}%</span>
								</div>
							</div>
							<div className="space-y-3 sm:space-y-4">
								<div className="flex items-center space-x-3">
									<Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
									<span className="text-white text-sm sm:text-base">Exam Type: {mockTest.exam_type}</span>
								</div>
								<div className="flex items-center space-x-3">
									<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
									<span className="text-white text-sm sm:text-base">Difficulty: {mockTest.difficulty_level}</span>
								</div>
							</div>
						</div>
					</div>

					{/* Start Button */}
					<div className="text-center">
						<button
							onClick={startTest}
							disabled={sessionLoading}
							className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl text-base sm:text-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{sessionLoading ? (
								<div className="flex items-center justify-center space-x-2">
									<div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									<span>Starting Test...</span>
								</div>
							) : (
								<div className="flex items-center justify-center space-x-2">
									<Play className="w-5 h-5 sm:w-6 sm:h-6" />
									<span>Start Mock Test</span>
								</div>
							)}
						</button>
						<p className="text-gray-400 mt-4 text-xs sm:text-sm">
							⚠️ Once you start, the timer will begin and cannot be paused
						</p>
					</div>
							</div>
						</div>
		);
	}

	// Results screen
	if (submitted) {
		const accuracy = (score / questions.length) * 100;
		const isPassed = accuracy >= mockTest.passing_score;
		
		return (
			<div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-4">
				<div className="w-full max-w-2xl mx-auto">
					<div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-dark-700/50 text-center">
						{/* Result Icon */}
						<div className={`inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-6 ${
							isPassed 
								? 'bg-gradient-to-br from-green-500 to-green-600' 
								: 'bg-gradient-to-br from-red-500 to-red-600'
						}`}>
							{isPassed ? (
								<CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
							) : (
								<XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
							)}
						</div>

						{/* Result Text */}
						<h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
							{isPassed ? 'Test Passed!' : 'Test Completed'}
						</h2>
						<p className="text-gray-300 mb-6 text-sm sm:text-base">
							{isPassed ? 'Congratulations! You have successfully passed the mock test.' : 'You have completed the mock test.'}
						</p>

						{/* Score Display */}
						<div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
							<div className="bg-dark-700/50 rounded-xl p-3 sm:p-4">
								<p className="text-gray-400 text-xs sm:text-sm">Score</p>
								<p className="text-xl sm:text-2xl font-bold text-white">{score}/{questions.length}</p>
							</div>
							<div className="bg-dark-700/50 rounded-xl p-3 sm:p-4">
								<p className="text-gray-400 text-xs sm:text-sm">Accuracy</p>
								<p className="text-xl sm:text-2xl font-bold text-white">{accuracy.toFixed(1)}%</p>
							</div>
						</div>

						{/* Performance Bar */}
						<div className="mb-6">
							<div className="flex justify-between text-xs sm:text-sm text-gray-400 mb-2">
								<span>Performance</span>
								<span>{accuracy.toFixed(1)}%</span>
							</div>
							<div className="w-full bg-dark-700 rounded-full h-2 sm:h-3">
								<div 
									className={`h-2 sm:h-3 rounded-full transition-all duration-1000 ${
										accuracy >= 80 ? 'bg-green-500' : 
										accuracy >= 60 ? 'bg-yellow-500' : 'bg-red-500'
									}`}
									style={{ width: `${Math.min(accuracy, 100)}%` }}
								></div>
							</div>
						</div>

					{/* Action Buttons */}
						<div className="flex flex-col sm:flex-row gap-3 justify-center">
						<button
							onClick={() => navigate('/mock-tests')}
								className="px-4 sm:px-6 py-2 sm:py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-xl transition-all duration-200 text-sm"
						>
								Back to Mock Tests
						</button>
						<button
								onClick={() => navigate('/dashboard')}
								className="px-4 sm:px-6 py-2 sm:py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all duration-200 text-sm"
						>
								View Dashboard
						</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Main Test Interface
	return (
		<div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
			{/* Header */}
			<div className="bg-dark-800/50 backdrop-blur-sm border-b border-dark-700/50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 sm:h-16 space-y-3 sm:space-y-0">
						<div className="flex items-center space-x-3">
							<button
								onClick={() => navigate('/mock-tests')}
								className="p-2 text-gray-400 hover:text-white transition-colors"
							>
								<ArrowLeft className="w-5 h-5" />
							</button>
							<div>
								<h1 className="text-base sm:text-lg font-semibold text-white">{mockTest.name}</h1>
								<p className="text-xs sm:text-sm text-gray-400">{mockTest.subjects?.display_name}</p>
							</div>
						</div>

						{/* Timer and Progress - Mobile optimized */}
						<div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 w-full sm:w-auto">
							{/* Progress */}
							<div className="text-center">
								<p className="text-xs sm:text-sm text-gray-400">Progress</p>
								<p className="text-base sm:text-lg font-semibold text-white">
									{current + 1} / {questions.length}
								</p>
					</div>

							{/* Timer */}
							<div className="text-center">
								<p className="text-xs sm:text-sm text-gray-400">Time Left</p>
								<p className={`text-base sm:text-lg font-mono font-semibold ${
									timeLeft < 300 ? 'text-red-400' : 'text-white'
								}`}>
									{formatTime(timeLeft)}
								</p>
				</div>

							{/* Submit Button */}
											<button
								onClick={handleSubmit}
								disabled={submitted || !testStarted}
								className="px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 text-sm"
							>
								Submit Test
											</button>
						</div>
								</div>
							</div>
						</div>

			{/* Main Test Interface - Only show when not submitted */}
			{testStarted && !submitted && (
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
					{/* Question Card */}
					<motion.div
						key={current}
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.3 }}
						className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-8 border border-dark-700/50 mb-6 sm:mb-8"
					>
								{/* Question Header */}
						<div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
							<div className="flex flex-wrap items-center gap-2 sm:gap-3">
								<span className="px-2 sm:px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs font-medium">
									Question {current + 1}
								</span>
								{q.topic && (
									<span className="px-2 sm:px-3 py-1 bg-accent-blue-500/20 text-accent-blue-400 rounded-full text-xs">
										{q.topic}
										</span>
									)}
							</div>
							
							<div className="flex items-center space-x-2">
								<button
									onClick={() => setMarkedForReview(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
									className={`p-2 rounded-lg transition-all duration-200 ${
										markedForReview[q.id] 
											? 'bg-accent-orange-500/20 text-accent-orange-400' 
											: 'bg-dark-700/50 text-gray-400 hover:text-white'
									}`}
								>
									<Eye className="w-4 h-4" />
								</button>
								<button
									onClick={() => setSavedQuestions(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
									className={`p-2 rounded-lg transition-all duration-200 ${
										savedQuestions[q.id] 
											? 'bg-accent-green-500/20 text-accent-green-400' 
											: 'bg-dark-700/50 text-gray-400 hover:text-white'
									}`}
								>
									<FileText className="w-4 h-4" />
								</button>
							</div>
								</div>

								{/* Question Text */}
						<div className="mb-6 sm:mb-8">
							<p className="text-base sm:text-lg text-white leading-relaxed">{q.question_text}</p>
						</div>

						{/* Options */}
									<div className="space-y-3">
							{q.options.map((option: string, index: number) => (
											<button
									key={index}
									onClick={() => setAnswers(prev => ({ ...prev, [q.id]: index }))}
												disabled={!testStarted || submitted}
									className={`w-full p-3 sm:p-4 text-left rounded-xl border transition-all duration-200 ${
										answers[q.id] === index
											? 'border-primary-500 bg-primary-500/20 text-primary-100'
											: 'border-dark-600 bg-dark-700/50 text-white hover:border-dark-500 hover:bg-dark-600/50'
									} ${
										!testStarted || submitted ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
												}`}
											>
												<div className="flex items-center space-x-3">
										<div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
											answers[q.id] === index
															? 'border-primary-500 bg-primary-500'
												: 'border-gray-500'
													}`}>
											{answers[q.id] === index && (
												<div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full"></div>
														)}
													</div>
										<span className="font-medium text-sm sm:text-base">{option}</span>
												</div>
											</button>
										))}
									</div>
					</motion.div>

								{/* Navigation */}
					<div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
									<button
							onClick={() => setCurrent(prev => Math.max(0, prev - 1))}
							disabled={current === 0 || !testStarted || submitted}
							className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-dark-700 hover:bg-dark-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 text-sm"
						>
							Previous
									</button>

						<div className="flex items-center space-x-1 sm:space-x-2">
							{questions.map((_, index) => (
										<button
									key={index}
									onClick={() => setCurrent(index)}
									disabled={!testStarted || submitted}
									className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
										index === current
											? 'bg-primary-500'
											: answers[questions[index].id] !== undefined
												? 'bg-accent-green-500'
												: 'bg-dark-600'
									} ${
										!testStarted || submitted ? 'cursor-not-allowed' : 'cursor-pointer'
									}`}
								/>
							))}
						</div>

											<button
							onClick={() => setCurrent(prev => Math.min(questions.length - 1, prev + 1))}
							disabled={current === questions.length - 1 || !testStarted || submitted}
							className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-dark-700 hover:bg-dark-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 text-sm"
											>
							Next
											</button>
					</div>

					{/* Submit Button */}
					<div className="text-center mt-6 sm:mt-8">
											<button
												onClick={handleSubmit}
												disabled={submitted || !testStarted}
							className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-2xl text-base sm:text-lg font-semibold transition-all duration-200 transform hover:scale-105"
						>
							Submit Test
											</button>
						</div>
					</div>
				)}
		</div>
	);
};

export default MockTestTakingPage;
