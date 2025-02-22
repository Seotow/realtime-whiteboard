import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface AuthFormProps {
  onClose?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const { login, register, isLoading, error, clearError } = useAuthStore();

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    // Email validation
    if (!formData.email) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address (e.g., user@example.com)';
    }
    
    // Username validation (for registration)
    if (!isLogin) {
      if (!formData.username) {
        errors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        errors.username = 'Username must be at least 3 characters long';
      } else if (formData.username.length > 30) {
        errors.username = 'Username must be less than 30 characters';
      } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
        errors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
      }
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!isLogin) {
      // More detailed password validation for registration
      if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long';
      } else if (!/(?=.*[a-z])/.test(formData.password)) {
        errors.password = 'Password must contain at least one lowercase letter';
      } else if (!/(?=.*[A-Z])/.test(formData.password)) {
        errors.password = 'Password must contain at least one uppercase letter';
      } else if (!/(?=.*\d)/.test(formData.password)) {
        errors.password = 'Password must contain at least one number';
      } else if (!/(?=.*[!@#$%^&*])/.test(formData.password)) {
        errors.password = 'Password should contain at least one special character (!@#$%^&*)';
      }
    }
    
    // Confirm password validation
    if (!isLogin && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match. Please make sure both passwords are identical.';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation errors for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.email, formData.username, formData.password);
      }
      onClose?.();
    } catch (error) {
      // Error is handled by the store
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    });
    setValidationErrors({});
    clearError();
  };
  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md p-8 border border-slate-200/50"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-600">
            {isLogin 
              ? 'Sign in to your whiteboard account' 
              : 'Join our collaborative whiteboard platform'
            }
          </p>
        </div>        {(error || Object.keys(validationErrors).length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50/80 border border-red-200/60 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                {error && (
                  <p className="text-red-700 text-sm font-medium mb-2">{error}</p>
                )}
                {Object.keys(validationErrors).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-red-700 text-sm font-medium">Please fix the following issues:</p>
                    <ul className="text-red-600 text-sm space-y-1 ml-2">
                      {Object.entries(validationErrors).map(([field, message]) => (
                        <li key={field} className="flex items-start gap-1">
                          <span className="text-red-400 mt-1">•</span>
                          <span>{message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                  validationErrors.email 
                    ? 'border-red-300 focus:ring-red-500 bg-red-50/50' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Enter your email"
                required
              />
            </div>
            {validationErrors.email && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-600 text-xs mt-1 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                {validationErrors.email}
              </motion.p>
            )}
          </div>          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                    validationErrors.username 
                      ? 'border-red-300 focus:ring-red-500 bg-red-50/50' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Choose a username"
                  required
                />
              </div>
              {validationErrors.username && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-600 text-xs mt-1 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.username}
                </motion.p>
              )}
            </div>
          )}          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                  validationErrors.password 
                    ? 'border-red-300 focus:ring-red-500 bg-red-50/50' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {validationErrors.password && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-600 text-xs mt-1 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                {validationErrors.password}
              </motion.p>
            )}
            {!isLogin && !validationErrors.password && formData.password && (
              <div className="mt-2 space-y-1">
                <div className="text-xs text-gray-600">Password strength:</div>
                <div className="flex gap-1">
                  <div className={`h-1 w-full rounded ${formData.password.length >= 8 ? 'bg-green-400' : 'bg-gray-200'}`}></div>
                  <div className={`h-1 w-full rounded ${/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password) ? 'bg-green-400' : 'bg-gray-200'}`}></div>
                  <div className={`h-1 w-full rounded ${/(?=.*\d)/.test(formData.password) ? 'bg-green-400' : 'bg-gray-200'}`}></div>
                  <div className={`h-1 w-full rounded ${/(?=.*[!@#$%^&*])/.test(formData.password) ? 'bg-green-400' : 'bg-gray-200'}`}></div>
                </div>
                <div className="text-xs text-gray-500">
                  Include: 8+ chars, uppercase, lowercase, number, special char
                </div>
              </div>
            )}
          </div>          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                    validationErrors.confirmPassword 
                      ? 'border-red-300 focus:ring-red-500 bg-red-50/50' 
                      : formData.confirmPassword && formData.password === formData.confirmPassword
                      ? 'border-green-300 focus:ring-green-500 bg-green-50/50'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-600 text-xs mt-1 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.confirmPassword}
                </motion.p>
              )}
              {!validationErrors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-green-600 text-xs mt-1 flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Passwords match
                </motion.p>
              )}
            </div>
          )}          <button
            type="submit"
            disabled={isLoading || Object.keys(validationErrors).length > 0}
            className={`w-full font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
              isLoading || Object.keys(validationErrors).length > 0
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={toggleMode}
              className="ml-2 text-blue-600 hover:text-blue-700 font-semibold"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </motion.div>
    </div>
  );
};
