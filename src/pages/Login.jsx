import LoginForm from "../components/auth/LoginForm";

function Login({ onSwitchToRegister }) {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>DevConnect</h1>
          <p>Connect. Collaborate. Build.</p>
        </div>

        <LoginForm onSwitchToRegister={onSwitchToRegister} />
      </div>
    </main>
  );
}

export default Login;