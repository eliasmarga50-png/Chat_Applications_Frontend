export function validateUsername(username) {
  if (!username.trim()) {
    return "Username is required.";
  }

  if (username.length < 3 || username.length > 32) {
    return "Username must be between 3 and 32 characters.";
  }

  if (!/^[a-z0-9_]+$/.test(username)) {
    return "Username can only contain lowercase letters, numbers, and underscores.";
  }

  return "";
}

export function validateEmail(email) {
  if (!email.trim()) {
    return "Email is required.";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return "Please enter a valid email address.";
  }

  return "";
}

export function validatePassword(password) {
  if (!password) {
    return "Password is required.";
  }

  if (password.length < 8 || password.length > 128) {
    return "Password must be between 8 and 128 characters.";
  }

  return "";
}

export function validateRegistration(formData) {
  return {
    username: validateUsername(formData.username),
    email: validateEmail(formData.email),
    password: validatePassword(formData.password),
  };
}

export function validateLogin(formData) {
  return {
    username: validateUsername(formData.username),
    password: validatePassword(formData.password),
  };
}