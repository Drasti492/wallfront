document.getElementById("forgotForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const msg = document.getElementById("forgotMessage");

  const res = await fetch("https://wallback.onrender.com/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  msg.textContent = data.message;

  if (res.ok) {
    localStorage.setItem("resetEmail", email);
    setTimeout(() => window.location.href = "reset-password.html", 700);
  }
});

// ... your existing code ...

const button = document.querySelector('#forgotForm button[type="submit"]');
const originalText = button.textContent;

button.disabled = true;
button.textContent = "Sending code...";

// after fetch
if (!res.ok) {
  button.disabled = false;
  button.textContent = originalText;
}
// same for catch block