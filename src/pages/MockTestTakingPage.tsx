import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BookOpen, CheckCircle, Clock, Eye, FileText, Play, Target, XCircle, Brain, TrendingUp, Award, ArrowLeft, AlertTriangle, ChevronRight } from 'lucide-react';
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
	const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

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
					subjects(display_name, name)
				`)
				.eq('id', testId)
				.single();

			if (testError) {
				console.error('Error fetching mock test:', testError);
				return;
			}

			console.log('Mock test data:', testData); // Debug log
			setMockTest(testData);

			// Fetch questions for this mock test
			const { data: questionsData, error: questionsError } = await supabase
				.from('mock_questions')
				.select(`
					*,
					questions(
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

			console.log('Questions data:', questionsData); // Debug log

			// Filter out questions that don't have the questions relationship
			const validQuestions = questionsData?.filter(q => q.questions) || [];
			
			if (validQuestions.length === 0) {
				console.error('No valid questions found for mock test');
				return;
			}

			// Transform the data to match the expected format
			const transformedQuestions = validQuestions.map(q => ({
				id: q.questions.id,
				question_text: q.questions.question_text,
				options: q.questions.options,
				correct_answer: q.questions.correct_answer,
				explanation: q.questions.explanation,
				topic: q.questions.topic,
				subtopic: q.questions.subtopic,
				difficulty_level: q.difficulty_level
			}));

			console.log('Transformed questions:', transformedQuestions); // Debug log
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

	const handleAnswerSelect = (qid: string, idx: number) => {
		console.log('Selecting answer:', { qid, idx });
		const newAnswers = { ...answers, [qid]: idx };
		console.log('New answers state:', newAnswers);
		setAnswers(newAnswers);
	};

	const handleSaveAndContinue = () => {
		const currentQuestion = questions[current];
		if (currentQuestion && answers[currentQuestion.id] !== undefined) {
			setSavedQuestions(prev => ({ ...prev, [currentQuestion.id]: true }));
			setNotification({ message: 'Answer saved successfully!', type: 'success' });
			
			// Auto-advance to next question if not the last one
			if (current < questions.length - 1) {
				setCurrent(current + 1);
			}
		} else {
			// If no answer is selected, show a warning but still advance
			setNotification({ message: 'No answer selected, but continuing to next question', type: 'warning' });
			if (current < questions.length - 1) {
				setCurrent(current + 1);
			}
		}
		
		// Clear notification after 3 seconds
		setTimeout(() => setNotification(null), 3000);
	};

	const handleMarkForReview = (questionId: string) => {
		setMarkedForReview(prev => ({ ...prev, [questionId]: !prev[questionId] }));
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
			<div className="min-h-screen bg-black flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-white text-lg">Loading your test...</p>
				</div>
			</div>
		);
	}

	if (!mockTest || !questions.length) {
		return (
			<div className="min-h-screen bg-black flex items-center justify-center">
				<div className="text-center">
					<XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
					<h2 className="text-2xl font-bold text-white mb-4">Test Not Found</h2>
					<p className="text-gray-300 mb-6">
						{!mockTest 
							? "The mock test you're looking for doesn't exist." 
							: "This mock test has no questions available."
						}
					</p>
					<div className="space-y-3 mb-6">
						{!mockTest && (
							<p className="text-sm text-gray-400">Test ID: {testId}</p>
						)}
						{mockTest && (
							<div className="text-sm text-gray-400">
								<p>Test Name: {mockTest.name}</p>
								<p>Status: {mockTest.status}</p>
								<p>Total Questions: {mockTest.total_questions}</p>
							</div>
						)}
					</div>
					<button
						onClick={() => navigate('/mock-tests')}
						className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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
			<div className="min-h-screen bg-black py-8 px-4">
				<div className="max-w-4xl mx-auto">
					{/* Header */}
					<div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 mb-8 shadow-xl">
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center space-x-4">
								<div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
									<BookOpen className="w-6 h-6 text-white" />
								</div>
								<div>
									<h1 className="text-2xl font-bold text-white">{mockTest.name}</h1>
									<p className="text-gray-300">{mockTest.subjects?.display_name}</p>
								</div>
							</div>
							<button
								onClick={() => navigate('/mock-tests')}
								className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center space-x-2"
							>
								<ArrowLeft className="w-4 h-4" />
								<span>Back</span>
							</button>
						</div>
						
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50">
								<div className="flex items-center space-x-3 mb-2">
									<Clock className="w-5 h-5 text-blue-400" />
									<span className="text-white font-semibold">Duration</span>
								</div>
								<span className="text-gray-300">{mockTest.duration_minutes} minutes</span>
							</div>
							<div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50">
								<div className="flex items-center space-x-3 mb-2">
									<FileText className="w-5 h-5 text-blue-400" />
									<span className="text-white font-semibold">Questions</span>
								</div>
								<span className="text-gray-300">{questions.length}</span>
							</div>
							<div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50">
								<div className="flex items-center space-x-3 mb-2">
									<Target className="w-5 h-5 text-blue-400" />
									<span className="text-white font-semibold">Passing Score</span>
								</div>
								<span className="text-gray-300">{mockTest.passing_score || 60}%</span>
							</div>
						</div>
					</div>

					{/* Instructions */}
					<div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 mb-8 shadow-xl">
						<h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
							<AlertTriangle className="w-5 h-5 text-blue-400" />
							<span>Instructions</span>
						</h2>
						<div className="space-y-3 text-gray-300">
							<p>• This test contains {questions.length} questions</p>
							<p>• You have {mockTest.duration_minutes} minutes to complete the test</p>
							<p>• Each question has only one correct answer</p>
							<p>• You can mark questions for review and come back to them later</p>
							<p>• The test will automatically submit when time runs out</p>
							<p>• You can navigate between questions using the question navigator</p>
						</div>
					</div>

					{/* Start Button */}
					<div className="text-center">
						<button
							onClick={startTest}
							className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl"
						>
							Start Mock Test
						</button>
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
			<div className="min-h-screen bg-black py-8 px-4">
				<div className="max-w-4xl mx-auto">
					{/* Results Header */}
					<div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 mb-8 shadow-xl text-center">
						<div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-6">
							<Award className="w-12 h-12 text-white" />
						</div>
						<h1 className="text-3xl font-bold text-white mb-4">Test Completed!</h1>
						<p className="text-gray-300 mb-6">Here's how you performed</p>
						
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
							<div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50">
								<div className="text-3xl font-bold text-white mb-2">{Math.round(score)}%</div>
								<div className="text-gray-300">Score</div>
							</div>
							<div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50">
								<div className="text-3xl font-bold text-white mb-2">
									{questions.filter(q => answers[q.id] === q.correct_answer).length}
								</div>
								<div className="text-gray-300">Correct Answers</div>
							</div>
							<div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50">
								<div className="text-3xl font-bold text-white mb-2">
									{questions.length - questions.filter(q => answers[q.id] === q.correct_answer).length}
								</div>
								<div className="text-gray-300">Incorrect Answers</div>
							</div>
						</div>

						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<button
								onClick={() => window.location.reload()}
								className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
							>
								Retake Test
							</button>
							<button
								onClick={() => navigate('/mock-tests')}
								className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
							>
								Back to Mock Tests
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Main Test Interface
	return (
		<div className="min-h-screen bg-black py-8 px-4">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 mb-6 shadow-xl">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center space-x-4">
							<div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
								<BookOpen className="w-5 h-5 text-white" />
							</div>
							<div>
								<h1 className="text-xl font-bold text-white">{mockTest.name}</h1>
								<p className="text-gray-300 text-sm">{mockTest.subjects?.display_name}</p>
							</div>
						</div>
						<div className="flex items-center space-x-4">
							<div className="bg-gray-700/50 rounded-lg px-4 py-2 border border-gray-600/50">
								<div className="flex items-center space-x-2">
									<Clock className="w-4 h-4 text-blue-400" />
									<span className="text-white font-mono">{formatTime(timeLeft)}</span>
								</div>
							</div>
							<button
								onClick={() => navigate('/mock-tests')}
								className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
							>
								Exit Test
							</button>
						</div>
					</div>
				</div>

				{/* Main Content - Side by Side Layout */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Question Section - Takes 2/3 of the space */}
					<div className="lg:col-span-2">
						{/* Notification */}
						{notification && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								className={`mb-4 p-4 rounded-lg border ${
									notification.type === 'success' 
										? 'bg-green-500/20 border-green-500/30 text-green-400'
										: notification.type === 'warning'
										? 'bg-orange-500/20 border-orange-500/30 text-orange-400'
										: 'bg-blue-500/20 border-blue-500/30 text-blue-400'
								}`}
							>
								<div className="flex items-center space-x-2">
									{notification.type === 'success' ? (
										<CheckCircle className="w-4 h-4" />
									) : notification.type === 'warning' ? (
										<AlertTriangle className="w-4 h-4" />
									) : (
										<FileText className="w-4 h-4" />
									)}
									<span className="text-sm font-medium">{notification.message}</span>
								</div>
							</motion.div>
						)}

						{/* Question Card */}
						<div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl">
							{/* Question Header */}
							<div className="flex items-center justify-between mb-6">
								<div className="flex items-center space-x-4">
									<span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
										Question {current + 1} of {questions.length}
									</span>
									<span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
										{q.topic}
									</span>
								</div>
								<div className="flex items-center space-x-2">
									<button
										onClick={() => handleMarkForReview(q.id)}
										className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
											markedForReview[q.id]
												? 'bg-orange-500 text-white'
												: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
										}`}
									>
										{markedForReview[q.id] ? 'Marked' : 'Mark for Review'}
									</button>
								</div>
							</div>

							{/* Question Text */}
							<div className="mb-8">
								<p className="text-white text-lg leading-relaxed">{q.question_text}</p>
							</div>

							{/* Options */}
							<div className="space-y-3 mb-8">
								{q.options.map((option: string, index: number) => (
									<button
										key={index}
										onClick={() => handleAnswerSelect(q.id, index)}
										disabled={submitted}
										className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
											answers[q.id] === index
												? 'border-blue-500 bg-blue-500/20 text-white'
												: 'border-gray-600 hover:border-gray-500 bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
										} ${
											submitted ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'
										}`}
									>
										<span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
									</button>
								))}
							</div>

							{/* Answer Status Indicator */}
							{answers[q.id] !== undefined && (
								<div className="mb-6 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
									<div className="flex items-center space-x-2 text-green-400">
										<CheckCircle className="w-4 h-4" />
										<span className="text-sm font-medium">
											Answer selected: Option {String.fromCharCode(65 + answers[q.id])}
										</span>
									</div>
								</div>
							)}

							{/* Navigation */}
							<div className="flex items-center justify-between">
								<button
									onClick={() => setCurrent(Math.max(0, current - 1))}
									disabled={current === 0}
									className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center space-x-2"
								>
									<ArrowLeft className="w-4 h-4" />
									<span>Previous</span>
								</button>
								
								<div className="flex items-center space-x-3">
									<button
										onClick={handleSaveAndContinue}
										className={`px-6 py-3 transition-colors flex items-center space-x-2 rounded-lg ${
											current === questions.length - 1
												? 'bg-green-600 hover:bg-green-700 text-white'
												: 'bg-blue-600 hover:bg-blue-700 text-white'
										}`}
									>
										<span>
											{current === questions.length - 1 
												? 'Save & Review' 
												: answers[questions[current]?.id] !== undefined 
													? 'Save & Continue' 
													: 'Continue'
											}
										</span>
										{current < questions.length - 1 && <ChevronRight className="w-4 h-4" />}
									</button>
								</div>
							</div>
						</div>

						{/* Submit Button */}
						{current === questions.length - 1 && (
							<div className="text-center mt-6">
								<button
									onClick={handleSubmit}
									className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl"
								>
									Submit Test
								</button>
							</div>
						)}
					</div>

					{/* Question Navigator - Takes 1/3 of the space */}
					<div className="lg:col-span-1">
						<div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl sticky top-8">
							<h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
								<Target className="w-5 h-5 text-blue-400" />
								<span>Question Navigator</span>
							</h3>
							
							{/* Progress Bar */}
							<div className="mb-4">
								<div className="flex justify-between text-sm text-gray-400 mb-2">
									<span>Progress</span>
									<span>{Math.round((Object.keys(answers).length / questions.length) * 100)}%</span>
								</div>
								<div className="w-full bg-gray-700 rounded-full h-2">
									<div 
										className="bg-blue-600 h-2 rounded-full transition-all duration-300"
										style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
									></div>
								</div>
							</div>

							{/* Question Grid */}
							<div className="mb-4">
								<div className="max-h-64 overflow-y-auto custom-scrollbar">
									<div className="grid grid-cols-5 gap-2 p-1">
										{questions.map((_, index) => (
											<button
												key={index}
												onClick={() => setCurrent(index)}
												disabled={!testStarted || submitted}
												className={`w-full aspect-square rounded-lg transition-all duration-200 flex items-center justify-center text-xs font-medium ${
													index === current
														? 'bg-blue-600 text-white ring-2 ring-blue-400 scale-110'
														: answers[questions[index].id] !== undefined
															? 'bg-green-600 text-white'
															: markedForReview[questions[index].id]
																? 'bg-orange-500 text-white'
																: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
												} ${
													!testStarted || submitted ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'
												}`}
												title={`Question ${index + 1}${answers[questions[index].id] !== undefined ? ' - Answered' : ''}${markedForReview[questions[index].id] ? ' - Marked for Review' : ''}`}
											>
												{index + 1}
											</button>
										))}
									</div>
								</div>
								{/* Scroll indicator */}
								{questions.length > 25 && (
									<div className="text-center mt-2">
										<div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
											<div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse"></div>
											<div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
											<div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
										</div>
									</div>
								)}
							</div>

							{/* Legend */}
							<div className="space-y-2 text-xs text-gray-400">
								<div className="flex items-center space-x-2">
									<div className="w-3 h-3 bg-blue-600 rounded"></div>
									<span>Current</span>
								</div>
								<div className="flex items-center space-x-2">
									<div className="w-3 h-3 bg-green-600 rounded"></div>
									<span>Answered</span>
								</div>
								<div className="flex items-center space-x-2">
									<div className="w-3 h-3 bg-orange-500 rounded"></div>
									<span>Marked</span>
								</div>
								<div className="flex items-center space-x-2">
									<div className="w-3 h-3 bg-gray-700 rounded"></div>
									<span>Unanswered</span>
								</div>
							</div>

							{/* Quick Stats */}
							<div className="mt-4 pt-4 border-t border-gray-600/50">
								<div className="grid grid-cols-2 gap-3 text-sm">
									<div className="text-center">
										<div className="text-white font-semibold">{Object.keys(answers).length}</div>
										<div className="text-gray-400">Answered</div>
									</div>
									<div className="text-center">
										<div className="text-white font-semibold">{questions.length - Object.keys(answers).length}</div>
										<div className="text-gray-400">Remaining</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default MockTestTakingPage;
