import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-xl font-bold text-white">
                Form Builder
              </Link>
              <Link
                to="/"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
