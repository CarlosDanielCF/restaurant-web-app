import { IFormLogin, LoginResponseDto } from '@/models';
import { useRestaurantStore } from '@/pages/Private/Common/store/restaurantStore';
import { onLogin, onLogout } from '@/redux';
import { useMutation } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { RegisterUserDto } from '../dto/register-user.dto';
import { login, registerUser, renewToken } from '../services/auth.service';

/**
 * Hook for user registration (signup)
 * @version 2.0 - Migrated to React Query v5
 */
export const useSignup = () => {
  const { setRestaurant } = useRestaurantStore((state) => state);
  const dispatch = useDispatch();
  return useMutation<
    LoginResponseDto,
    { data: { message: string } },
    RegisterUserDto
  >({
    mutationFn: (data: RegisterUserDto) => registerUser(data),
    onSuccess: (data: LoginResponseDto) => {
      setRestaurant(data.currentRestaurant);
      dispatch(onLogin(data.user));
      localStorage.setItem('token', data.token);
      localStorage.setItem('token-init-date', String(new Date().getTime()));
    },
    onError: (error: { data: { message: string } }) => {
      console.log(error.data.message);
      enqueueSnackbar(error.data.message || 'Error al registrar el usuario', {
        variant: 'error'
      });
    }
  });
};

/**
 * Hook for user login
 * @version 2.0 - Migrated to React Query v5
 */
export const useLogin = () => {
  const { setRestaurant } = useRestaurantStore((state) => state);
  const dispatch = useDispatch();
  return useMutation<LoginResponseDto, unknown, IFormLogin>({
    mutationFn: (data: IFormLogin) => login(data),
    onSuccess: (data: LoginResponseDto) => {
      setRestaurant(data.currentRestaurant);

      const currentRole = data.user.restaurantRoles.find(
        (resRole) => resRole.restaurant.id === data.currentRestaurant?.id
      )!.role;

      dispatch(
        onLogin({
          ...data.user,
          role: currentRole
        })
      );
      localStorage.setItem('token', data.token);
      localStorage.setItem('token-init-date', String(new Date().getTime()));
    },
    onError: () => {
      dispatch(onLogout('Credenciales incorrectas'));
    }
  });
};

export const useRenewToken = () => {
  const dispatch = useDispatch();
  const { setRestaurant } = useRestaurantStore((state) => state);
  useEffect(() => {
    let running = false,
      disposed = false,
      established = false,
      lastRenewAt = 0;
    const renew = async (force = false) => {
      const previous = localStorage.getItem('token');
      if (!previous) {
        dispatch(onLogout(''));
        return;
      }
      if (running) return;
      if (!force && established) {
        try {
          const { exp } = JSON.parse(
            atob(previous.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
          );
          if (exp * 1000 - Date.now() > 5 * 60000) return;
        } catch {
          /* Validate malformed tokens with the server. */
        }
      }
      running = true;
      try {
        const data = await renewToken();
        // A late renewal must never restore a user who logged out or switched identity.
        if (disposed || localStorage.getItem('token') !== previous) return;
        localStorage.setItem('token', data.token);
        localStorage.setItem('token-init-date', String(Date.now()));
        setRestaurant(data.currentRestaurant);
        const currentRole =
          data.user.restaurantRoles.find(
            (r) => r.restaurant.id === data.currentRestaurant?.id
          )?.role || data.user.role;
        dispatch(onLogin({ ...data.user, role: currentRole }));
        established = true;
        lastRenewAt = Date.now();
        if (data.token !== previous)
          window.dispatchEvent(new Event('session-token-renewed'));
      } catch (e) {
        const status =
          (e as { status?: number; response?: { status?: number } }).status ||
          (e as { response?: { status?: number } }).response?.status;
        if (
          !disposed &&
          localStorage.getItem('token') === previous &&
          (status === 401 || status === 403)
        ) {
          localStorage.removeItem('token');
          dispatch(
            onLogout('La sesión ya no es válida. Inicia sesión nuevamente.')
          );
        }
        // Network failure is not credential revocation. Keep the token and current screen.
        if (
          !disposed &&
          localStorage.getItem('token') === previous &&
          status !== 401 &&
          status !== 403
        )
          window.dispatchEvent(new Event('session-check-failed'));
      } finally {
        running = false;
      }
    };
    const resume = () => {
      // Coalesce passive resume events, never explicit permission changes or retries.
      if (document.visibilityState === 'visible' && Date.now() - lastRenewAt >= 30000)
        void renew(true);
    };
    const permissions = () => void renew(true);
    void renew(true);
    const timer = setInterval(() => void renew(), 60000);
    window.addEventListener('online', resume);
    window.addEventListener('focus', resume);
    window.addEventListener('worker-access-changed', permissions);
    window.addEventListener('session-renew-request', permissions);
    document.addEventListener('visibilitychange', resume);
    return () => {
      disposed = true;
      clearInterval(timer);
      window.removeEventListener('online', resume);
      window.removeEventListener('focus', resume);
      window.removeEventListener('worker-access-changed', permissions);
      window.removeEventListener('session-renew-request', permissions);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [dispatch, setRestaurant]);
};
