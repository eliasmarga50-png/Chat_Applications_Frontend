import RegisterForm from "../components/auth/RegisterForm";

function Register({ onSwitchToLogin }) {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>DevConnect</h1>
          <p>Join a community of developers.</p>
        </div>

        <RegisterForm onSwitchToLogin={onSwitchToLogin} />
      </div>
    </main>
  );
}

export default Register;