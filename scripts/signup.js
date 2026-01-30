document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;
  const message = document.getElementById("signupMessage");
  const button = form.querySelector('button[type="submit"]');
  button.textContent = "Creating Account...";
  button.disabled = true;

  const name = form.name.value.trim();
  const phone = form.phone.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const confirm = form.confirm.value;

  if (password !== confirm) {
    message.textContent = "Passwords do not match";
    button.textContent = "Create Account";
    button.disabled = false;
    return;
  }

  try {
    const res = await fetch("https://wallback.onrender.com/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, password })
    });

    const data = await res.json();
    message.textContent = data.message;

    if (res.ok) {
      localStorage.setItem("userEmail", email);
      setTimeout(() => window.location.href = "verify.html", 800);
    } else {
      button.textContent = "Create Account";
      button.disabled = false;
    }
  } catch {
    message.textContent = "Network error";
    button.textContent = "Create Account";
    button.disabled = false;
  }
});