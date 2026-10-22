import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';

const SignIn = () => {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefillEmail = location?.state?.prefillEmail || '';
  const redirectTo = location?.state?.from?.pathname || '/product';
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const stageRef = useRef(null);
  const cardRef = useRef(null);
  const errorRef = useRef(null);
  const submitBtnRef = useRef(null);
  const glowTweenRef = useRef(null);

  const busy = loading || googleLoading || success;

  useEffect(() => {
    const id = 'tekkzy-auth-fonts';
    if (document.getElementById(id)) return undefined;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap';
    document.head.appendChild(link);
    return undefined;
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.signin-header > *',
        { opacity: 0, y: -12 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.08 },
      )
        .fromTo(
          cardRef.current,
          { opacity: 0, y: 28, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 0.7 },
          '-=0.25',
        )
        .fromTo(
          '.signin-stagger',
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.45, stagger: 0.06 },
          '-=0.35',
        )
        .fromTo(
          '.signin-footer',
          { opacity: 0 },
          { opacity: 1, duration: 0.4 },
          '-=0.2',
        );

      gsap.fromTo(
        '.signin-glow',
        { opacity: 0, scale: 0.92 },
        { opacity: 1, scale: 1, duration: 1.15, ease: 'power2.out' },
      );

      glowTweenRef.current = gsap.to('.signin-glow-primary', {
        opacity: 0.55,
        scale: 1.06,
        duration: 3.2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      });
    }, stageRef);

    return () => {
      glowTweenRef.current?.kill();
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    if (!error || !errorRef.current) return undefined;
    gsap.fromTo(
      errorRef.current,
      { opacity: 0, y: -6, x: 0 },
      { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' },
    );
    gsap.fromTo(
      cardRef.current,
      { x: 0 },
      {
        keyframes: [
          { x: -7 },
          { x: 7 },
          { x: -5 },
          { x: 5 },
          { x: -2 },
          { x: 0 },
        ],
        duration: 0.42,
        ease: 'power1.inOut',
      },
    );
    return undefined;
  }, [error]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setLoading(true);

    if (submitBtnRef.current) {
      gsap.to(submitBtnRef.current, {
        scale: 0.98,
        duration: 0.12,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out',
      });
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      await signIn(normalizedEmail, password);

      const isAdmin = normalizedEmail === 'admin@happyprancer.com';
      localStorage.setItem('userEmail', normalizedEmail);
      localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');
      localStorage.setItem('isAuthenticated', 'true');

      setSuccess(true);
      if (cardRef.current) {
        await gsap.to(cardRef.current, {
          opacity: 0.92,
          y: -8,
          duration: 0.28,
          ease: 'power2.in',
        });
      }
      navigate(redirectTo);
    } catch (err) {
      setSuccess(false);
      setError(err.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (busy) return;
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setGoogleLoading(false);
      setError(err.message || 'Google sign-in failed. Please try again.');
    }
  };

  return (
    <div
      ref={stageRef}
      className="relative flex min-h-dvh flex-col overflow-hidden"
      style={{
        fontFamily: '"Figtree", system-ui, sans-serif',
        background: '#08090b',
        color: '#e8eaed',
      }}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="signin-glow signin-glow-primary absolute left-1/2 top-[-10%] h-[55vh] w-[70vw] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(56,140,220,0.22) 0%, transparent 68%)',
          }}
        />
        <div
          className="signin-glow absolute bottom-[-15%] left-[10%] h-[40vh] w-[45vw] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(40,160,150,0.12) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage:
              'radial-gradient(ellipse at 50% 40%, black 15%, transparent 70%)',
          }}
        />
      </div>

      <header className="signin-header relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <Link
          to="/"
          className="flex items-center gap-0.5 transition-opacity hover:opacity-80"
        >
          <img
            src="/logos/t1.png"
            alt=""
            className="h-8 w-auto object-contain sm:h-9"
          />
          <span
            className="text-xl font-bold tracking-tight text-white sm:text-2xl"
            style={{ fontFamily: '"Syne", sans-serif' }}
          >
            ekkzy
          </span>
        </Link>
        <Link
          to="/product"
          className="text-sm text-white/45 transition-colors hover:text-white/80"
        >
          Browse templates
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-10 pt-2 sm:px-6">
        <div
          ref={cardRef}
          className="relative w-full max-w-[420px] rounded-2xl border border-white/[0.09] bg-[#0c0e12]/92 p-7 shadow-[0_24px_80px_-28px_rgba(0,0,0,0.85)] backdrop-blur-md sm:p-8"
        >
          <div
            className="pointer-events-none absolute inset-x-8 top-0 h-px max-w-[calc(100%-4rem)]"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(90,170,240,0.5), transparent)',
            }}
            aria-hidden
          />

          <h1
            className="signin-stagger text-[1.75rem] font-bold tracking-tight text-white"
            style={{ fontFamily: '"Syne", sans-serif' }}
          >
            Welcome back
          </h1>
          <p className="signin-stagger mt-1.5 text-[0.9375rem] leading-relaxed text-white/45">
            Sign in to preview templates and edit your site.
          </p>

          {error ? (
            <div
              ref={errorRef}
              className="mt-5 rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSignIn} className="mt-6 flex flex-col gap-3.5">
            <div className="signin-stagger flex flex-col gap-1.5">
              <label
                htmlFor="signin-email"
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40"
              >
                Email
              </label>
              <div className="relative">
                <FaEnvelope
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
                  size={13}
                />
                <input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={busy}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.035] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/25 outline-none transition-[border-color,box-shadow,opacity] focus:border-[rgba(90,170,240,0.5)] focus:shadow-[0_0_0_3px_rgba(61,156,240,0.12)] disabled:opacity-55"
                />
              </div>
            </div>

            <div className="signin-stagger flex flex-col gap-1.5">
              <label
                htmlFor="signin-password"
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40"
              >
                Password
              </label>
              <div className="relative">
                <FaLock
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
                  size={13}
                />
                <input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={busy}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.035] py-2.5 pl-10 pr-11 text-sm text-white placeholder:text-white/25 outline-none transition-[border-color,box-shadow,opacity] focus:border-[rgba(90,170,240,0.5)] focus:shadow-[0_0_0_3px_rgba(61,156,240,0.12)] disabled:opacity-55"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  disabled={busy}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/35 transition-colors hover:text-white/70 disabled:opacity-40"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
              </div>
            </div>

            <button
              ref={submitBtnRef}
              type="submit"
              disabled={busy}
              aria-busy={loading || success}
              className="signin-stagger relative mt-1 flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-[#3d9cf0] py-2.5 text-sm font-semibold text-white transition-[filter,transform,opacity] hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:hover:brightness-100"
            >
              {(loading || success) && (
                <span
                  className="pointer-events-none absolute inset-0 overflow-hidden"
                  aria-hidden
                >
                  <span className="signin-btn-shimmer absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                </span>
              )}
              {loading ? (
                <>
                  <span
                    className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    aria-hidden
                  />
                  <span>Signing in…</span>
                </>
              ) : success ? (
                <>
                  <span
                    className="flex h-4 w-4 items-center justify-center"
                    aria-hidden
                  >
                    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
                      <path
                        d="M3.5 8.5 6.5 11.5 12.5 4.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span>Success</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>

          <div className="signin-stagger my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.08]" />
            <span className="text-[11px] uppercase tracking-[0.12em] text-white/28">
              or
            </span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            aria-busy={googleLoading}
            className="signin-stagger flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/[0.1] bg-white py-2.5 text-sm font-semibold text-gray-900 transition-[colors,opacity,transform] hover:bg-gray-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {googleLoading ? (
              <>
                <span
                  className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800"
                  aria-hidden
                />
                Connecting…
              </>
            ) : (
              <>
                <FaGoogle size={14} className="text-[#ea4335]" />
                Continue with Google
              </>
            )}
          </button>

          <p className="signin-stagger mt-5 text-center text-sm text-white/40">
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              state={location.state}
              className="font-semibold text-[#5eb0f7] transition-colors hover:text-[#8cc8fb]"
            >
              Sign up
            </Link>
          </p>
        </div>
      </main>

      <footer className="signin-footer relative z-10 px-5 pb-5 text-center text-[12px] text-white/25 sm:px-8">
        <Link to="/" className="transition-colors hover:text-white/50">
          ← Back to home
        </Link>
      </footer>

      <style>{`
        @keyframes signin-shimmer {
          0% { transform: translateX(0); }
          100% { transform: translateX(400%); }
        }
        .signin-btn-shimmer {
          animation: signin-shimmer 1.1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default SignIn;
