import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, Clock, FileText, Play, Target, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const MockTestPage: React.FC = React.memo(() => {
	const navigate = useNavigate();
	const [mockTests, setMockTests] = useState<any[]>([]);
	const [subjects, setSubjects] = useState<any[]>([]);
	const [selectedSubject, setSelectedSubject] = useState<string>('');
	const [loading, setLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');

	useEffect(() => {
		fetchSubjects();
		fetchMockTests();
	}, []);

	useEffect(() => {
		fetchMockTests();
	}, [selectedSubject]);

	const fetchSubjects = useCallback(async () => {
		try {
			const { data, error } = await supabase.from('subjects').select('*');
			if (error) {
				console.error('Error fetching subjects:', error);
			} else {
				setSubjects(data || []);
			}
		} catch (error) {
			console.error('Error:', error);
		}
	}, []);

	const fetchMockTests = useCallback(async () => {
		try {
			setLoading(true);
			let query = supabase
				.from('mock_tests')
				.select(`
					*,
					subjects!inner(display_name, name),
					mock_questions(count)
				`)
				.eq('status', 'ready');

			if (selectedSubject) {
				query = query.eq('subject_id', selectedSubject);
			}

			const { data, error } = await query.order('created_at', { ascending: false });

			if (error) {
				console.error('Error fetching mock tests:', error);
				setMockTests([]);
			} else {
				setMockTests(data || []);
			}
		} catch (error) {
			console.error('Error:', error);
			setMockTests([]);
		} finally {
			setLoading(false);
		}
	}, [selectedSubject]);

	const handleStartTest = useCallback((testId: string) => {
		navigate(`/mock-test/${testId}`);
	}, [navigate]);

	const filteredTests = useMemo(() => mockTests.filter(test => 
		test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		test.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		test.subjects?.display_name.toLowerCase().includes(searchTerm.toLowerCase())
	), [mockTests, searchTerm]);

	const getDifficultyColor = useCallback((difficulty: string) => {
		switch (difficulty) {
			case 'easy': return 'from-green-500 to-green-600';
			case 'moderate': return 'from-yellow-500 to-yellow-600';
			case 'difficult': return 'from-red-500 to-red-600';
			default: return 'from-gray-500 to-gray-600';
		}
	}, []);

	const getDifficultyText = useCallback((difficulty: string) => {
		switch (difficulty) {
			case 'easy': return 'Easy';
			case 'moderate': return 'Moderate';
			case 'difficult': return 'Difficult';
			default: return 'Unknown';
		}
	}, []);

	return (
		<div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
			<div className="w-full max-w-7xl mx-auto p-4 sm:p-6">
				{/* Back Button */}
				<motion.div
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					className="mb-6"
				>
					<button
						onClick={() => navigate('/dashboard')}
						className="flex items-center space-x-2 px-4 py-2 bg-dark-700/50 hover:bg-dark-600/50 text-white rounded-xl transition-all duration-200 border border-dark-600/50"
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
						<span>Back to Dashboard</span>
					</button>
				</motion.div>

				{/* Header Section */}
				<div className="text-center mb-6 sm:mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-3xl mb-4 sm:mb-6 shadow-2xl animate-pulse-glow">
						<Target className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
					</div>
					<h1 className="text-3xl sm:text-5xl font-bold text-white mb-3">Mock Tests</h1>
					<p className="text-gray-300 text-base sm:text-xl px-4">Practice with comprehensive mock tests designed for your exam preparation</p>
					<div className="mt-4">
						<span className="text-primary-400 text-base sm:text-lg font-medium">Powered by Parikshya</span>
					</div>
				</div>

				{/* Filters and Search */}
				<div className="mb-6 sm:mb-8 space-y-4">
					<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
						{/* Subject Filter */}
						<div className="w-full sm:flex-1 sm:max-w-md">
							<label className="block text-white font-semibold text-sm mb-2">Filter by Subject</label>
							<select
								value={selectedSubject}
								onChange={(e) => setSelectedSubject(e.target.value)}
								className="w-full p-3 bg-dark-800/50 border border-dark-600/50 rounded-xl text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 backdrop-blur-sm"
							>
								<option value="">All Subjects</option>
								{subjects.map((subject) => (
									<option key={subject.id} value={subject.id}>
										{subject.display_name}
									</option>
								))}
							</select>
						</div>

						{/* Search */}
						<div className="w-full sm:flex-1 sm:max-w-md">
							<label className="block text-white font-semibold text-sm mb-2">Search Tests</label>
							<div className="relative">
								<input
									type="text"
									placeholder="Search by name, description, or subject..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="w-full p-3 pl-10 bg-dark-800/50 border border-dark-600/50 rounded-xl text-white placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 backdrop-blur-sm"
								/>
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
							</div>
						</div>
					</div>
				</div>

				{/* Loading State */}
				{loading && (
					<div className="text-center py-8 sm:py-12">
						<div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
						<p className="text-gray-400 text-base sm:text-lg">Loading mock tests...</p>
					</div>
				)}

				{/* Mock Tests Grid */}
				{!loading && (
					<div className="space-y-6">
						{/* Results Count */}
						<div className="text-center">
							<p className="text-gray-300 text-base sm:text-lg">
								Found <span className="text-primary-400 font-semibold">{filteredTests.length}</span> mock test{filteredTests.length !== 1 ? 's' : ''}
								{selectedSubject && ` for ${subjects.find(s => s.id === selectedSubject)?.display_name}`}
							</p>
						</div>

						{/* Tests Grid */}
						{filteredTests.length > 0 ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
								{filteredTests.map((test) => (
									<motion.div
										key={test.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.3 }}
										className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-dark-700/50 hover:border-primary-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/10"
									>
										{/* Test Header */}
										<div className="mb-4">
											<div className="flex items-center justify-between mb-3">
												<div className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getDifficultyColor(test.difficulty_level)} text-white`}>
													{getDifficultyText(test.difficulty_level)}
												</div>
												<div className="text-xs text-gray-400 bg-dark-700/50 px-2 py-1 rounded-full">
													{test.exam_type}
												</div>
											</div>
											<h3 className="text-lg sm:text-xl font-bold text-white mb-2 line-clamp-2">{test.name}</h3>
											<p className="text-gray-400 text-xs sm:text-sm line-clamp-2">{test.description}</p>
										</div>

										{/* Test Details */}
										<div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
											<div className="flex items-center space-x-3 text-sm">
												<BookOpen className="w-4 h-4 text-primary-400" />
												<span className="text-gray-300">
													{test.subjects?.display_name || 'Unknown Subject'}
												</span>
											</div>
											<div className="flex items-center space-x-3 text-sm">
												<Clock className="w-4 h-4 text-accent-orange-400" />
												<span className="text-gray-300">
													{test.duration_minutes} minutes
												</span>
											</div>
											<div className="flex items-center space-x-3 text-sm">
												<FileText className="w-4 h-4 text-accent-green-400" />
												<span className="text-gray-300">
													{test.total_questions} questions
												</span>
											</div>
											<div className="flex items-center space-x-3 text-sm">
												<Target className="w-4 h-4 text-accent-blue-400" />
												<span className="text-gray-300">
													Passing: {test.passing_score}%
												</span>
											</div>
										</div>

										{/* Instructions Preview */}
										{test.instructions && (
											<div className="mb-4 sm:mb-6 p-2 sm:p-3 bg-dark-700/30 rounded-lg border border-dark-600/30">
												<p className="text-gray-300 text-xs sm:text-sm line-clamp-2">
													<strong>Instructions:</strong> {test.instructions}
												</p>
											</div>
										)}

										{/* Action Button */}
										<button
											onClick={() => handleStartTest(test.id)}
											className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-primary-500/25 hover:shadow-xl text-sm sm:text-base"
										>
											<Play className="w-4 h-4 sm:w-5 sm:h-5" />
											<span>Start Test</span>
										</button>
									</motion.div>
								))}
							</div>
						) : (
							/* No Tests Available */
							<div className="text-center py-12 sm:py-16">
								<div className="w-16 h-16 sm:w-24 sm:h-24 bg-dark-700/50 rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
									<FileText className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500" />
								</div>
								<h3 className="text-xl sm:text-2xl font-semibold text-white mb-3">No Mock Tests Available</h3>
								<p className="text-gray-400 text-base sm:text-lg">
									{selectedSubject 
										? `There are no mock tests available for ${subjects.find(s => s.id === selectedSubject)?.display_name} yet.`
										: 'There are no mock tests available yet.'
									}
								</p>
								<p className="text-gray-500 text-xs sm:text-sm mt-2">
									Contact an administrator to create mock tests for your subjects.
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
});

MockTestPage.displayName = 'MockTestPage';

export default MockTestPage;
