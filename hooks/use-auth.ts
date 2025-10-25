import { useAppSelector, useAppDispatch } from '../lib/store/hooks';
import { useRouter } from 'next/navigation';
import { logout, initializeAuth } from '../lib/store/slices/authSlice';
import { useLogoutMutation } from '../lib/store/api/authApi';
import { useEffect,useState } from 'react';
import { ROUTES } from '../lib/utils/constants';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const auth = useAppSelector((state) => state.auth);
  const [logoutMutation] = useLogoutMutation();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await dispatch(initializeAuth());
      setIsInitialized(true);
    };
    initialize();
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      if (auth.refreshToken) {
        await logoutMutation({ refresh_token: auth.refreshToken }).unwrap();
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      dispatch(logout());
      router.push(ROUTES.LOGIN);
    }
  };

  const requireAuth = () => {
    if (!auth.isAuthenticated) {
      router.push(ROUTES.LOGIN);
      return false;
    }
    return true;
  };

  const requireRole = (allowedRoles: string[]) => {
    if (!auth.isAuthenticated || !auth.user) {
      router.push(ROUTES.LOGIN);
      return false;
    }
    
    if (!allowedRoles.includes(auth.user.role)) {
      router.push(ROUTES.DASHBOARD);
      return false;
    }
    
    return true;
  };

  return {
    ...auth,
    isLoading: !isInitialized,
    logout: handleLogout,
    requireAuth,
    requireRole,
  };
};