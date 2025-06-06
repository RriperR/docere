import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuthStore } from '../../stores/authStore';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Confirm your password'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading, error } = useAuthStore();
  const [emailInUse, setEmailInUse] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    // Check if email is in use (for demo purposes)
    if (data.email === 'doctor@example.com' || 
        data.email === 'admin@example.com' || 
        data.email === 'patient@example.com') {
      setEmailInUse(true);
      return;
    }

    try {
      await registerUser(data.email, data.password);
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by the auth store
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Or{' '}
          <Link to="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
            sign in to your existing account
          </Link>
        </p>
      </div>
      
      {(error || emailInUse) && (
        <div className="mb-4 p-3 bg-error-50 text-error-800 rounded-md text-sm">
          {emailInUse ? 'Email is already in use' : error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          id="email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          icon={<Mail size={16} />}
          error={errors.email?.message}
          {...register('email')}
        />
        
        <Input
          id="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          icon={<Lock size={16} />}
          error={errors.password?.message}
          {...register('password')}
        />
        
        <Input
          id="confirmPassword"
          type="password"
          label="Confirm password"
          placeholder="••••••••"
          icon={<Lock size={16} />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        
        <div>
          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
          >
            Register
          </Button>
        </div>
      </form>
      
      <div className="mt-6">
        <p className="text-center text-sm text-gray-600">
          By signing up, you agree to our{' '}
          <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
            Privacy Policy
          </a>
        </p>
      </div>
    </motion.div>
  );
};

export default RegisterPage;