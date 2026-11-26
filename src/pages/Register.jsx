
import { Link } from "react-router-dom";

import RegisterForm from "../components/auth/RegisterForm";

function Register() {
  return (
    <main id="main-content" className="auth-page" tabIndex={-1}>
      <div className="auth-card">
        <div className="auth-brand">
          <h1>DevConnect</h1>
          <p>Join a community of developers.</p>
        </div>

        <RegisterForm />

        <p className="auth-switch">
          Already have an account?{" "}
          <Link to="/login">Log in</Link>
        </p>
      </div>
    </main>
  );
}

export default Register;
