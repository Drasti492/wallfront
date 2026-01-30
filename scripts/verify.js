const emailInput = document.getElementById("email");
emailInput.value = localStorage.getItem("userEmail") || "";

document.getElementById("verifyForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const code = document.getElementById("code").value.trim();
  const msg = document.getElementById("verifyMessage");

  const res = await fetch("https://wallback.onrender.com/api/auth/verify-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code })
  });

  const data = await res.json();
  msg.textContent = data.message;

  if (res.ok) {
    setTimeout(() => window.location.href = "login.html", 800);
  }
});

document.getElementById("resend").onclick = async () => {
  await fetch("https://wallback.onrender.com/api/auth/resend-verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: emailInput.value })
  });
};
