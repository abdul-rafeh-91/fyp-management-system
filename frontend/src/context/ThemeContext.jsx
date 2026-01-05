import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const ThemeContext = createContext();
const AuthContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Helper function to get user from sessionStorage (without using useAuth hook)
const getUserFromStorage = () => {
  try {
    const storedUser = sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    return null;
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or default to 'light'
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  useEffect(() => {
    // Apply theme to document body
    document.body.className = theme;
    document.documentElement.className = theme;
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    
    // Update theme in backend if user is logged in
    const user = getUserFromStorage();
    if (user?.userId && user?.theme !== theme) {
      updateThemeInBackend(theme, user.userId);
    }
  }, [theme]);

  const updateThemeInBackend = async (newTheme, userId) => {
    if (!userId) return;
    
    try {
      await api.patch(`/users/${userId}/theme`, { theme: newTheme });
    } catch (error) {
      console.error('Failed to update theme in backend:', error);
    }
  };

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const setThemeMode = (mode) => {
    if (mode === 'light' || mode === 'dark') {
      setTheme(mode);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;

