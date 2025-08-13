import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, CheckCircle, Clock, Eye, FileText, Play, Target, XCircle, Brain, TrendingUp, Award, Calendar, Users, BarChart3, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const MockTestPage: React.FC = () => {
	console.log('MockTestPage component rendered');
	
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

	const fetchSubjects = async () => {
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
	};

	const fetchMockTests = async () => {
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
	};

	const handleStartTest = (testId: string) => {
		navigate(`/mock-test/${testId}`);
	};

	const filteredTests = mockTests.filter(test => 
		test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		test.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		test.subjects?.display_name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case 'easy': return 'from-green-500 to-green-600';
			case 'moderate': return 'from-yellow-500 to-yellow-600';
			case 'difficult': return 'from-red-500 to-red-600';
			default: return 'from-gray-500 to-gray-600';
		}
	};

	const getDifficultyText = (difficulty: string) => {
		switch (difficulty) {
			case 'easy': return 'Easy';
			case 'moderate': return 'Moderate';
			case 'difficult': return 'Difficult';
			default: return 'Unknown';
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
			<div className="w-full max-w-7xl mx-auto p-6">
				{/* Header Section */}
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-3xl mb-6 shadow-2xl animate-pulse-glow">
						<Target className="w-10 h-10 text-white" />
					</div>
					<h1 className="text-5xl font-bold text-white mb-3">Mock Tests</h1>
					<p className="text-gray-300 text-xl">Practice with comprehensive mock tests designed for your exam preparation</p>
				</div>

				{/* Filters and Search */}
				<div className="mb-8 space-y-4">
					<div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
						{/* Subject Filter */}
						<div className="flex-1 max-w-md">
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
						<div className="flex-1 max-w-md">
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
					<div className="text-center py-12">
						<div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
						<p className="text-gray-400 text-lg">Loading mock tests...</p>
					</div>
				)}

				{/* Mock Tests Grid */}
				{!loading && (
					<div className="space-y-6">
						{/* Results Count */}
						<div className="text-center">
							<p className="text-gray-300 text-lg">
								Found <span className="text-primary-400 font-semibold">{filteredTests.length}</span> mock test{filteredTests.length !== 1 ? 's' : ''}
								{selectedSubject && ` for ${subjects.find(s => s.id === selectedSubject)?.display_name}`}
							</p>
						</div>

						{/* Tests Grid */}
						{filteredTests.length > 0 ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{filteredTests.map((test) => (
									<motion.div
										key={test.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.3 }}
										className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dark-700/50 hover:border-primary-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/10"
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
											<h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{test.name}</h3>
											<p className="text-gray-400 text-sm line-clamp-2">{test.description}</p>
										</div>

										{/* Test Details */}
										<div className="space-y-3 mb-6">
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
											<div className="mb-6 p-3 bg-dark-700/30 rounded-lg border border-dark-600/30">
												<p className="text-gray-300 text-sm line-clamp-2">
													<strong>Instructions:</strong> {test.instructions}
												</p>
											</div>
										)}

										{/* Action Button */}
										<button
											onClick={() => handleStartTest(test.id)}
											className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-primary-500/25 hover:shadow-xl"
										>
											<Play className="w-5 h-5" />
											<span>Start Test</span>
										</button>
									</motion.div>
								))}
							</div>
						) : (
							/* No Tests Available */
							<div className="text-center py-16">
								<div className="w-24 h-24 bg-dark-700/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
									<FileText className="w-12 h-12 text-gray-500" />
								</div>
								<h3 className="text-2xl font-semibold text-white mb-3">No Mock Tests Available</h3>
								<p className="text-gray-400 text-lg">
									{selectedSubject 
										? `There are no mock tests available for ${subjects.find(s => s.id === selectedSubject)?.display_name} yet.`
										: 'There are no mock tests available yet.'
									}
								</p>
								<p className="text-gray-500 text-sm mt-2">
									Contact an administrator to create mock tests for your subjects.
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default MockTestPage;
