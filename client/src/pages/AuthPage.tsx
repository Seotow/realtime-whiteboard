import React from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PenTool, Zap, Users, Shield } from 'lucide-react';
import { AuthForm } from '../components/Auth/AuthForm';
import { useAuthStore } from '../stores/authStore';

export const AuthPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      {/* Left Side - Features */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12">
        <div className="max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <PenTool className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Whiteboard</span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Collaborate in real-time with your team
          </h1>
          
          <p className="text-xl text-gray-600 mb-12">
            Create, share, and collaborate on whiteboards with powerful drawing tools, 
            real-time sync, and seamless team integration.
          </p>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Lightning Fast</h3>
                <p className="text-gray-600">Real-time collaboration with zero lag</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Team Collaboration</h3>
                <p className="text-gray-600">Work together with unlimited team members</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Secure & Private</h3>
                <p className="text-gray-600">Enterprise-grade security for your data</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <AuthForm />
        </div>
      </div>
    </div>
  );
};
