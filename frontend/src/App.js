import React, { useState, useEffect } from 'react';
// Remove unused imports - replace line 2 with this:
import { 
  Star, 
  MessageCircle, 
  TrendingUp, 
  Facebook, 
  MapPin, 
  Send, 
  Sparkles, 
  BarChart3, 
  CheckCircle2, 
  ArrowRight, 
  Menu, 
  X, 
  Bell, 
  Search, 
  Download, 
  Zap, 
  Shield, 
  Award, 
  Target 
} from 'lucide-react';
import './App.css';

// API Configuration
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const TastyReplyApp = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [aiReply, setAiReply] = useState('');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [analytics, setAnalytics] = useState({
    totalReviews: 0,
    responseRate: 0,
    averageRating: 0
  });

  // Animation states
  const [isVisible, setIsVisible] = useState(false);
  const [animateStats, setAnimateStats] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    if (currentPage === 'dashboard') {
      fetchReviews();
      fetchAnalytics();
      setTimeout(() => setAnimateStats(true), 500);
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
          setReviews(reviews.map(review => 
            review.id === selectedReview.id 
              ? { ...review, replied: true, reply: aiReply }
              : review
          ));
          
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

  // Google OAuth login
  const handleGoogleLogin = () => {
    // In production, this would redirect to Google OAuth
    const mockUser = {
      name: 'John Doe',
      email: 'john@restaurant.com',
      business: 'Tasty Restaurant',
      avatar: 'JD',
      connectedPlatforms: ['google', 'facebook']
    };
    setUser(mockUser);
    setShowAuthModal(false);
    setCurrentPage('dashboard');
  };

  // Filter reviews
  const filteredReviews = reviews.filter(review => {
    const matchesPlatform = filterPlatform === 'all' || review.platform === filterPlatform;
    const matchesSearch = searchQuery === '' || 
      review.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.text.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesPlatform && matchesSearch;
  });

  const AuthModal = () => (
    <div className="modal-overlay">
      <div className="modal" style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ marginBottom: '32px' }}>
          <div className="avatar avatar-lg" style={{ margin: '0 auto 16px' }}>
            <MessageCircle size={24} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>Welcome to TastyReply</h2>
          <p style={{ color: '#6b7280' }}>Connect your business accounts to manage reviews</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <button
            onClick={handleGoogleLogin}
            className="btn btn-secondary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '100%',
              gap: '12px'
            }}
          >
            <MapPin size={20} style={{ color: '#ef4444' }} />
            Continue with Google My Business
          </button>
          
          <button
            onClick={handleGoogleLogin}
            className="btn btn-secondary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '100%',
              gap: '12px'
            }}
          >
            <Facebook size={20} style={{ color: '#3b82f6' }} />
            Continue with Facebook Business
          </button>
        </div>

        <button
          onClick={() => setShowAuthModal(false)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer'
          }}
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );

  const LandingPage = () => (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <div className="animate-pulse animation-delay-1000" style={{
          position: 'absolute',
          top: '25%',
          left: '25%',
          width: '384px',
          height: '384px',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '50%',
          filter: 'blur(40px)'
        }}></div>
        <div className="animate-pulse animation-delay-2000" style={{
          position: 'absolute',
          top: '75%',
          right: '25%',
          width: '384px',
          height: '384px',
          background: 'rgba(147, 51, 234, 0.1)',
          borderRadius: '50%',
          filter: 'blur(40px)'
        }}></div>
        <div className="animate-pulse animation-delay-4000" style={{
          position: 'absolute',
          bottom: '25%',
          left: '33%',
          width: '384px',
          height: '384px',
          background: 'rgba(236, 72, 153, 0.1)',
          borderRadius: '50%',
          filter: 'blur(40px)'
        }}></div>
      </div>

      {/* Navigation */}
      <nav className="glass" style={{ 
        position: 'relative', 
        zIndex: 10,
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            height: '64px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div className="avatar" style={{ marginRight: '12px' }}>
                <MessageCircle size={24} />
              </div>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>TastyReply</span>
            </div>
            
            {/* Desktop Navigation */}
            <div style={{ display: window.innerWidth >= 768 ? 'block' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                <a href="#features" style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>Features</a>
                <a href="#pricing" style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>Pricing</a>
                <a href="#about" style={{ color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>About</a>
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="btn btn-primary"
                >
                  Get Started
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div style={{ display: window.innerWidth < 768 ? 'block' : 'none' }}>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{ background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.8)' }}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="glass-dark" style={{ 
              padding: '16px', 
              borderTop: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <a href="#features" style={{ padding: '12px', color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>Features</a>
              <a href="#pricing" style={{ padding: '12px', color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>Pricing</a>
              <a href="#about" style={{ padding: '12px', color: 'rgba(255, 255, 255, 0.8)', textDecoration: 'none' }}>About</a>
              <button 
                onClick={() => setShowAuthModal(true)}
                className="btn btn-primary"
                style={{ marginTop: '8px' }}
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{ 
        position: 'relative', 
        maxWidth: '1280px', 
        margin: '0 auto', 
        padding: '80px 16px 64px',
        zIndex: 5
      }}>
        <div className={`animate-fadeInUp ${isVisible ? '' : 'opacity-0'}`} style={{ textAlign: 'center' }}>
          <div className="badge" style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '9999px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '14px',
            marginBottom: '32px'
          }}>
            <Sparkles size={16} style={{ marginRight: '8px', color: '#fbbf24' }} />
            Powered by Advanced AI Technology
          </div>
          
          <h1 style={{ 
            fontSize: '4rem', 
            fontWeight: 'bold', 
            color: 'white', 
            marginBottom: '24px',
            lineHeight: '1.1'
          }}>
            Transform Your
            <span style={{ 
              display: 'block',
              background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Review Management
            </span>
          </h1>
          
          <p style={{ 
            fontSize: '20px', 
            color: 'rgba(255, 255, 255, 0.8)', 
            marginBottom: '32px', 
            maxWidth: '768px', 
            margin: '0 auto 32px',
            lineHeight: '1.6'
          }}>
            Connect Google Maps, Facebook, and more. Respond with AI-powered replies, 
            analyze sentiment, and boost your online reputation automatically.
          </p>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: window.innerWidth < 640 ? 'column' : 'row',
            gap: '16px', 
            justifyContent: 'center',
            marginBottom: '64px'
          }}>
            <button 
              onClick={() => setShowAuthModal(true)}
              className="btn btn-primary btn-lg hover-lift"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              Start Free Trial 
              <ArrowRight size={20} style={{ marginLeft: '8px' }} />
            </button>
            <button className="btn btn-secondary btn-lg">
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '32px', 
            maxWidth: '512px', 
            margin: '0 auto'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>50K+</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>Reviews Managed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>95%</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>Response Rate</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>2.5x</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>Faster Replies</div>
            </div>
          </div>
        </div>

        {/* Hero Cards */}
        <div style={{ 
          marginTop: '80px', 
          display: 'grid', 
          gridTemplateColumns: window.innerWidth >= 768 ? 'repeat(3, 1fr)' : '1fr',
          gap: '32px'
        }}>
          <div className="glass-card hover-lift animate-float">
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <div className="avatar avatar-lg" style={{ 
                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                marginBottom: '24px'
              }}>
                <MapPin size={32} />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>Google Integration</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.6' }}>
                Seamlessly sync with Google My Business and manage all your location reviews in real-time.
              </p>
            </div>
          </div>
          
          <div className="glass-card hover-lift animate-float animation-delay-300">
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <div className="avatar avatar-lg" style={{ 
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                marginBottom: '24px'
              }}>
                <Sparkles size={32} />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>AI Responses</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.6' }}>
                Generate personalized, professional responses that match your brand voice and customer sentiment.
              </p>
            </div>
          </div>
          
          <div className="glass-card hover-lift animate-float animation-delay-500">
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <div className="avatar avatar-lg" style={{ 
                background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                marginBottom: '24px'
              }}>
                <BarChart3 size={32} />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>Smart Analytics</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.6' }}>
                Get actionable insights about customer sentiment, trends, and opportunities to improve.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="glass" style={{ 
        position: 'relative',
        padding: '80px 0',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '48px', fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>Powerful Features</h2>
            <p style={{ fontSize: '20px', color: 'rgba(255, 255, 255, 0.7)' }}>Everything you need for professional review management</p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: window.innerWidth >= 1024 ? 'repeat(3, 1fr)' : window.innerWidth >= 768 ? 'repeat(2, 1fr)' : '1fr',
            gap: '32px'
          }}>
            {[
              { icon: MapPin, title: "Google My Business", desc: "Sync all your Google reviews automatically", color: "linear-gradient(135deg, #ef4444, #f97316)" },
              { icon: Facebook, title: "Facebook Integration", desc: "Manage Facebook page reviews seamlessly", color: "linear-gradient(135deg, #3b82f6, #2563eb)" },
              { icon: Zap, title: "Instant Notifications", desc: "Get alerted immediately when reviews arrive", color: "linear-gradient(135deg, #eab308, #f97316)" },
              { icon: Shield, title: "Sentiment Analysis", desc: "Understand customer emotions automatically", color: "linear-gradient(135deg, #10b981, #059669)" },
              { icon: Award, title: "Team Collaboration", desc: "Multiple users with role-based permissions", color: "linear-gradient(135deg, #8b5cf6, #ec4899)" },
              { icon: Target, title: "Performance Insights", desc: "Track metrics that matter to your business", color: "linear-gradient(135deg, #06b6d4, #3b82f6)" }
            ].map((feature, index) => (
              <div key={index} className="glass-card hover-lift">
                <div style={{ padding: '32px' }}>
                  <div className="avatar" style={{ 
                    background: feature.color,
                    marginBottom: '24px'
                  }}>
                    <feature.icon size={24} />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>{feature.title}</h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="glass" style={{ 
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))',
        padding: '80px 0',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto', textAlign: 'center', padding: '0 16px' }}>
          <h2 style={{ fontSize: '48px', fontWeight: 'bold', color: 'white', marginBottom: '16px' }}>Ready to Transform Your Reviews?</h2>
          <p style={{ fontSize: '20px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '32px' }}>Join thousands of businesses already using TastyReply to improve their online reputation.</p>
          <button 
            onClick={() => setShowAuthModal(true)}
            className="btn btn-primary btn-lg shadow-glow"
          >
            Start Your Free Trial
          </button>
        </div>
      </div>

      {showAuthModal && <AuthModal />}
    </div>
  );

  const Dashboard = () => (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Dashboard Header */}
      <div style={{ 
        background: 'white', 
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div className="avatar" style={{ marginRight: '12px' }}>
                <MessageCircle size={24} />
              </div>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>TastyReply</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button style={{ 
                position: 'relative', 
                padding: '8px', 
                color: '#6b7280', 
                background: 'none', 
                border: 'none',
                cursor: 'pointer'
              }}>
                <Bell size={20} />
                <span className="notification-dot"></span>
              </button>
              <button 
                onClick={() => setCurrentPage('landing')}
                style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ← Back to Home
              </button>
              {user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{user.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{user.business}</div>
                  </div>
                  <div className="avatar">
                    {user.avatar}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }}>
        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: window.innerWidth >= 768 ? 'repeat(4, 1fr)' : window.innerWidth >= 640 ? 'repeat(2, 1fr)' : '1fr',
          gap: '24px', 
          marginBottom: '32px'
        }}>
          {[
            { icon: Star, label: 'Average Rating', value: analytics.averageRating || '4.2', color: '#eab308' },
            { icon: MessageCircle, label: 'Total Reviews', value: analytics.totalReviews || reviews.length, color: '#3b82f6' },
            { icon: CheckCircle2, label: 'Response Rate', value: `${analytics.responseRate || 0}%`, color: '#10b981' },
            { icon: TrendingUp, label: 'This Month', value: `+${reviews.length}`, color: '#8b5cf6' }
          ].map((stat, index) => (
            <div key={index} className={`stats-card hover-lift ${animateStats ? 'animate-fadeInUp' : ''}`} style={{ animationDelay: `${index * 0.1}s` }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ 
                  padding: '12px', 
                  borderRadius: '12px', 
                  background: `${stat.color}20`,
                  marginRight: '16px'
                }}>
                  <stat.icon size={24} style={{ color: stat.color }} />
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>{stat.label}</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reviews Section */}
        <div className="card">
          <div style={{ padding: '24px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: window.innerWidth < 640 ? 'column' : 'row',
              alignItems: window.innerWidth < 640 ? 'flex-start' : 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>Recent Reviews</h2>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="input-with-icon">
                  <Search className="input-icon" size={20} />
                  <input
                    type="text"
                    placeholder="Search reviews..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input"
                    style={{ paddingLeft: '48px', fontSize: '14px' }}
                  />
                </div>
                
                <select
                  value={filterPlatform}
                  onChange={(e) => setFilterPlatform(e.target.value)}
                  className="input"
                  style={{ fontSize: '14px' }}
                >
                  <option value="all">All Platforms</option>
                  <option value="google">Google</option>
                  <option value="facebook">Facebook</option>
                </select>
                
                <button className="btn btn-sm" style={{ padding: '8px' }}>
                  <Download size={16} />
                </button>
              </div>
            </div>
          </div>
          
          <div>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center' }}>
                <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
                <p style={{ color: '#6b7280' }}>Loading reviews...</p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                <MessageCircle size={48} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
                <p>{searchQuery || filterPlatform !== 'all' ? 'No reviews match your filters.' : 'No reviews found. Connect your Google Maps and Facebook accounts to start managing reviews.'}</p>
              </div>
            ) : (
              filteredReviews.map((review) => (
                <div key={review.id} className="review-card" style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
                      <div className="avatar">
                        {review.avatar}
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <p style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{review.customerName}</p>
                          <div className="star-rating">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                className={i < review.rating ? 'star' : ''}
                                style={{ color: i < review.rating ? '#fbbf24' : '#d1d5db' }}
                                fill={i < review.rating ? 'currentColor' : 'none'}
                              />
                            ))}
                          </div>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>{review.date}</span>
                          <div className={`badge badge-${review.platform}`}>
                            {review.platform === 'google' ? (
                              <MapPin size={12} style={{ marginRight: '4px' }} />
                            ) : (
                              <Facebook size={12} style={{ marginRight: '4px' }} />
                            )}
                            {review.platform === 'google' ? 'Google' : 'Facebook'}
                          </div>
                        </div>
                        
                        <p style={{ fontSize: '14px', color: '#374151', marginBottom: '12px', lineHeight: '1.5' }}>{review.text}</p>
                        
                        {review.replied && review.reply && (
                          <div style={{ 
                            background: 'linear-gradient(135deg, #eff6ff, #f3e8ff)',
                            borderLeft: '4px solid #3b82f6',
                            padding: '16px',
                            marginTop: '12px',
                            borderRadius: '0 8px 8px 0'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                              <CheckCircle2 size={16} style={{ color: '#3b82f6', marginTop: '2px', flexShrink: 0 }} />
                              <div>
                                <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e40af', marginBottom: '4px' }}>Your Reply:</p>
                                <p style={{ fontSize: '14px', color: '#1e40af' }}>{review.reply}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ marginLeft: '16px', flexShrink: 0 }}>
                      {!review.replied ? (
                        <button
                          onClick={() => setSelectedReview(review)}
                          className="btn btn-sm hover-lift"
                          style={{ 
                            background: '#eff6ff',
                            border: '2px solid #bfdbfe',
                            color: '#1d4ed8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <Sparkles size={16} />
                          AI Reply
                        </button>
                      ) : (
                        <span className="badge badge-success">
                          <CheckCircle2 size={16} style={{ marginRight: '4px' }} />
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

      {/* Enhanced AI Reply Modal */}
      {selectedReview && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ 
              padding: '24px', 
              borderBottom: '1px solid #f3f4f6',
              background: 'linear-gradient(135deg, #eff6ff, #f3e8ff)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="avatar">
                    <Sparkles size={20} />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>AI Reply Assistant</h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedReview(null);
                    setAiReply('');
                  }}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#9ca3af', 
                    cursor: 'pointer' 
                  }}
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ 
                background: '#f9fafb', 
                padding: '24px', 
                borderRadius: '12px', 
                marginBottom: '24px',
                border: '1px solid #f3f4f6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div className="avatar avatar-sm">
                    {selectedReview.avatar}
                  </div>
                  <span style={{ fontWeight: '500', color: '#1f2937' }}>{selectedReview.customerName}</span>
                  <div className="star-rating">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        style={{ color: i < selectedReview.rating ? '#fbbf24' : '#d1d5db' }}
                        fill={i < selectedReview.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                </div>
                <p style={{ color: '#374151', lineHeight: '1.5' }}>{selectedReview.text}</p>
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
                  AI Generated Reply
                </label>
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={aiReply}
                    onChange={(e) => setAiReply(e.target.value)}
                    className="input"
                    style={{ 
                      minHeight: '120px', 
                      resize: 'none',
                      fontSize: '14px'
                    }}
                    placeholder={isGeneratingReply ? "Generating AI reply..." : "Click 'Generate AI Reply' to create a professional response"}
                    disabled={isGeneratingReply}
                  />
                  {isGeneratingReply && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="loading-spinner"></div>
                        <span style={{ color: '#3b82f6', fontWeight: '500' }}>Generating reply...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <button
                  onClick={() => generateAIReply(selectedReview)}
                  disabled={isGeneratingReply}
                  className="btn"
                  style={{
                    background: '#f3e8ff',
                    border: '2px solid #d8b4fe',
                    color: '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Sparkles size={16} />
                  Generate AI Reply
                </button>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => {
                      setSelectedReview(null);
                      setAiReply('');
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendReply}
                    disabled={!aiReply || isGeneratingReply}
                    className="btn btn-primary shadow-glow"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Send size={16} />
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