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
				console.error('Error fetching questions:', testError);
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
		} catch (error) {
			console.error('Error:', error);
		} finally {
			setLoading(false);
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

	const handleStartTest = () => {
		setShowInstructions(false);
		setTestStarted(true);
		setTimeLeft(mockTest.duration_minutes * 60);
	};

	const handleSubmit = () => {
		const correctAnswers = questions.filter(q => answers[q.id] === q.correct_answer).length;
		setScore(correctAnswers);
		setSubmitted(true);
		setTestStarted(false);
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
			<div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-400 text-lg">Loading mock test...</p>
				</div>
			</div>
		);
	}

	if (!mockTest || !questions.length) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
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
			<div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
				<div className="w-full max-w-4xl mx-auto p-6">
					{/* Header */}
					<div className="text-center mb-8">
						<div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-3xl mb-6 shadow-2xl animate-pulse-glow">
							<Target className="w-10 h-10 text-white" />
						</div>
						<h1 className="text-4xl font-bold text-white mb-3">{mockTest.name}</h1>
						<p className="text-gray-300 text-xl">{mockTest.description}</p>
					</div>

					{/* Test Info */}
					<div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-dark-700/50 mb-8">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-4">
								<div className="flex items-center space-x-3">
									<BookOpen className="w-5 h-5 text-primary-400" />
									<span className="text-white">Subject: {mockTest.subjects?.display_name}</span>
								</div>
								<div className="flex items-center space-x-3">
									<Clock className="w-5 h-5 text-accent-orange-400" />
									<span className="text-white">Duration: {mockTest.duration_minutes} minutes</span>
								</div>
								<div className="flex items-center space-x-3">
									<FileText className="w-5 h-5 text-accent-green-400" />
									<span className="text-white">Questions: {questions.length}</span>
								</div>
								<div className="flex items-center space-x-3">
									<Target className="w-5 h-5 text-accent-blue-400" />
									<span className="text-white">Passing Score: {mockTest.passing_score}%</span>
								</div>
							</div>
							<div className="space-y-4">
								<div className="flex items-center space-x-3">
									<Award className="w-5 h-5 text-yellow-400" />
									<span className="text-white">Exam Type: {mockTest.exam_type}</span>
								</div>
								<div className="flex items-center space-x-3">
									<TrendingUp className="w-5 h-5 text-purple-400" />
									<span className="text-white">Difficulty: {mockTest.difficulty_level}</span>
								</div>
							</div>
						</div>
					</div>

					{/* Instructions */}
					{mockTest.instructions && (
						<div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-dark-700/50 mb-8">
							<h3 className="text-2xl font-bold text-white mb-4">Instructions</h3>
							<div className="prose prose-invert max-w-none">
								<p className="text-gray-300 text-lg leading-relaxed">{mockTest.instructions}</p>
							</div>
						</div>
					)}

					{/* Action Buttons */}
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<button
							onClick={() => navigate('/mock-tests')}
							className="px-8 py-4 bg-dark-700/50 hover:bg-dark-600/50 text-white rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
						>
							<ArrowLeft className="w-5 h-5" />
							<span>Back to Tests</span>
						</button>
						<button
							onClick={handleStartTest}
							className="px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-primary-500/25"
						>
							<Play className="w-5 h-5" />
							<span>Start Test</span>
						</button>
					</div>
				</div>
			</div>
		);
	}

	// Test interface
	return (
		<div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
			<div className="w-full max-w-6xl mx-auto p-6">
				{/* Header with Test Info */}
				<div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50 mb-6">
					<div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
						<div className="flex items-center space-x-4">
							<div className="w-12 h-12 bg-gradient-to-br from-accent-green-500 to-accent-green-600 rounded-xl flex items-center justify-center">
								<BookOpen className="w-6 h-6 text-white" />
							</div>
							<div>
								<h3 className="text-white font-semibold text-lg">{mockTest.name}</h3>
								<p className="text-gray-400">{questions.length} questions</p>
							</div>
						</div>

						<div className="flex items-center space-x-4">
							{testStarted && !submitted && (
								<div className="flex items-center space-x-2 bg-dark-700/50 px-4 py-2 rounded-xl border border-dark-600/50">
									<Clock className="w-5 h-5 text-accent-orange-400" />
									<span className="text-white font-mono text-lg">{formatTime(timeLeft)}</span>
								</div>
							)}

							{testStarted && !submitted && (
								<button
									className="px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg shadow-primary-500/25"
									onClick={handleSubmit}
								>
									<Target className="w-5 h-5" />
									<span>Submit Test</span>
								</button>
							)}
						</div>
					</div>

					{/* Progress Bar */}
					{testStarted && !submitted && (
						<div className="mt-6">
							<div className="flex justify-between text-sm text-gray-400 mb-2">
								<span>Progress</span>
								<span>{Math.round(getProgressPercentage())}%</span>
							</div>
							<div className="w-full bg-dark-700/50 rounded-full h-3">
								<div
									className="bg-gradient-to-r from-primary-500 to-accent-green-500 h-3 rounded-full transition-all duration-300 ease-out"
									style={{ width: `${getProgressPercentage()}%` }}
								></div>
							</div>
						</div>
					)}
				</div>

				{/* Main Test Interface */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Question Navigator */}
					<div className="lg:col-span-1">
						<div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50">
							<h3 className="text-white font-semibold text-lg mb-4 flex items-center space-x-2">
								<Eye className="w-5 h-5 text-primary-400" />
								<span>Question Navigator</span>
							</h3>
							{/* Debug Info */}
							<div className="mb-4 p-2 bg-dark-700/30 rounded text-xs text-gray-400">
								<div>Current Answers: {JSON.stringify(answers)}</div>
								<div>Marked for Review: {JSON.stringify(markedForReview)}</div>
								<div>Saved Questions: {JSON.stringify(savedQuestions)}</div>
								<div>Questions Count: {questions.length}</div>
							</div>
							<div className="grid grid-cols-5 gap-2">
								{questions.map((question, idx) => {
									const hasAnswer = answers[question.id] !== undefined;
									const isMarkedForReview = markedForReview[question.id];
									const isSaved = savedQuestions[question.id];
									
									// Determine button color based on status
									let buttonColor = 'bg-dark-700/50 text-gray-300 hover:bg-dark-600/50';
									
									if (current === idx) {
										buttonColor = 'bg-primary-600 text-white shadow-lg shadow-primary-600/25';
									} else if (hasAnswer && isSaved) {
										buttonColor = 'bg-accent-green-600 text-white'; // Green: Answered and saved
									} else if (hasAnswer && isMarkedForReview) {
										buttonColor = 'bg-yellow-600 text-white'; // Yellow: Answered and marked for review
									} else if (isMarkedForReview && !hasAnswer) {
										buttonColor = 'bg-red-600 text-white'; // Red: Marked for review without answer
									} else if (hasAnswer) {
										buttonColor = 'bg-blue-600 text-white'; // Blue: Answered but not saved
									}
									
									console.log(`Question ${idx + 1} (ID: ${question.id}): hasAnswer=${hasAnswer}, isMarked=${isMarkedForReview}, isSaved=${isSaved}`);
									
									return (
										<button
											key={idx}
											onClick={() => setCurrent(idx)}
											className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 ${buttonColor}`}
										>
											{idx + 1}
										</button>
									);
								})}
							</div>
						</div>
					</div>

					{/* Question Display */}
					<div className="lg:col-span-2">
						<div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-dark-700/50">
							{/* Question Header */}
							<div className="flex items-center justify-between mb-6">
								<span className="text-primary-400 font-medium">Question {current + 1} of {questions.length}</span>
								{testStarted && (
									<span className="text-accent-orange-400 font-medium">
										Time: {formatTime(timeLeft)}
									</span>
								)}
							</div>

							{/* Question Text */}
							<div className="mb-8">
								<h3 className="text-white text-xl font-medium leading-relaxed mb-6">
									{q?.question_text}
								</h3>

								{/* Answer Options */}
								<div className="space-y-3">
									{q?.options?.map((option: string, idx: number) => (
										<button
											key={idx}
											onClick={() => handleSelect(q.id, idx)}
											disabled={!testStarted || submitted}
											className={`w-full p-4 text-left rounded-xl border transition-all duration-200 ${
												!testStarted || submitted
													? 'bg-dark-700/30 border-dark-600/30 text-gray-500 cursor-not-allowed'
													: answers[q.id] === idx
													? 'bg-primary-600/20 border-primary-500/50 text-white'
													: 'bg-dark-700/30 border-dark-600/30 text-gray-300 hover:bg-dark-600/50 hover:border-primary-500/30'
											}`}
										>
											<div className="flex items-center space-x-3">
												<div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
													answers[q.id] === idx
														? 'border-primary-500 bg-primary-500'
														: 'border-dark-500'
												}`}>
													{answers[q.id] === idx && (
														<div className="w-2 h-2 bg-white rounded-full"></div>
													)}
												</div>
												<span className="font-medium">{option}</span>
											</div>
										</button>
									))}
								</div>
							</div>

							{/* Navigation */}
							<div className="flex items-center justify-between pt-6 border-t border-dark-700/50">
								<button
									onClick={() => setCurrent(Math.max(0, current - 1))}
									disabled={current === 0}
									className="px-6 py-3 bg-dark-700/50 hover:bg-dark-600/50 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 flex items-center space-x-2"
								>
									<span>← Previous</span>
								</button>

								<div className="flex items-center space-x-3">
									{/* Mark for Review Button - Always visible */}
									<button
										onClick={handleMarkForReview}
										className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 ${
											markedForReview[q.id]
												? 'bg-yellow-600 hover:bg-yellow-700 text-white'
												: 'bg-orange-600 hover:bg-orange-700 text-white'
										}`}
									>
										{markedForReview[q.id] ? (
											<>
												<CheckCircle className="w-4 h-4" />
												<span>Marked for Review</span>
											</>
										) : (
											<>
												<BookOpen className="w-4 h-4" />
												<span>Mark for Review</span>
											</>
										)}
									</button>

									{/* Save and Continue Button - Only visible when question is answered */}
									{answers[q.id] !== undefined && (
										<button
											onClick={handleSaveAndContinue}
											className="px-6 py-3 bg-accent-green-600 hover:bg-accent-green-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2"
										>
											<CheckCircle className="w-4 h-4" />
											<span>Save & Continue</span>
										</button>
									)}

									{/* Next Button - Only visible when question is not answered */}
									{answers[q.id] === undefined && current < questions.length - 1 && (
										<button
											onClick={() => setCurrent(current + 1)}
											className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all duration-200 flex items-center space-x-2"
										>
											<span>Next →</span>
										</button>
									)}

									{/* Submit Button - Only on last question */}
									{current === questions.length - 1 && (
										<button
											className="px-6 py-3 bg-accent-green-600 hover:bg-accent-green-700 text-white rounded-xl transition-all duration-200"
											onClick={handleSubmit}
											disabled={submitted || !testStarted}
										>
											Submit Test
										</button>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Results */}
				{submitted && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-dark-700/50 mt-6"
					>
						<div className="text-center mb-8">
							<div className="w-20 h-20 bg-gradient-to-br from-accent-green-500 to-accent-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse-glow">
								<Award className="w-10 h-10 text-white" />
							</div>
							<h3 className="text-3xl font-bold text-white mb-3">Test Results</h3>
							<div className="inline-flex items-center gap-3 bg-gradient-to-r from-accent-green-600 to-primary-600 text-white px-8 py-4 rounded-2xl shadow-lg">
								<Target className="w-6 h-6" />
								<span className="text-2xl font-bold">Score: {score} / {questions.length}</span>
							</div>
							<p className="text-gray-300 text-lg mt-3">
								Percentage: <span className="text-accent-green-400 font-semibold">{Math.round((score / questions.length) * 100)}%</span>
							</p>
							<p className="text-gray-400 text-sm mt-2">
								Passing Score: {mockTest.passing_score}%
								{Math.round((score / questions.length) * 100) >= mockTest.passing_score ? (
									<span className="text-accent-green-400 ml-2">✓ Passed!</span>
								) : (
									<span className="text-red-400 ml-2">✗ Failed</span>
								)}
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
							<div className="bg-accent-green-600/20 border border-accent-green-500/50 rounded-2xl p-6">
								<h4 className="font-semibold text-accent-green-300 mb-4 flex items-center gap-2 text-lg">
									<CheckCircle className="w-6 h-6" />
									Correct Answers
								</h4>
								<div className="space-y-2">
									{questions.map((ques, idx) => (
										answers[ques.id] === ques.correct_answer && (
											<div key={ques.id} className="flex items-center gap-2 text-accent-green-300">
												<CheckCircle className="w-4 h-4" />
												<span>Q{idx + 1}</span>
											</div>
										)
									))}
								</div>
							</div>

							<div className="bg-red-600/20 border border-red-500/50 rounded-2xl p-6">
								<h4 className="font-semibold text-red-300 mb-4 flex items-center gap-2 text-lg">
									<XCircle className="w-6 h-6" />
									Incorrect Answers
								</h4>
								<div className="space-y-2">
									{questions.map((ques, idx) => (
										answers[ques.id] !== ques.correct_answer && answers[ques.id] !== undefined && (
											<div key={ques.id} className="flex items-center gap-2 text-red-300">
												<XCircle className="w-4 h-4" />
												<span>Q{idx + 1}</span>
											</div>
										)
									))}
								</div>
							</div>
						</div>

						<div className="text-center space-y-4">
							<button
								className="px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl font-semibold transition-all duration-200 shadow-lg shadow-primary-500/25 hover:shadow-xl mr-4"
								onClick={() => {
									setCurrent(0);
									setAnswers({});
									setMarkedForReview({});
									setSavedQuestions({});
									setSubmitted(false);
									setTestStarted(false);
									setTimeLeft(0);
									setScore(0);
									setShowInstructions(true);
								}}
							>
								<Brain className="w-5 h-5 inline mr-2" />
								Retake Test
							</button>
							<button
								onClick={() => navigate('/mock-tests')}
								className="px-8 py-4 bg-dark-700/50 hover:bg-dark-600/50 text-white rounded-2xl font-semibold transition-all duration-200"
							>
								<ArrowLeft className="w-5 h-5 inline mr-2" />
								Back to Tests
							</button>
						</div>
					</motion.div>
				)}
			</div>
		</div>
	);
};

export default MockTestTakingPage;
