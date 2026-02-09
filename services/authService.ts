
import { User } from "../types";

const AUTH_KEY = 'nexus_auth_user';

export const authService = {
  // Simulated API call for Login with credential validation
  login: async (email: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simple mock validation
        if (email.includes('@') && password.length >= 6) {
          const user: User = {
            id: email === 'analyst@nexus.ai' ? 'usr_demo' : `usr_${Math.random().toString(36).substr(2, 5)}`,
            email,
            name: email.split('@')[0],
            plan: 'pro',
            preferences: {
              defaultDateFormat: 'YYYY-MM-DD',
              numberFormat: 'standard',
              autoCleaning: false,
              language: 'en-US'
            }
          };
          localStorage.setItem(AUTH_KEY, JSON.stringify(user));
          resolve(user);
        } else {
          reject(new Error('Invalid email or password (min 6 characters)'));
        }
      }, 1200);
    });
  },

  logout: () => {
    localStorage.removeItem(AUTH_KEY);
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data) : null;
  },

  updateProfile: async (user: User): Promise<User> => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
  }
};
