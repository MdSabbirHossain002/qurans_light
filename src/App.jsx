import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Moon, Sun, Languages } from 'lucide-react';
import Home from './pages/Home';
import Admin from './pages/Admin';

export default function App() {
  const [language, setLanguage] = useState('bn');
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      
      {/* Navbar - Light and Dark mode colors fixed */}
      <nav className="fixed w-full z-50 top-0 bg-white/90 dark:bg-black/80 backdrop-blur-md border-b border-gray-300 dark:border-gray-800 shadow-sm transition-colors duration-500">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-wide cursor-pointer">
            Quran's Light
          </div>
          
          <div className="flex items-center gap-4">
            {/* Language Toggle */}
            <button 
              onClick={() => setLanguage(l => l === 'bn' ? 'en' : 'bn')} 
              className="flex items-center gap-1 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition"
            >
              <Languages size={20} className="text-gray-700 dark:text-gray-300" />
              <span className="text-sm font-bold uppercase text-gray-700 dark:text-gray-300">
                {language}
              </span>
            </button>
            
            {/* Theme Toggle */}
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition"
            >
              {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-700" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home language={language} />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  );
}