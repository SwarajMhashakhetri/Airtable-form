import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/airtable/url');
      window.location.href = response.data.url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Form Builder
          </h1>
          <p className="text-gray-400">
            Create dynamic forms connected to Airtable
          </p>
        </div>

        <div className="card">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Redirecting...' : 'Login with Airtable'}
          </button>

          <p className="text-gray-500 text-sm text-center mt-4">
            You will be redirected to Airtable to authenticate
          </p>
        </div>
      </div>
    </div>
  );
}
