import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  BookOpen, 
  Target, 
  Brain, 
  TrendingUp, 
  Users, 
  Play,
  Send,
  Bot,
  Sparkles,
  User,
  Star,
  Quote,
  CheckCircle,
  ArrowRight,
  Clock,
  BarChart3,
  X,
  Menu
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm your AI Academic Counselor on Parikshya. I'm here to help you with your exam preparation, study strategies, and academic guidance. I can help you with:\n\n• Mock test strategies and practice tips\n• Study planning and time management\n• Subject-specific learning approaches\n• Using Parikshya's features effectively\n• Performance tracking and goal setting\n\nHow can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSignUp = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputMessage);
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const generateAIResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('mock test') || lowerMessage.includes('practice')) {
      return "Mock tests are excellent for exam preparation! Parikshya offers comprehensive mock tests with:\n\n• Subject-specific practice tests\n• Full-length exam simulations\n• Performance analytics and insights\n• Adaptive difficulty based on your level\n• Detailed explanations for every question\n\nThis helps you understand exam patterns, manage time effectively, and identify weak areas. Start with Parikshya's subject-specific tests and gradually move to full-length mock exams!";
    } else if (lowerMessage.includes('study') || lowerMessage.includes('schedule')) {
      return "Creating an effective study schedule is crucial! Parikshya's AI-powered study planner can help you with:\n\n• Personalized study schedules based on your goals\n• Subject prioritization using performance data\n• Break time optimization\n• Progress tracking and reminders\n\nHere's a general strategy:\n1. Morning (2-3 hours): Focus on difficult subjects\n2. Afternoon (2 hours): Practice problems and mock tests\n3. Evening (1-2 hours): Review and revise\n4. Weekends: Full-length mock tests on Parikshya";
    } else if (lowerMessage.includes('weak') || lowerMessage.includes('difficult')) {
      return "Identifying weak areas is the first step to improvement! Parikshya's analytics system helps you:\n\n• Track performance across all subjects\n• Identify specific topics that need attention\n• Generate personalized practice questions\n• Monitor improvement over time\n\nMy strategy:\n1. Use Parikshya's mock test results to analyze weak areas\n2. Focus 70% of your time on weak areas\n3. Use Parikshya's spaced repetition system\n4. Practice with increasing difficulty levels\n5. Take follow-up tests to measure progress";
    } else if (lowerMessage.includes('parikshya') || lowerMessage.includes('platform') || lowerMessage.includes('features')) {
      return "Parikshya is your comprehensive AI-powered exam preparation platform! Here are our key features:\n\n🎯 **AI-Powered Learning**: Personalized study paths and adaptive question selection\n📚 **Mock Tests**: 5000+ questions across all subjects with realistic exam simulations\n📊 **Analytics**: Detailed performance insights and progress tracking\n📝 **Study Materials**: Rich notes, explanations, and topic-wise content\n⏰ **Study Planner**: AI-generated optimized study schedules\n🤖 **24/7 AI Support**: Your personal academic counselor (that's me!)\n👥 **Community**: Connect with fellow students and share strategies\n\nReady to start your journey with Parikshya?";
    } else {
      return "That's a great question! As your AI Academic Counselor on Parikshya, I'm here to help you with:\n\n• Study strategies and time management\n• Mock test guidance and practice tips\n• Subject-specific learning approaches\n• Progress tracking and goal setting\n• Using Parikshya's features effectively\n\nParikshya offers comprehensive tools including adaptive mock tests, performance analytics, study planners, and rich study materials. What specific area would you like to discuss?";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const testimonials = [
    {
      id: 1,
      text: "I was nervous about my IOE entrance exam, but practicing with Parikshya's realistic mock tests gave me confidence. The AI responses and explanations helped me understand concepts better.",
      name: "Anita Tamang",
      role: "IOE Pulchowk - Computer Engineering",
      avatar: "AT"
    },
    {
      id: 2,
      text: "Parikshya helped me practice with different difficulty levels for my engineering entrance. The personalized study plans based on my performance made all the difference. Got into IOE Thapathali!",
      name: "Priya Thapa",
      role: "IOE Thapathali - Civil Engineering",
      avatar: "PT"
    },
    {
      id: 3,
      text: "The instant feedback after each practice session was incredible. I could see exactly what I was doing wrong and how to improve. Much better than studying alone!",
      name: "Rajesh Gurung",
      role: "Tribhuvan University - BBA",
      avatar: "RG"
    },
    {
      id: 4,
      text: "Parikshya's realistic exam simulation prepared me for my CEE medical entrance test. The AI counselor helped me develop better study strategies and I aced the exam!",
      name: "Sita Sharma",
      role: "Medical College - MBBS (CEE Qualified)",
      avatar: "SS"
    },
    {
      id: 5,
      text: "Compared my answers with successful students and learned so much. The custom questions feature was amazing for targeted practice for my law entrance.",
      name: "Amit Patel",
      role: "Law School - LLB",
      avatar: "AP"
    },
    {
      id: 6,
      text: "The spaced repetition system and progress tracking helped me stay motivated. I could see my improvement over time clearly.",
      name: "Neha Singh",
      role: "Kathmandu University - Arts",
      avatar: "NS"
    }
  ];

  

  const universities = [
    { name: "IOE Pulchowk", logo: "🏛️" },
    { name: "Tribhuvan University", logo: "🎓" },
    { name: "Kathmandu University", logo: "🔵" },
    { name: "Purbanchal University", logo: "💜" },
    { name: "Pokhara University", logo: "🌲" },
    { name: "Lumbini University", logo: "🔴" },
    { name: "Far Western University", logo: "🐂" },
    { name: "BPKIHS", logo: "🏥" },
    { name: "Nepal Medical College", logo: "⚕️" },
    { name: "Manipal College", logo: "🩺" },
    { name: "KIST Medical College", logo: "🏨" },
    { name: "Nobel Medical College", logo: "💊" }
  ];



  return (
    <div className="min-h-screen bg-black">
      {/* Floating Header Navigation */}
        <header className="fixed top-2 left-2 right-2 z-40 sm:top-4 sm:left-4 sm:right-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-black/95 backdrop-blur-xl rounded-2xl border border-blue-500/50 shadow-xl shadow-blue-500/25">
              <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
                {/* Logo */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shadow-lg overflow-hidden">
                    <img src="/logo.png" alt="Parikshya Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg sm:text-2xl font-bold text-white">PARIKSHYA</span>
                    <span className="text-xs text-blue-400 font-medium hidden sm:block">SMARTER PREPARATION. BETTER RESULTS.</span>
                  </div>
                </div>

                {/* Navigation Links - Hidden on mobile, centered on desktop */}
                <nav className="hidden lg:flex items-center justify-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
                  <a href="#features" className="text-gray-300 hover:text-blue-400 transition-colors font-medium">Features</a>
                  <a href="#testimonials" className="text-gray-300 hover:text-blue-400 transition-colors font-medium">Testimonials</a>
                  <a href="#contact" className="text-gray-300 hover:text-blue-400 transition-colors font-medium">Contact</a>
                </nav>

                {/* Auth Buttons - Responsive sizing */}
                <div className="flex items-center space-x-2 sm:space-x-4">
                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="lg:hidden p-2 text-gray-300 hover:text-blue-400 transition-colors"
                  >
                    <Menu className="w-6 h-6" />
                  </button>
                  
                  {/* Desktop Auth Buttons - Hidden on mobile */}
                  <div className="hidden lg:flex items-center space-x-2 sm:space-x-4">
                    <button
                      onClick={handleLogin}
                      className="px-3 py-2 sm:px-4 sm:py-2 text-gray-300 hover:text-blue-400 transition-colors font-medium text-sm sm:text-base"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={handleSignUp}
                      className="px-4 py-2 sm:px-6 sm:py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                    >
                      <span className="hidden sm:inline">Try For Free Now</span>
                      <span className="sm:hidden">Free</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 sm:pt-24 md:pt-28 lg:pt-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          {/* Main Heading */}
          <div className="mb-8 sm:mb-10 md:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 sm:mb-8 md:mb-10 leading-tight">
              One <span className="text-red-500">wrong answer</span> can cost your
              <span className="block text-blue-400 mt-2 sm:mt-3">university dreams</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-6 sm:mb-8 md:mb-10 px-2 sm:px-4">
              Master your Nepali university entrance exams including IOE, CEE medical entrance, and more with AI-powered practice that adapts to your learning style. 
              Get real-time feedback and personalized study plans to ace your admissions to IOE, Tribhuvan University, and other top Nepali universities.
            </p>
            
            {/* Creative Stats Banner */}
            <div className="inline-flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-6 md:space-x-8 bg-gray-800/50 backdrop-blur-sm rounded-3xl px-6 sm:px-8 md:px-10 py-4 sm:py-5 border border-gray-700/50 mb-6 sm:mb-8 md:mb-10">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-semibold text-sm sm:text-base md:text-lg">95% Success Rate</span>
              </div>
              <div className="hidden sm:block w-px h-6 md:h-8 bg-gray-600"></div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-blue-400 font-semibold text-sm sm:text-base md:text-lg">5000+ Questions</span>
              </div>
              <div className="hidden sm:block w-px h-6 md:h-8 bg-gray-600"></div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-blue-400 font-semibold text-sm sm:text-base md:text-lg">AI-Powered</span>
              </div>
            </div>
          </div>

          {/* University Logos */}
          <div className="mb-10 sm:mb-12 md:mb-16">
            <p className="text-gray-400 text-base sm:text-lg md:text-xl mb-6 sm:mb-8 md:mb-10">Trusted by students from top universities</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
              {universities.map((uni, index) => (
                <motion.div 
                  key={index}
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    y: -5,
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  }}
                  className="flex items-center justify-center space-x-2 sm:space-x-3 text-gray-400 hover:text-blue-400 transition-colors group cursor-pointer p-3 rounded-xl hover:bg-gray-800/30"
                >
                  <motion.span 
                    className="text-lg sm:text-xl md:text-2xl group-hover:scale-110 transition-transform duration-300"
                    animate={{ 
                      y: [0, -3, 0],
                      rotate: [0, 2, -2, 0]
                    }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      delay: index * 0.5
                    }}
                  >
                    {uni.logo}
                  </motion.span>
                  <motion.span 
                    className="font-medium text-xs sm:text-sm group-hover:text-blue-300 transition-colors text-center"
                    whileHover={{ 
                      x: [0, 2, 0],
                      transition: { duration: 0.3 }
                    }}
                  >
                    {uni.name}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8 justify-center items-center mb-10 sm:mb-12 md:mb-16">
            <button className="w-full sm:w-auto px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 bg-gray-800 border-2 border-gray-700 hover:border-blue-500 text-white rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center space-x-3 sm:space-x-4 shadow-lg hover:shadow-blue-500/25 group">
              <Play className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 group-hover:scale-110 transition-transform" />
              <span className="text-base sm:text-lg">Watch demo video</span>
            </button>
            <button
              onClick={handleSignUp}
              className="w-full sm:w-auto px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-blue-500/25 flex items-center justify-center space-x-3 sm:space-x-4 group"
            >
              <span className="text-base sm:text-lg">Start Your Journey</span>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6 md:space-x-8">
            <div className="flex -space-x-2 sm:-space-x-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div 
                  key={i} 
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-3 border-gray-800 flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-lg"
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-400 fill-current" />
                ))}
              </div>
              <span className="text-white font-semibold text-sm sm:text-base md:text-lg">4.8</span>
            </div>
            <span className="text-gray-400 text-sm sm:text-base md:text-lg">Join 25k+ aspirants</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 md:py-24 px-3 sm:px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
            {/* Left Side - AI Interviewer */}
            <div>
              <div className="inline-block bg-blue-900 text-blue-300 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                🎯 Smart Learning Engine
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 sm:mb-8 leading-tight">
                Practice with Questions That Actually Matter
              </h2>
              <p className="text-base sm:text-lg text-gray-300 leading-relaxed mb-6 sm:mb-8">
                Our AI analyzes thousands of past Nepali entrance exams to give you the most relevant practice questions. 
                No more wasting time on outdated content - every question is designed to boost your admission chances to IOE, Tribhuvan University, and other top Nepali universities.
              </p>
              
              {/* Creative Feature List */}
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start space-x-3 sm:space-x-4 group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-base sm:text-lg mb-1 sm:mb-2">Exam Pattern Mastery</h3>
                    <p className="text-sm sm:text-base text-gray-300">Learn the exact format and difficulty level of your target Nepali university's entrance exam</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 sm:space-x-4 group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-base sm:text-lg mb-1 sm:mb-2">Adaptive Difficulty</h3>
                    <p className="text-sm sm:text-base text-gray-300">Questions automatically adjust to your skill level, ensuring optimal learning progression</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 sm:space-x-4 group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-base sm:text-lg mb-1 sm:mb-2">Performance Analytics</h3>
                    <p className="text-sm sm:text-base text-gray-300">Track your progress with detailed insights and identify areas that need improvement</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Parikshya Dashboard with Parallax */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
                <div className="bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-600/40">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Your Success Dashboard</h3>
                  <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6">Track your journey to university admission</p>
                  
                  {/* Dashboard Preview */}
                  <div className="bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    {/* Browser Header */}
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <span className="text-xs text-gray-400">parikshya.com/dashboard</span>
                    </div>
                    
                    {/* Dashboard Content */}
                    <div className="bg-gray-700 rounded-lg p-3 sm:p-4 mb-3">
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                            <img src="/logo.png" alt="Parikshya Logo" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
                          </div>
                          <div>
                            <h4 className="text-white text-xs sm:text-sm font-semibold">Welcome back, Tanishka!</h4>
                            <p className="text-gray-400 text-xs">Ready to ace your next test?</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-green-400 text-xs font-medium">Online</span>
                        </div>
                      </div>
                      
                      {/* Stats Row */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg p-2 sm:p-3 text-center border border-green-500/30">
                          <div className="text-green-400 text-xs sm:text-sm font-bold mb-1">87%</div>
                          <div className="text-gray-300 text-xs">Accuracy</div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg p-2 sm:p-3 text-center border border-blue-500/30">
                          <div className="text-blue-400 text-xs sm:text-sm font-bold mb-1">156</div>
                          <div className="text-gray-300 text-xs">Questions</div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg p-2 sm:p-3 text-center border border-blue-500/30">
                          <div className="text-blue-400 text-xs sm:text-sm font-bold mb-1">4.2</div>
                          <div className="text-gray-300 text-xs">Hours</div>
                        </div>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="space-y-2">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs text-white text-center font-medium shadow-lg hover:shadow-blue-500/25 transition-all duration-200 cursor-pointer">
                          🚀 Practice Test
                        </div>
                        <div className="bg-gray-600/50 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-xs text-gray-300 text-center font-medium border border-gray-500/30 hover:border-gray-400/50 transition-all duration-200 cursor-pointer">
                          📊 View Progress
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-6 h-6 sm:w-8 sm:h-8 bg-yellow-400 rounded-full flex items-center justify-center text-black font-bold text-xs sm:text-sm">
                ⭐
              </div>
              <div className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 w-5 h-5 sm:w-6 sm:h-6 bg-green-400 rounded-full flex items-center justify-center text-black font-bold text-xs">
                🎯
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mock Test Showcase Section */}
      <section className="py-16 md:py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full text-sm font-bold mb-6">
               🚀 Comprehensive Test Suite
             </div>
             <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
               Practice Tests for Every
             </h2>
             <h3 className="text-4xl md:text-5xl font-bold text-blue-400 mb-6">
               Nepali University Entrance Exam
             </h3>
             <p className="text-xl text-gray-300 max-w-3xl mx-auto">
               From IOE Pulchowk to Tribhuvan University, from CEE medical entrance to law - we've got you covered with 
               specialized mock tests designed by experts who know what Nepali universities actually ask.
             </p>
           </div>

           <div className="relative overflow-hidden">
             {/* Moving Background Elements */}
             <div className="absolute inset-0">
               <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500/10 rounded-full animate-pulse"></div>
               <div className="absolute top-20 right-20 w-16 h-16 bg-green-500/10 rounded-full animate-pulse delay-1000"></div>
               <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-purple-500/10 rounded-full animate-pulse delay-2000"></div>
               <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-yellow-500/10 rounded-full animate-pulse delay-1500"></div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
               {/* Mock Test Card 1 - IOE Engineering */}
               <motion.div 
                 initial={{ y: 50, opacity: 0 }}
                 whileInView={{ y: 0, opacity: 1 }}
                 transition={{ duration: 0.6, delay: 0.1 }}
                 className="group cursor-pointer h-full"
               >
                 <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-blue-500/50 relative overflow-hidden h-full flex flex-col group-hover:scale-105">
                   {/* Background Pattern */}
                   <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                   
                   <div className="relative z-10 flex flex-col h-full">
                     <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                       <Target className="w-10 h-10 text-white" />
                     </div>
                     <h3 className="text-2xl font-bold text-white mb-4 text-center">IOE Engineering</h3>
                     <p className="text-gray-300 text-center mb-6 leading-relaxed flex-grow">
                       Master IOE Pulchowk, Thapathali, and other engineering entrance exams with our comprehensive question bank
                     </p>
                     <div className="mt-auto">
                       <div className="flex justify-center mb-4">
                         <span className="inline-block bg-blue-900 text-blue-300 px-4 py-2 rounded-full text-sm font-medium">
                           2500+ Questions
                         </span>
                       </div>
                       <div className="text-center">
                         <span className="text-gray-400 text-sm">Physics • Chemistry • Mathematics</span>
                       </div>
                     </div>
                   </div>
                 </div>
               </motion.div>

               {/* Mock Test Card 2 - Medical CEE & Health Sciences */}
               <motion.div 
                 initial={{ y: 50, opacity: 0 }}
                 whileInView={{ y: 0, opacity: 1 }}
                 transition={{ duration: 0.6, delay: 0.3 }}
                 className="group cursor-pointer h-full"
               >
                 <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-blue-500/50 relative overflow-hidden h-full flex flex-col group-hover:scale-105">
                   {/* Background Pattern */}
                   <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                   
                   <div className="relative z-10 flex flex-col h-full">
                     <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                       <BookOpen className="w-10 h-10 text-white" />
                     </div>
                     <h3 className="text-2xl font-bold text-white mb-4 text-center">Medical CEE & Health Sciences</h3>
                     <p className="text-gray-300 text-center mb-6 leading-relaxed flex-grow">
                       Ace the Common Entrance Examination (CEE) for medical colleges, nursing, and health sciences with our specialized biology and chemistry modules
                     </p>
                     <div className="mt-auto">
                       <div className="flex justify-center mb-4">
                         <span className="inline-block bg-blue-900 text-blue-300 px-4 py-2 rounded-full text-sm font-medium">
                           2000+ Questions
                         </span>
                       </div>
                       <div className="text-center">
                         <span className="text-gray-400 text-sm">Biology • Chemistry • Physics • CEE Pattern</span>
                       </div>
                     </div>
                   </div>
                 </div>
               </motion.div>

               {/* Mock Test Card 3 - Law & Management */}
               <motion.div 
                 initial={{ y: 50, opacity: 0 }}
                 whileInView={{ y: 0, opacity: 1 }}
                 transition={{ duration: 0.6, delay: 0.5 }}
                 className="group cursor-pointer h-full"
               >
                 <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-blue-500/50 relative overflow-hidden h-full flex flex-col group-hover:scale-105">
                   {/* Background Pattern */}
                   <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                   
                   <div className="relative z-10 flex flex-col h-full">
                     <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                       <Brain className="w-10 h-10 text-white" />
                     </div>
                     <h3 className="text-2xl font-bold text-white mb-4 text-center">Law & Management</h3>
                     <p className="text-gray-300 text-center mb-6 leading-relaxed flex-grow">
                       Conquer law school entrance tests, BBA, and management exams with our logical reasoning and aptitude training
                     </p>
                     <div className="mt-auto">
                       <div className="flex justify-center mb-4">
                         <span className="inline-block bg-blue-900 text-blue-300 px-4 py-2 rounded-full text-sm font-medium">
                           1200+ Questions
                         </span>
                       </div>
                       <div className="text-center">
                         <span className="text-gray-400 text-sm">Aptitude • Reasoning • English</span>
                       </div>
                     </div>
                   </div>
                 </div>
               </motion.div>

               {/* Mock Test Card 4 - Medical Hospitals & Institutions */}
               <motion.div 
                 initial={{ y: 50, opacity: 0 }}
                 whileInView={{ y: 0, opacity: 1 }}
                 transition={{ duration: 0.6, delay: 0.7 }}
                 className="group cursor-pointer h-full"
               >
                 <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-blue-500/50 relative overflow-hidden h-full flex flex-col group-hover:scale-105">
                   {/* Background Pattern */}
                   <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                   
                   <div className="relative z-10 flex flex-col h-full">
                     <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                       <BookOpen className="w-10 h-10 text-white" />
                     </div>
                     <h3 className="text-2xl font-bold text-white mb-4 text-center">Medical Hospitals & Institutions</h3>
                     <p className="text-gray-300 text-center mb-6 leading-relaxed flex-grow">
                       Prepare for entrance exams at top medical hospitals, nursing colleges, and health institutions across Nepal
                     </p>
                     <div className="mt-auto">
                       <div className="flex justify-center mb-4">
                         <span className="inline-block bg-blue-900 text-blue-300 px-4 py-2 rounded-full text-sm font-medium">
                           1500+ Questions
                         </span>
                       </div>
                       <div className="text-center">
                         <span className="text-gray-400 text-sm">Hospital Entrance • Nursing • Health Sciences</span>
                       </div>
                     </div>
                   </div>
                 </div>
               </motion.div>
             </div>
           </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 md:py-20 px-6 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full text-sm font-bold mb-6">
               💬 Success Stories
             </div>
             <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
               Students Who Made It to
             </h2>
             <h3 className="text-4xl md:text-5xl font-bold text-blue-400 mb-6">
               Their Dream Universities
             </h3>
             <p className="text-xl text-gray-300 max-w-3xl mx-auto">
               Real stories from real students who transformed their exam preparation with Parikshya 
               and secured admissions to top universities across Nepal including IOE Pulchowk, Tribhuvan University, and more.
             </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {testimonials.map((testimonial) => (
               <div
                 key={testimonial.id}
                 className="bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-700/50 hover:border-blue-500/50 group relative overflow-hidden"
               >
                 {/* Background Pattern */}
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 
                 <div className="relative z-10">
                   <div className="mb-6">
                     <Quote className="w-10 h-10 text-blue-400 group-hover:text-blue-300 transition-colors" />
                   </div>
                   
                   <p className="text-gray-300 leading-relaxed mb-8 group-hover:text-gray-200 transition-colors text-lg">
                     {testimonial.text}
                   </p>
                   
                   <div className="flex items-center space-x-4">
                     <div 
                       className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                     >
                       {testimonial.avatar}
                     </div>
                     <div>
                       <h4 className="font-semibold text-white group-hover:text-blue-300 transition-colors text-lg">{testimonial.name}</h4>
                       <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">{testimonial.role}</p>
                       <div className="flex items-center space-x-1 mt-1">
                         {[1, 2, 3, 4, 5].map((star) => (
                           <Star key={star} className="w-3 h-3 text-yellow-400 fill-current" />
                         ))}
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             ))}
           </div>
           
           {/* Creative Stats */}
           <div className="mt-20 text-center">
             <div className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl">
               🎉 Join 25,000+ successful university aspirants today!
             </div>
           </div>
         </div>
       </section>

       {/* Stats Section */}
       <section className="py-16 md:py-20 px-6">
         <div className="max-w-6xl mx-auto">
           <div className="text-center mb-16">
             <div className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full text-sm font-bold mb-6">
               📊 By The Numbers
             </div>
             <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
               Trusted by Aspirants
            </h2>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our platform has helped thousands of students achieve their Nepali university dreams. 
              Here's what makes Parikshya the preferred choice for Nepali entrance exam preparation.
            </p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
             <div className="text-center group cursor-pointer">
               <div 
                 className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl"
               >
                 <BarChart3 className="w-10 h-10 text-white" />
               </div>
               <h3 className="text-3xl font-bold text-white mb-3 group-hover:text-green-300 transition-colors">95%</h3>
               <p className="text-gray-300 group-hover:text-gray-200 transition-colors text-lg mb-2">Success Rate</p>
               <p className="text-gray-400 text-sm">Students who use Parikshya regularly get into their target universities</p>
             </div>

             <div className="text-center group cursor-pointer">
               <div 
                 className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl"
               >
                 <Clock className="w-10 h-10 text-white" />
               </div>
               <h3 className="text-3xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">40%</h3>
               <p className="text-gray-300 group-hover:text-gray-200 transition-colors text-lg mb-2">Time Saved</p>
               <p className="text-gray-400 text-sm">Efficient study planning with AI reduces preparation time significantly</p>
             </div>

             <div className="text-center group cursor-pointer">
               <div 
                 className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl"
               >
                 <Users className="w-10 h-10 text-white" />
               </div>
               <h3 className="text-3xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">25k+</h3>
               <p className="text-gray-300 group-hover:text-gray-200 transition-colors text-lg mb-2">Active Aspirants</p>
               <p className="text-gray-400 text-sm">Students trust Parikshya for their university entrance exam preparation</p>
             </div>
           </div>
           
           {/* Creative Achievement Banner */}
           <div className="mt-20 text-center">
             <div className="bg-gradient-to-r from-blue-600/20 to-blue-700/20 backdrop-blur-sm rounded-3xl p-8 border border-blue-500/30">
               <div className="flex items-center justify-center space-x-4 mb-4">
                 <span className="text-4xl">🏆</span>
                 <h3 className="text-2xl font-bold text-white">Join the Success Story</h3>
                 <span className="text-4xl">🏆</span>
               </div>
               <p className="text-gray-300 text-lg mb-6">
                 Every year, thousands of students achieve their university dreams with Parikshya. 
                 Will you be next?
               </p>
               <button
                 onClick={handleSignUp}
                 className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl"
               >
                 Start Your Success Journey
               </button>
             </div>
           </div>
         </div>
       </section>

      {/* Funky Pricing Section */}
      <section id="pricing" className="py-16 md:py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-16">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full text-sm font-bold mb-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <span className="animate-pulse">🚀</span>
              <span>EARLY ACCESS</span>
              <span className="animate-pulse">🚀</span>
          </motion.div>

            <motion.h2 
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl md:text-6xl font-bold text-white mb-6"
            >
              Everything is
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 mt-2">
                FREE for now!
              </span>
            </motion.h2>
            
            <motion.p 
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed"
            >
              We're in early access mode, so grab all premium features while they're completely free!
            </motion.p>
          </div>

          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-blue-500/30 shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 transform hover:scale-[1.02]">
              {/* Blur Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-3xl backdrop-blur-sm"></div>
              
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <motion.div 
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <span className="text-4xl">🎯</span>
                  </motion.div>
                  <h3 className="text-3xl font-bold text-white mb-2">Parikshya Pro</h3>
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <span className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">NPR 0</span>
                    <span className="text-gray-400 text-xl">/month</span>
                  </div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    🎉 LIMITED TIME OFFER 🎉
                  </motion.div>
                </div>

                <div className="space-y-4 mb-8">
                  {[
                    "Unlimited Mock Tests",
                    "AI-Powered Study Planner", 
                    "Advanced Analytics",
                    "24/7 AI Counselor",
                    "Priority Support"
            ].map((feature, index) => (
              <motion.div
                key={index}
                      initial={{ x: -20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                      className="flex items-center space-x-3 text-left group hover:bg-blue-500/10 p-3 rounded-lg transition-all duration-300"
                    >
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <CheckCircle className="w-4 h-4 text-white" />
                </div>
                      <span className="text-gray-300 group-hover:text-white transition-colors duration-300">{feature}</span>
              </motion.div>
            ))}
          </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSignUp}
                  className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-blue-500/50"
                >
                  🚀 Get Early Access FREE! 🚀
                </motion.button>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                  className="text-gray-400 text-sm mt-4"
                >
                  ⚠️ This offer won't last forever! Join now before we launch paid plans.
                </motion.p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>





      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-80 bg-gradient-to-br from-gray-900 via-black to-gray-900 z-50 border border-blue-500/50 shadow-2xl shadow-blue-500/25 ring-2 ring-blue-500/30"
          >
            {/* Header with Logo */}
            <div className="flex justify-between items-center p-6 border-b border-blue-500/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <img src="/logo.png" alt="Parikshya" className="w-6 h-6 object-contain" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Parikshya</h2>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-400 hover:text-blue-400 transition-colors p-2 hover:bg-blue-500/10 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Navigation Links */}
            <nav className="flex flex-col h-full">
              <div className="flex-1 p-6 pb-2">
                <div className="space-y-1">
                  <a 
                    href="#features" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="flex items-center space-x-4 text-gray-300 hover:text-blue-400 py-2 px-5 rounded-2xl hover:bg-blue-500/10 transition-all duration-300 text-lg font-medium group"
                  >
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                      <span className="text-blue-400 text-lg">🚀</span>
                    </div>
                    <span>Features</span>
                  </a>
                  
                  <a 
                    href="#testimonials" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="flex items-center space-x-4 text-gray-300 hover:text-blue-400 py-2 px-5 rounded-2xl hover:bg-blue-500/10 transition-all duration-300 text-lg font-medium group"
                  >
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                      <span className="text-green-400 text-lg">⭐</span>
                    </div>
                    <span>Testimonials</span>
                  </a>
                  
                  <a 
                    href="#pricing" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="flex items-center space-x-4 text-gray-300 hover:text-blue-400 py-2 px-5 rounded-2xl hover:bg-blue-500/10 transition-all duration-300 text-lg font-medium group"
                  >
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                      <span className="text-purple-400 text-lg">💎</span>
                    </div>
                    <span>Pricing</span>
                  </a>
                  
                  <a 
                    href="#contact" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="flex items-center space-x-4 text-gray-300 hover:text-blue-400 py-2 px-5 rounded-2xl hover:bg-blue-500/10 transition-all duration-300 text-lg font-medium group"
                  >
                    <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                      <span className="text-orange-400 text-lg">📞</span>
                    </div>
                    <span>Contact</span>
                  </a>
                </div>
              </div>
              
              {/* Bottom Section with CTA */}
              <div className="p-6 pb-16 border-t border-blue-500/20">
                <div className="bg-gradient-to-r from-blue-600/20 to-blue-700/20 rounded-2xl p-4 mb-4 border border-blue-500/50 shadow-lg shadow-blue-500/25 ring-1 ring-blue-500/40">
                  <p className="text-blue-300 text-sm text-center mb-3">
                    🎯 Ready to ace your exams?
                  </p>
                  <button
                    onClick={() => {
                      handleSignUp();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25 mb-3"
                  >
                    Start Free Trial 🚀
                  </button>
                  
                  <button
                    onClick={() => {
                      handleLogin();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-6 py-4 bg-gray-800 border border-gray-600 hover:bg-gray-700 hover:border-gray-500 text-gray-300 hover:text-white rounded-xl font-medium text-lg transition-all duration-300"
                  >
                    Sign In 🔐
                  </button>
                </div>
                
                <div className="text-center">
                  <p className="text-gray-400 text-xs">
                    Join 10,000+ students already learning
                  </p>
                </div>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA Section */}
      <section className="py-16 md:py-20 px-6 bg-gradient-to-br from-gray-900 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <div>
            <div className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full text-sm font-bold mb-6">
              🎯 Your Future Starts Here
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
              Ready to Ace Your Nepali University Entrance Exam?
            </h2>
            <p className="text-xl text-gray-300 mb-10 leading-relaxed">
              Join thousands of students who have already improved their performance and secured admissions 
              to top Nepali universities like IOE Pulchowk and Tribhuvan University with Parikshya's AI-powered exam preparation platform.
            </p>
            
            {/* Creative Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">Smart Practice</h3>
                <p className="text-gray-400 text-sm">AI adapts to your learning style</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">Progress Tracking</h3>
                <p className="text-gray-400 text-sm">Monitor your improvement daily</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">Expert Guidance</h3>
                <p className="text-gray-400 text-sm">24/7 AI counselor support</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={handleSignUp}
                className="px-10 py-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-semibold transition-all duration-300 shadow-xl flex items-center justify-center space-x-3 group text-lg"
              >
                <div className="w-6 h-6">
                  <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </div>
                <span>Start Your Journey Free</span>
              </button>
              <button
                onClick={handleLogin}
                className="px-10 py-5 bg-gray-800 border-2 border-blue-600 text-blue-400 hover:bg-gray-700 hover:border-blue-500 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center space-x-3 text-lg"
              >
                <User className="w-6 h-6" />
                <span>Already have an account?</span>
              </button>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-12 flex items-center justify-center space-x-8 text-gray-400">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Start Learning in 2 Minutes</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Cancel Anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Chatbot */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-110 flex items-center justify-center"
        >
          <Bot className="w-8 h-8" />
        </button>

        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-20 right-0 w-80 h-96 bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                <div className="flex items-center space-x-3">
                  <Bot className="w-6 h-6" />
                  <div>
                    <h3 className="font-semibold">AI Academic Counselor</h3>
                    <p className="text-sm text-blue-100">Always here to help!</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-64">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs p-3 rounded-2xl ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 p-3 rounded-2xl">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about your studies..."
                    className="flex-1 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:outline-none text-sm"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
       {/* Contact Section */}
       <section id="contact" className="py-16 md:py-20 px-6 bg-gray-900 mb-8">
         <div className="max-w-4xl mx-auto text-center">
           <div className="mb-16">
             <div className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full text-sm font-bold mb-6">
               📞 Get In Touch
             </div>
             <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
               Need Help?
             </h2>
             <p className="text-xl text-gray-300 max-w-2xl mx-auto">
               Have questions about our platform or need assistance? 
               Our support team is here to help you succeed.
             </p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-black rounded-2xl p-8 border border-gray-700/50">
               <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto mb-6">
                 <span className="text-2xl">⚡</span>
               </div>
               <h3 className="text-2xl font-bold text-white mb-6">Need Help?</h3>
               <div className="space-y-4 text-left">
                 <div className="flex items-center space-x-3">
                   <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                     <span className="text-blue-400">📧</span>
                   </div>
                   <div>
                     <p className="text-gray-400 text-sm">Email</p>
                     <p className="text-white font-medium">parikshya.blackbytes@gmail.com</p>
                   </div>
                 </div>
                 <div className="flex items-center space-x-3">
                   <div className="w-8 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center">
                     <span className="text-blue-400">📱</span>
                   </div>
                   <div>
                     <p className="text-gray-400 text-sm">Phone</p>
                     <p className="text-white font-medium">+977-9820987206</p>
                   </div>
                 </div>
               </div>
             </div>
             <div className="bg-black rounded-2xl p-8 border border-gray-700/50">
               <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mx-auto mb-6">
                 <span className="text-2xl">🤖</span>
               </div>
               <h3 className="text-2xl font-bold text-white mb-6">AI Support</h3>
               <p className="text-gray-300 mb-6">
                 Get instant help from our AI counselor available 24/7. 
                 Ask questions about exam preparation, study strategies, and more.
               </p>
               <button
                 onClick={() => document.getElementById('ai-counselor')?.scrollIntoView({ behavior: 'smooth' })}
                 className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-green-500/25"
               >
                 Chat with AI Counselor
               </button>
             </div>
           </div>
           <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="text-center">
               <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                 <span className="text-blue-400 text-xl">📚</span>
               </div>
               <h4 className="text-white font-semibold mb-2">Study Guides</h4>
               <p className="text-gray-400 text-sm">Comprehensive study materials and resources</p>
             </div>
             <div className="text-center">
               <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                 <span className="text-green-400 text-xl">🎯</span>
               </div>
               <h4 className="text-white font-semibold mb-2">Practice Tests</h4>
               <p className="text-gray-400 text-sm">Mock tests and practice questions</p>
             </div>
             <div className="text-center">
               <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                 <span className="text-purple-400 text-xl">📊</span>
               </div>
               <h4 className="text-white font-semibold mb-2">Progress Tracking</h4>
               <p className="text-gray-400 text-sm">Monitor your learning progress</p>
             </div>
           </div>
         </div>
       </section>



       {/* Footer */}
       <footer className="bg-black py-12 border-t border-gray-800/50">
         <div className="max-w-4xl mx-auto text-center">
           <p className="text-gray-400 text-sm">
             © 2024 Parikshya. All rights reserved by BlackBytes.
           </p>
         </div>
       </footer>
     </div>
   );
 };

export default LandingPage;
