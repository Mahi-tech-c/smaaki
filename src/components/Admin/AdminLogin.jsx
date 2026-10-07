import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowLeft, Loader2, Send } from 'lucide-react';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword } from 'firebase/auth';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isRegistering) {
        if (secretCode !== 'smaakAdmin2024') {
          setError('Invalid Registration Code. Unauthorized.');
          setLoading(false);
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('admin_cached_auth', 'superadmin');
      }
      navigate('/admin/dashboard');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/configuration-not-found') {
        setError('Authentication is not enabled in your Firebase Console yet. Please go to Firebase Console > Authentication and enable Email/Password.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError('');
    } catch {
      setError('Failed to send reset email. Verify your address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-pink-50/20 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Decorative Blossoms */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
         <div className="absolute top-10 left-10 animate-float">
           <svg width="100" height="100" viewBox="-32 -32 64 64"><path d="M0-25c5 0 10 5 10 15s-5 10-10 10-10-5-10-10 5-15 10-15" fill="#db2777" transform="rotate(0)"/><path d="M0-25c5 0 10 5 10 15s-5 10-10 10-10-5-10-10 5-15 10-15" fill="#db2777" transform="rotate(72)"/><path d="M0-25c5 0 10 5 10 15s-5 10-10 10-10-5-10-10 5-15 10-15" fill="#db2777" transform="rotate(144)"/><circle r="5" fill="#fff"/></svg>
         </div>
         <div className="absolute bottom-20 right-20 animate-float-delayed">
           <svg width="150" height="150" viewBox="-32 -32 64 64"><path d="M0-25c5 0 10 5 10 15s-5 10-10 10-10-5-10-10 5-15 10-15" fill="#f472b6" transform="rotate(216)"/><path d="M0-25c5 0 10 5 10 15s-5 10-10 10-10-5-10-10 5-15 10-15" fill="#f472b6" transform="rotate(288)"/><circle r="5" fill="#fff"/></svg>
         </div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10 bg-white/70 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-pink-100">
        <Link 
          to="/" 
          className="absolute top-6 left-6 p-2 text-pink-400 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all group"
          title="Back to Home"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div>
          <div className="mx-auto h-16 w-16 bg-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-200">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-pink-900">
            Admin Portal
          </h2>
          <p className="mt-2 text-center text-sm text-pink-600 font-medium">
            Manage your restaurant identity and content
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleAuthAction}>
          <div className="rounded-md shadow-sm space-y-4">
            {isRegistering && (
              <div className="relative animate-in fade-in slide-in-from-top-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-pink-400" />
                </div>
                <input
                  type="password"
                  required
                  className="appearance-none relative block w-full px-10 py-3 border border-pink-200 placeholder-pink-400 text-pink-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-pink-50/50 font-bold"
                  placeholder="Master Registration Code"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                />
              </div>
            )}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-pink-400" />
              </div>
              <input
                type="email"
                required
                className="appearance-none relative block w-full px-10 py-3 border border-pink-200 placeholder-pink-300 text-pink-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white/50 font-medium"
                placeholder="Admin Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-pink-400" />
              </div>
              <input
                type="password"
                required
                className="appearance-none relative block w-full px-10 py-3 border border-pink-200 placeholder-pink-300 text-pink-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white/50 font-medium"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="text-xs font-black uppercase tracking-widest text-pink-500 hover:text-pink-700 transition-colors"
            >
              {isRegistering ? 'Back to Login' : 'First Time Setup'}
            </button>

            {!isRegistering && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-black uppercase tracking-widest text-pink-500 hover:text-pink-700 transition-colors"
              >
                Forgot Password?
              </button>
            )}
          </div>

          {error && (
            <div className="text-red-500 text-xs font-bold text-center bg-red-50 py-3 rounded-xl border border-red-100 animate-shake">
              {error}
            </div>
          )}

          {resetSent && (
            <div className="text-green-600 text-xs font-bold text-center bg-green-50 py-3 rounded-xl border border-green-100 flex items-center justify-center gap-2">
              <Send size={14} />
              Reset email sent! Check your inbox.
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black uppercase tracking-widest rounded-2xl text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all shadow-xl shadow-pink-200/50 active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
              {loading ? <Loader2 className="animate-spin" /> : (isRegistering ? 'Create Admin Account' : 'Sign in to Admin')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
