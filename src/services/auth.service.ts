import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
} from 'firebase/auth';
import { auth } from '../firebase/firebase';

/**
 * Firebase Authentication Service
 * 
 * Provides reusable authentication functions for the Trail Dungen game.
 * All functions are independent of Phaser scenes and can be imported anywhere.
 */

/**
 * Register a new user with email and password
 * 
 * @param email - User's email address
 * @param password - User's password (minimum 6 characters)
 * @returns Promise<UserCredential> - User credential object
 * @throws Error with user-friendly message if registration fails
 */
export async function registerWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    console.log('🔄 Registering user:', email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ Registration successful:', userCredential.user.email);
    return userCredential;
  } catch (error: any) {
    const errorMessage = getAuthErrorMessage(error);
    console.error('❌ Registration error:', errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Login an existing user with email and password
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise<UserCredential> - User credential object
 * @throws Error with user-friendly message if login fails
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    console.log('🔄 Logging in user:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Login successful:', userCredential.user.email);
    return userCredential;
  } catch (error: any) {
    const errorMessage = getAuthErrorMessage(error);
    console.error('❌ Login error:', errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Login with Google Sign-In using popup
 * 
 * @returns Promise<UserCredential> - User credential object
 * @throws Error with user-friendly message if Google sign-in fails
 */
export async function loginWithGoogle(): Promise<UserCredential> {
  try {
    const provider = new GoogleAuthProvider();
    
    // Add additional scopes if needed
    provider.addScope('profile');
    provider.addScope('email');
    
    // Set custom parameters
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    console.log('🔄 Attempting Google Sign-In...');
    const userCredential = await signInWithPopup(auth, provider);
    console.log('✅ Google Sign-In successful:', userCredential.user.email);
    return userCredential;
  } catch (error: any) {
    // Handle popup blocked or closed
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/popup-blocked') {
      const errorMessage = 'Sign-in popup was blocked or closed. Please try again.';
      console.error('❌ Google Sign-In error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    const errorMessage = getAuthErrorMessage(error);
    console.error('❌ Google Sign-In error:', errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Logout the current user
 * 
 * @returns Promise<void>
 * @throws Error if logout fails
 */
export async function logoutUser(): Promise<void> {
  try {
    console.log('🔄 Logging out user...');
    await signOut(auth);
    console.log('✅ Logout successful');
  } catch (error: any) {
    const errorMessage = getAuthErrorMessage(error);
    console.error('❌ Logout error:', errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Set up an authentication state listener
 * 
 * This function listens for changes in authentication state (login/logout).
 * The callback is called immediately with the current user, and then whenever
 * the auth state changes.
 * 
 * @param callback - Function called when auth state changes
 * @returns Unsubscribe function to stop listening
 * 
 * @example
 * ```typescript
 * const unsubscribe = onAuthStateChangedListener((user) => {
 *   if (user) {
 *     console.log('User is logged in:', user.email);
 *   } else {
 *     console.log('User is logged out');
 *   }
 * });
 * 
 * // Later, to stop listening:
 * unsubscribe();
 * ```
 */
export function onAuthStateChangedListener(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get the current authenticated user
 * 
 * @returns User | null - Current user if authenticated, null otherwise
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Check if a user is currently authenticated
 * 
 * @returns boolean - True if user is authenticated, false otherwise
 */
export function isUserAuthenticated(): boolean {
  return auth.currentUser !== null;
}

/**
 * Get user-friendly error messages from Firebase auth errors
 * 
 * @param error - Firebase error object
 * @returns string - User-friendly error message
 */
function getAuthErrorMessage(error: any): string {
  if (!error.code) {
    return error.message || 'An unexpected error occurred. Please try again.';
  }

  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please try logging in instead.';
    
    case 'auth/invalid-email':
      return 'Invalid email address. Please check and try again.';
    
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    
    case 'auth/user-not-found':
      return 'No account found with this email. Please register first.';
    
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Please contact support.';
    
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed. Please try again.';
    
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked. Please allow popups and try again.';
    
    case 'auth/requests-to-this-api-identitytoolkit-method-google.cloud.identitytoolkit.v1.AuthenticationService.SignUp are blocked':
    case 'auth/blocked':
      return 'Authentication service is temporarily unavailable. Please check:\n1. Identity Toolkit API is enabled in Google Cloud Console\n2. API key restrictions allow localhost\n3. Firebase project configuration is correct';
    
    case 'auth/invalid-api-key':
      return 'Invalid API key. Please check your Firebase configuration.';
    
    default:
      return error.message || `Authentication error: ${error.code}`;
  }
}