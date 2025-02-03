/**
 * Login Component
 *
 * This component renders a simple login form that accepts a username and password.
 * When the form is submitted, it sends a POST request to the /login endpoint of the API.
 * If the login is successful, it calls the onLoginSuccess callback (provided via props)
 * with the response data (which may include a token or a success message).
 * If the login fails, an error message is displayed.
 *
 * Props:
 *   - onLoginSuccess: A callback function to be called when login is successful.
 */

import React, { useState } from 'react';

const Login = ({ onLoginSuccess }) => {
  // Local state for username, password, and any error message.
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  /**
   * handleLogin - Handles the login form submission.
   *
   * This asynchronous function prevents the default form submission,
   * sends a POST request to the /login endpoint with the username and password,
   * and then processes the response:
   *   - If the response is not OK, it extracts and displays the error message.
   *   - If the login is successful, it calls the onLoginSuccess callback with the response data.
   *
   * @param {Event} e - The form submission event.
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(''); // Clear any existing error message

    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        // If login fails, extract error details and update errorMsg.
        const errorData = await response.json();
        setErrorMsg(errorData.detail || 'Login failed');
      } else {
        // If login succeeds, parse the JSON response and call onLoginSuccess.
        const data = await response.json();
        onLoginSuccess(data);
      }
    } catch (error) {
      // Log the error and set a generic error message.
      console.error('Login error:', error);
      setErrorMsg('An error occurred. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />
        </div>
        {/* Display an error message if one exists */}
        {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
