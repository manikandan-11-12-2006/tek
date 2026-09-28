/**
 * Checks if a user is currently logged in. (Now everyone has at least 'laa' access)
 * @returns {boolean} True if logged in
 */
export const checkLogin = () => {
  return true; // Everyone is automatically logged in
};

/**
 * Gets the current logged-in user's role.
 * @returns {string} The user role, 'admin' or 'laa' (default)
 */
export const getUserRole = () => {
  const role = localStorage.getItem('tekpower_user_role');
  return role === 'admin' ? 'admin' : 'laa';
};

/**
 * Validates credentials and logs the user in as admin.
 * @param {string} username 
 * @param {string} password 
 * @returns {boolean} True if login successful
 */
export const login = (username, password) => {
  // Accept anything to login as admin
  localStorage.setItem('tekpower_logged_in', 'true');
  localStorage.setItem('tekpower_user_role', 'admin');
  return true;
};

/**
 * Logs the user out (returns to 'laa' default access).
 */
export const logout = () => {
  localStorage.setItem('tekpower_user_role', 'laa');
};
