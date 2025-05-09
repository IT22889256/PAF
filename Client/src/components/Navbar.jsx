import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gradient-to-r from-gray-50 to-gray-100 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-indigo-700 flex items-center space-x-2 transition-transform hover:scale-105">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#4B5EFC" />
            <path d="M2 17L12 22L22 17V7L12 12L2 7V17Z" fill="#364FC7" opacity="0.9" />
          </svg>
          <span>SkillShare</span>
        </Link>
        <div className="flex items-center space-x-6">
          {user ? (
            <button onClick={logout} className="text-red-600 text-sm">Logout</button>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-indigo-700 font-medium text-sm">Log in</Link>
              <Link to="/signup" className="bg-indigo-600 text-white px-4 py-1.5 rounded-full font-medium text-sm">Sign up</Link>
            </div>
          )}
        </div>
      </div>
      <div className="h-1 bg-indigo-600"></div>
    </nav>
  );
}
