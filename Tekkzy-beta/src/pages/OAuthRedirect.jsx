import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hub } from 'aws-amplify/utils';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { useAuth } from '../context/AuthContext';

/**
 * /redirect — OAuth callback handler
 * User lands here after Google sign-in (started via signInWithRedirect).
 * We wait for Amplify to complete the code exchange (Hub event or session),
 * then sync auth state and redirect to /product.
 */
const OAuthRedirect = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const doneRef = useRef(false);

  const completeRedirect = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    refreshUser().then(() => {
      // Decide where to send the user after OAuth finishes.
      let targetPath = '/';
      try {
        const stored = localStorage.getItem('postLoginRedirect');
        if (stored && typeof stored === 'string' && stored.startsWith('/') && !stored.startsWith('/undefined')) {
          // Avoid redirect loops back to the OAuth callback itself.
          if (!stored.startsWith('/redirect')) {
            targetPath = stored;
          }
        }
        localStorage.removeItem('postLoginRedirect');
      } catch {
        // If localStorage is unavailable, fall back to home.
      }

      setTimeout(() => navigate(targetPath, { replace: true }), 0);
    });
  };

  useEffect(() => {
    // 1) Hub: Amplify fires these when OAuth code exchange completes
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signInWithRedirect' || payload.event === 'signedIn') {
        completeRedirect();
      }
      if (payload.event === 'signInWithRedirect_failure') {
        if (!doneRef.current) {
          doneRef.current = true;
          console.error('OAuth signInWithRedirect failed:', payload.data);
          navigate('/', { replace: true });
        }
      }
    });

    // 2) Fallback poll in case Hub fires before we subscribe or event name differs
    let attempts = 0;
    const maxAttempts = 40; // ~20 seconds
    const pollSession = async () => {
      if (doneRef.current) return;
      try {
        await fetchAuthSession();
        await getCurrentUser();
        completeRedirect();
      } catch {
        attempts++;
        if (attempts < maxAttempts) setTimeout(pollSession, 500);
        else if (!doneRef.current) {
          doneRef.current = true;
          console.error('OAuth session failed after retries');
          navigate('/', { replace: true });
        }
      }
    };
    pollSession();

    return () => unsubscribe();
  }, [navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">

      {/* Spinner */}
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />

      <p className="text-gray-400 text-sm">
        Completing sign-in…
      </p>

    </div>
  );
};

export default OAuthRedirect;