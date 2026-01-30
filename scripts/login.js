const form = document.getElementById("loginForm");
const message = document.getElementById("loginMessage");
const button = form.querySelector('button[type="submit"]');
const originalButtonText = button.textContent;

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = form.querySelector("#email").value.trim();
  const password = form.querySelector("#password").value.trim();

  if (!email || !password) {
    message.textContent = "Please enter email and password";
    message.classList.add("error");
    return;
  }

  button.disabled = true;
  button.textContent = "Logging in...";
  message.textContent = "";

  try {
    const res = await fetch("https://wallback.onrender.com/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      message.textContent = data.message || "Login failed";
      message.classList.add("error");
      button.disabled = false;
      button.textContent = originalButtonText;
      return;
    }

    localStorage.setItem("token", data.token);
    message.textContent = "Login successful!";
    message.classList.add("success");

    setTimeout(() => window.location.href = "./wallet.html", 800);

  } catch (err) {
    message.textContent = "Something went wrong. Try again.";
    message.classList.add("error");
    button.disabled = false;
    button.textContent = originalButtonText;
  }
});