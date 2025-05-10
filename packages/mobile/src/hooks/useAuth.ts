// packages/mobile/src/hooks/useAuth.ts
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login, register, logout, loadUser, clearErrors } from '../store/slices/authSlice';
import { LoginCredentials, RegisterData } from '../types/auth';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, token, isLoading, error, isAuthenticated } = useAppSelector(state => state.auth);

  const loginUser = (credentials: LoginCredentials) => {
    return dispatch(login(credentials));
  };

  const registerUser = (userData: RegisterData) => {
    return dispatch(register(userData));
  };

  const logoutUser = () => {
    return dispatch(logout());
  };

  const loadUserData = () => {
    return dispatch(loadUser());
  };

  const clearAuthErrors = () => {
    dispatch(clearErrors());
  };

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    loginUser,
    registerUser,
    logoutUser,
    loadUserData,
    clearAuthErrors,
  };
};