/**
 * Checks if the admin is currently logged in.
 * @returns {boolean} True if logged in
 */
export const checkLogin = () => {
  return localStorage.getItem('tekpower_logged_in') === 'true';
};

/**
 * Validates admin credentials and logs the user in.
 * @param {string} username 
 * @param {string} password 
 * @returns {boolean} True if login successful
 */
export const login = (username, password) => {
  if (username === 'admin' && password === 'tekpower') {
    localStorage.setItem('tekpower_logged_in', 'true');
    return true;
  }
  return false;
};

/**
 * Logs the admin out by removing the storage flag.
 */
export const logout = () => {
  localStorage.removeItem('tekpower_logged_in');
};
