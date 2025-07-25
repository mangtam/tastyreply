import React, { useState, useEffect } from 'react';
import { Star, MessageCircle, TrendingUp, Globe, Facebook, MapPin, Send, Sparkles, BarChart3, Users, Clock, CheckCircle2, ArrowRight, Menu, X } from 'lucide-react';
import './App.css';

// API Configuration - This is the key part!
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TastyReplyApp = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [aiReply, setAiReply] = useState('');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalReviews: 0,
    responseRate: 0,
    averageRating: 0
  });

  // Fetch reviews from backend
  useEffect(() => {
    if (currentPage === 'dashboard') {
      fetchReviews();
      fetchAnalytics();
    }
  }, [currentPage]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/reviews`);
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.data);
      } else {
        console.error('Failed to fetch reviews:', data.error);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE}/analytics`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  // Generate AI reply using backend
  const generateAIReply = async (review) => {
    setIsGeneratingReply(true);
    
    try {
      const response = await fetch(`${API_BASE}/ai/generate-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewText: review.text,
          rating: review.rating,
          customerName: review.customerName,
          businessType: 'restaurant'
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAiReply(data.data.reply);
      } else {
        throw new Error(data.error || 'Failed to generate reply');
      }
    } catch (error) {
      console.error('Error generating AI reply:', error);
      setAiReply('Sorry, failed to generate reply. Please try again.');
    } finally {
      setIsGeneratingReply(false);
    }
  };

  // Send reply to backend
  const sendReply = async () => {
    if (selectedReview && aiReply) {
      try {
        const response = await fetch(`${API_BASE}/reviews/${selectedReview.id}/reply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reply: aiReply
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Update local state
          setReviews(reviews.map(review => 
            review.id === selectedReview.id 
              ? { ...review, replied: true, reply: aiReply }
              : review
          ));
          
          // Close modal and refresh analytics
          setSelectedReview(null);
          setAiReply('');
          fetchAnalytics();
        } else {
          throw new Error(data.error || 'Failed to send reply');
        }
      } catch (error) {
        console.error('Error sending reply:', error);
        alert('Failed to send reply. Please try again.');
      }
    }
  };

  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">TastyReply</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="flex items-center space-x-8">
                <a href="#features" className="text-gray-600 hover:text-blue-600">Features</a>
                <a href="#pricing" className="text-gray-600 hover:text-blue-600">Pricing</a>
                <a href="#about" className="text-gray-600 hover:text-blue-600">About</a>
                <button 
                  onClick={() => setCurrentPage('dashboard')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Dashboard
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-blue-600"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
                <a href="#features" className="block px-3 py-2 text-gray-600 hover:text-blue-600">Features</a>
                <a href="#pricing" className="block px-3 py-2 text-gray-600 hover:text-blue-600">Pricing</a>
                <a href="#about" className="block px-3 py-2 text-gray-600 hover:text-blue-600">About</a>
                <button 
                  onClick={() => setCurrentPage('dashboard')}
                  className="w-full text-left bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Manage All Your
            <span className="text-blue-600 block">Business Reviews</span>
            in One Place
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            TastyReply aggregates reviews from Google Maps, Facebook, and more. 
            Respond with AI-powered replies and gain insights to grow your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => setCurrentPage('dashboard')}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              Try Live Demo <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            <button className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors">
              Watch Demo
            </button>
          </div>
        </div>

        {/* Hero Image/Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <Globe className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">5+ Platforms</h3>
            <p className="text-gray-600">Connect all review platforms</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <Sparkles className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">AI Responses</h3>
            <p className="text-gray-600">Smart, personalized replies</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">Analytics</h3>
            <p className="text-gray-600">Actionable business insights</p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600">Everything you need to manage your online reputation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <MapPin className="h-10 w-10 text-red-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Google Maps Integration</h3>
              <p className="text-gray-600">Automatically sync and manage all your Google Business reviews in real-time.</p>
            </div>
            
            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <Facebook className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Facebook Reviews</h3>
              <p className="text-gray-600">Connect your Facebook Business page and manage all customer feedback.</p>
            </div>
            
            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <Sparkles className="h-10 w-10 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI-Powered Replies</h3>
              <p className="text-gray-600">Generate personalized, professional responses with advanced AI technology.</p>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <TrendingUp className="h-10 w-10 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sentiment Analysis</h3>
              <p className="text-gray-600">Track customer sentiment trends and identify areas for improvement.</p>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <Users className="h-10 w-10 text-orange-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
              <p className="text-gray-600">Allow multiple team members to manage and respond to reviews.</p>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <Clock className="h-10 w-10 text-indigo-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Real-time Alerts</h3>
              <p className="text-gray-600">Get instant notifications when new reviews are posted.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Your Review Management?</h2>
          <p className="text-xl text-blue-100 mb-8">Join thousands of businesses already using TastyReply to improve their online reputation.</p>
          <button 
            onClick={() => setCurrentPage('dashboard')}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Start Your Free Trial
          </button>
        </div>
      </div>
    </div>
  );

  const Dashboard = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">TastyReply</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setCurrentPage('landing')}
                className="text-gray-600 hover:text-blue-600"
              >
                ← Back to Home
              </button>
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                JD
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.averageRating || '4.2'}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalReviews || reviews.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.responseRate || 0}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">+{reviews.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Recent Reviews</h2>
              {loading && (
                <div className="flex items-center text-sm text-gray-500">
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  Loading...
                </div>
              )}
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {reviews.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No reviews found. Connect your Google Maps and Facebook accounts to start managing reviews.</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                          {review.avatar}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium text-gray-900">{review.customerName}</p>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">{review.date}</span>
                          <div className="flex items-center space-x-1">
                            {review.platform === 'google' ? (
                              <MapPin className="h-4 w-4 text-red-500" />
                            ) : (
                              <Facebook className="h-4 w-4 text-blue-600" />
                            )}
                            <span className="text-xs text-gray-500 capitalize">{review.platform}</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3">{review.text}</p>
                        
                        {review.replied && review.reply && (
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-3">
                            <p className="text-sm text-blue-800">
                              <span className="font-medium">Your Reply:</span> {review.reply}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 ml-4">
                      {!review.replied ? (
                        <button
                          onClick={() => setSelectedReview(review)}
                          className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI Reply
                        </button>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded text-green-700 bg-green-50">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Replied
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* AI Reply Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Generate AI Reply</h3>
            </div>
            
            <div className="p-6">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium">{selectedReview.customerName}</span>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < selectedReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700">{selectedReview.text}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Generated Reply
                </label>
                <textarea
                  value={aiReply}
                  onChange={(e) => setAiReply(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                  placeholder={isGeneratingReply ? "Generating AI reply..." : "Click 'Generate AI Reply' to create a response"}
                  disabled={isGeneratingReply}
                />
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={() => generateAIReply(selectedReview)}
                  disabled={isGeneratingReply}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  {isGeneratingReply ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate AI Reply
                    </>
                  )}
                </button>
                
                <div className="space-x-3">
                  <button
                    onClick={() => {
                      setSelectedReview(null);
                      setAiReply('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendReply}
                    disabled={!aiReply || isGeneratingReply}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return currentPage === 'landing' ? <LandingPage /> : <Dashboard />;
};

export default TastyReplyApp;