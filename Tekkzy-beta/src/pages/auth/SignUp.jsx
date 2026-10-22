import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { post } from 'aws-amplify/api';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

const SignUp = () => {
  const { signUp, signInWithGoogle, confirmSignUp, signIn } = useAuth();
  const { resendConfirmation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location?.state?.from?.pathname || '/product';

  const [step, setStep] = useState('signup'); // 'signup' | 'confirm'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const verifyInstitutionAccess = async (username) => {
    const institution = import.meta.env.VITE_INSTITUTION || 'tekkzy';
    const userPoolId =
      import.meta.env.VITE_COGNITO_USER_POOL_ID ||
      import.meta.env.VITE_USER_POOL_ID ||
      '';

    const restResponse = await post({
      apiName: 'main',
      path: `/any/user-exists/${institution}`,
      options: {
        body: {
          userPoolId,
          username,
        },
      },
    }).response;

    return await restResponse.body.json();
  };

  const createInstitutionProfile = async (username, fullName) => {
    const body = { email: username };
    if (fullName) {
      body.name = fullName;
    }

    const restResponse = await post({
      apiName: 'main',
      path: '/create-profile',
      options: {
        body,
      },
    }).response;

    return await restResponse.body.json();
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name || !email || !password || !confirmPassword) return setError('Please fill in all fields.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const existsResult = await verifyInstitutionAccess(normalizedEmail);

      if (existsResult?.inCognito) {
        setError('Account already exists. Please sign in to continue.');
        setTimeout(() => {
          navigate('/signin', {
            state: {
              prefillEmail: normalizedEmail,
              from: location?.state?.from,
            },
          });
        }, 600);
        return;
      }

      await signUp(normalizedEmail, password, name.trim());
      setPendingEmail(normalizedEmail);
      setStep('confirm');
      setSuccess('Account created — check your email for a confirmation code.');
    } catch (err) {
      setError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await confirmSignUp(pendingEmail || email, code);
      await signIn(pendingEmail || email, password);

      try {
        await createInstitutionProfile((pendingEmail || email).trim().toLowerCase(), name.trim());
      } catch (profileErr) {
        const statusCode = profileErr?.response?.statusCode;
        if (statusCode !== 409) {
          throw profileErr;
        }
      }

      setSuccess('Email verified — signed in. Redirecting...');
      setTimeout(() => navigate(redirectTo), 800);
    } catch (err) {
      setError(err.message || 'Confirmation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmClick = () => {};

  const handleGoogle = () => {
    signInWithGoogle();
  };

  const handleResend = async () => {
    setResendMessage('');
    setResendLoading(true);
    try {
      await resendConfirmation(pendingEmail || email);
      setResendMessage('Code resent — check your email.');
      setResendDisabled(true);
      // 30s cooldown
      setTimeout(() => setResendDisabled(false), 30000);
    } catch (err) {
      setResendMessage(err.message || 'Failed to resend code.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <main className="flex flex-col flex-grow items-center justify-center py-12">
        <div className="w-full max-w-md bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FaLock size={12} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">Tekkzy</span>
          </div>

          <h2 className="text-2xl font-bold text-white mt-3 mb-1">
            {step === 'confirm' ? 'Verify your email' : 'Create account'}
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            {step === 'confirm' ? `We sent a code to ${pendingEmail || email}` : 'Sign up to access live previews'}
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-300 text-sm">
              {success}
            </div>
          )}

          {/* SIGN UP FORM */}
          {step === 'signup' && (
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={13} />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={13} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={13} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-10 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={13} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-all mt-1 text-sm"
              >
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}

          {/* CONFIRM CODE FORM */}
          {step === 'confirm' && (
            <form onSubmit={handleConfirm} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Verification Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors tracking-[0.4em] text-center font-mono text-lg"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-all mt-1 text-sm"
              >
                {loading ? 'Verifying…' : 'Verify & Sign In'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendDisabled || resendLoading}
                  className="text-sm text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendLoading ? 'Resending…' : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('signup'); setError(''); }}
                  className="ml-auto text-gray-400 hover:text-gray-200 text-sm text-center transition-colors"
                >
                  ← Back to sign up
                </button>
              </div>

              {resendMessage && (
                <div className="text-sm mt-2 text-gray-300">{resendMessage}</div>
              )}
            </form>
          )}

          {/* Google + Links: only show during signup step */}
          {step === 'signup' && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-gray-600 text-xs">or continue with</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-2.5 rounded-lg transition-all text-sm"
              >
                <FaGoogle size={15} className="text-red-500" />
                Continue with Google
              </button>

              <p className="text-center text-sm text-gray-400 mt-4">Already have an account? <Link to="/signin" className="text-blue-500 hover:underline font-semibold">Sign in</Link></p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SignUp;