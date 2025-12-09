import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError('Authentication failed');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!code || !state) {
        setError('No authorization code or state received');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        const response = await api.post('/auth/airtable/callback', {
          code,
          state
        });
        login(response.data.token, response.data.user);
        navigate('/');
      } catch (error: any) {
        setError(error.response?.data?.error || 'Authentication failed');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="card max-w-md w-full text-center">
        {error ? (
          <>
            <div className="text-red-500 mb-4">
              {error}
            </div>
            <p className="text-gray-400">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Authenticating...</p>
          </>
        )}
      </div>
    </div>
  );
}
