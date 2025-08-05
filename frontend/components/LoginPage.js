// components/LoginPage.js - Dedicated login page
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import api from '../utils/api';

const LoginPage = () => {
  const handleGoogleLogin = () => {
    api.loginWithGoogle();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <MessageCircle className="h-12 w-12 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome to TastyReply</h1>
            <p className="text-gray-600 mt-2">Sign in to manage your business reviews</p>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            <FcGoogle className="h-6 w-6" />
            <span>Continue with Google</span>
          </button>

          <p className="text-center text-sm text-gray-500 mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;