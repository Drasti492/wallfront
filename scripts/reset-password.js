document.getElementById("email").value =
  localStorage.getItem("resetEmail") || "";

document.getElementById("resetForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const code = document.getElementById("code").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("resetMessage");

  const res = await fetch("https://wallback.onrender.com/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, newPassword: password })
  });

  const data = await res.json();
  msg.textContent = data.message;

  if (res.ok) {
    setTimeout(() => window.location.href = "login.html", 700);
  }
});
