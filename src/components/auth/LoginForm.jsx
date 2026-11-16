import { useState } from "react";

import { useAuth } from "../../context/useAuth";

import {
  validateLogin,
} from "../../utils/validation";

function LoginForm({ onSwitchToRegister }) {
  const { login, loading } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: name === "username" ? value.toLowerCase() : value,
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: "",
    }));

    setServerError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setServerError("");

    const validationErrors = validateLogin(formData);

    const hasErrors = Object.values(validationErrors).some(
      (error) => error !== ""
    );

    if (hasErrors) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    try {
      await login({
        username: formData.username.trim(),
        password: formData.password,
      });

      // AuthContext stores the JWT and user session.
      // Step 4 will handle navigation after login.
    } catch (error) {
      setServerError(error.message);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-heading">
        <h2>Welcome back</h2>
        <p>Log in to continue to DevConnect.</p>
      </div>

      {serverError && (
        <div className="auth-error" role="alert">
          {serverError}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="login-username">Username</label>

        <input
          id="login-username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          placeholder="Your username"
          autoComplete="username"
          required
        />

        {errors.username && (
          <span className="field-error">{errors.username}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="login-password">Password</label>

        <input
          id="login-password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Your password"
          autoComplete="current-password"
          required
        />

        {errors.password && (
          <span className="field-error">{errors.password}</span>
        )}
      </div>

      <button
        type="submit"
        className="auth-submit"
        disabled={loading}
      >
        {loading ? "Logging in..." : "Log in"}
      </button>

      <p className="auth-switch">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          disabled={loading}
        >
          Register
        </button>
      </p>
    </form>
  );
}

export default LoginForm;