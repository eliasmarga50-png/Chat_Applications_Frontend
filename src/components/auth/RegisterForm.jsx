import { useState } from "react";

import { useAuth } from "../../context/useAuth";

import {
  validateRegistration,
} from "../../utils/validation";

function RegisterForm({ onSwitchToLogin }) {
  const { register, loading } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    displayName: "",
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

    // Clear the error for the field being edited.
    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: "",
    }));

    setServerError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setServerError("");

    const validationErrors = validateRegistration(formData);

    const hasErrors = Object.values(validationErrors).some(
      (error) => error !== ""
    );

    if (hasErrors) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    try {
      await register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        displayName: formData.displayName.trim(),
        password: formData.password,
      });

      // AuthContext stores the JWT and user session.
      // Navigation will be implemented in Step 4.
    } catch (error) {
      setServerError(error.message);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-heading">
        <h2>Create your DevConnect account</h2>
        <p>Join the developer community.</p>
      </div>

      {serverError && (
        <div className="auth-error" role="alert">
          {serverError}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="displayName">Display name</label>

        <input
          id="displayName"
          name="displayName"
          type="text"
          value={formData.displayName}
          onChange={handleChange}
          placeholder="Ada Lovelace"
          autoComplete="name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="register-username">Username</label>

        <input
          id="register-username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          placeholder="ada_lovelace"
          autoComplete="username"
          required
        />

        {errors.username && (
          <span className="field-error">{errors.username}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="register-email">Email</label>

        <input
          id="register-email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="ada@example.com"
          autoComplete="email"
          required
        />

        {errors.email && (
          <span className="field-error">{errors.email}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="register-password">Password</label>

        <input
          id="register-password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="At least 8 characters"
          autoComplete="new-password"
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
        {loading ? "Creating account..." : "Create account"}
      </button>

      <p className="auth-switch">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          disabled={loading}
        >
          Log in
        </button>
      </p>
    </form>
  );
}

export default RegisterForm;