import { Link } from "react-router-dom";

import LoginForm from "../components/auth/LoginForm";

function Login() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>DevConnect</h1>
          <p>Connect. Collaborate. Build.</p>
        </div>

        <LoginForm />

        <p className="auth-switch">
          Don't have an account?{" "}
          <Link to="/register">Register</Link>
        </p>
      </div>
    </main>
  );
}

export default Login;