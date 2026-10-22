import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signIn,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  getCurrentUser,
  fetchAuthSession,
  signInWithRedirect,
} from 'aws-amplify/auth';
// Ensure OAuth callback is handled when user returns from IdP (required for signInWithRedirect).
import 'aws-amplify/auth/enable-oauth-listener';
import { isOAuthConfigured } from '../config/amplifyConfig';

const AuthContext = createContext(null);

const GOOGLE_SIGNIN_SETUP_MESSAGE =
  'Google sign-in is not configured. Set VITE_APP_AUTH_DOMAIN_BETA and ' +
  'VITE_APP_AUTH_DOMAIN_PROD in your .env file, then restart the dev server. ' +
  'Also verify Google is enabled in Cognito and http://localhost:5173/redirect is ' +
  'listed as a callback URL on the app client.';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
    } catch {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('isAuthenticated');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (email, password) => {
    const result = await signIn({ username: email, password });
    await checkCurrentUser();
    return result;
  };

  const handleSignUp = async (email, password, name) => {
    const userAttributes = { email };
    if (name) {
      userAttributes.name = name;
    }

    const result = await signUp({
      username: email,
      password,
      options: { userAttributes },
    });
    return result;
  };

  const handleConfirmSignUp = async (email, code) => {
    const result = await confirmSignUp({ username: email, confirmationCode: code });
    return result;
  };

  const handleResendConfirmation = async (email) => {
    const result = await resendSignUpCode({ username: email });
    return result;
  };

  const handleGoogleSignIn = async () => {
    if (!isOAuthConfigured) {
      alert(GOOGLE_SIGNIN_SETUP_MESSAGE);
      return;
    }

    // Only set a post-login redirect target if one is not already present
    // or if the current page is an auth page (in which case we fall back to home).
    try {
      const existing = localStorage.getItem('postLoginRedirect');
      const currentPath =
        window.location.pathname +
        (window.location.search || '') +
        (window.location.hash || '');
      const isAuthPath = ['/signin', '/signup', '/redirect'].some((p) =>
        currentPath.startsWith(p)
      );

      if (!existing) {
        localStorage.setItem(
          'postLoginRedirect',
          isAuthPath ? '/' : currentPath
        );
      }
    } catch {
      // If accessing window/localStorage fails, just fall back to default behavior.
    }

    try {
      // Use Amplify's signInWithRedirect so the callback page can complete the OAuth flow.
      await signInWithRedirect({ provider: 'Google' });
    } catch (err) {
      console.error('Google sign-in failed:', err);
      alert(err?.message || 'Google sign-in failed. Please try again.');
    }
  };

  const clearLocalAuthStorage = () => {
    if (typeof window === 'undefined') return;

    const clientId =
      import.meta.env.VITE_USER_POOL_CLIENT_ID ||
      import.meta.env.VITE_COGNITO_CLIENT_ID ||
      '';

    const shouldRemove = (key) => {
      if (!key) return false;
      if (key.startsWith('CognitoIdentityServiceProvider.')) return true;
      if (key.startsWith('amplify-')) return true;
      if (clientId && key.includes(clientId)) return true;
      return false;
    };

    try {
      Object.keys(localStorage)
        .filter(shouldRemove)
        .forEach((key) => localStorage.removeItem(key));
      Object.keys(sessionStorage)
        .filter(shouldRemove)
        .forEach((key) => sessionStorage.removeItem(key));
    } catch {
      // ignore storage access errors
    }

    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('postLoginRedirect');
  };

  const handleSignOut = async () => {
    // Do not call Amplify's federated OAuth signOut here.
    // It redirects to Cognito /logout, which shows
    // "An error was encountered with the requested page" when
    // https://beta.tekkzy.com is missing from Allowed sign-out URLs.
    // Local clear is enough to sign the user out of Tekkzy.
    setUser(null);
    setIsAuthenticated(false);
    clearLocalAuthStorage();

    if (typeof window !== 'undefined') {
      window.location.assign('/');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        signIn: handleSignIn,
        signUp: handleSignUp,
          confirmSignUp: handleConfirmSignUp,
          resendConfirmation: handleResendConfirmation,
        signInWithGoogle: handleGoogleSignIn,
        signOut: handleSignOut,
        refreshUser: checkCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export default AuthContext;
