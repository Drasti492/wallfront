document.addEventListener("DOMContentLoaded", () => {
  const API = "https://wallback.onrender.com/api";
  const token = localStorage.getItem("token");
  if (!token) return window.location.href = "./login.html";

  let currentBalance = 0;
  const MIN_WITHDRAW_USD = 3000;

  function showToast(message, type="info", duration=5000) {
    const c = document.getElementById("toastContainer");
    const t = document.createElement("div");
    t.className = `toast ${type}`;
    t.textContent = message;
    c.appendChild(t);
    setTimeout(() => t.classList.add("show"), 50);
    setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => t.remove(), 400);
    }, duration);
  }

  fetch(`${API}/wallet/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(res => {
    if (res.status === 401) {
      localStorage.clear();
      location.href = "./login.html";
    }
    return res.json();
  })
  .then(data => {
    currentBalance = Number(data.walletBalance || 0);

    document.getElementById("balanceDisplay").textContent = `$${currentBalance.toFixed(2)}`;
    document.getElementById("depositAddress").textContent = data.walletAddress;
    document.getElementById("profileName").textContent = `Name: ${data.name}`;
    document.getElementById("profileEmail").textContent = `Email: ${data.email}`;
    document.getElementById("profileAddress").textContent = `Wallet Address: ${data.walletAddress}`;
    document.getElementById("profileBalance").textContent = `Balance: $${currentBalance.toFixed(2)}`;
    document.getElementById("withdrawAmount").placeholder = `Amount (Min $${MIN_WITHDRAW_USD}, Max $${currentBalance.toFixed(2)})`;

    document.getElementById("profileIcon").innerHTML = data.name ? data.name[0].toUpperCase() : "U";

    loadAssets();
    loadTransactions();
  })
  .catch(() => showToast("Failed to load wallet", "error"));

  const symbols = ["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT"];
  const names = { btc:"Bitcoin", eth:"Ethereum", bnb:"BNB", sol:"Solana" };
  const holdings = { btc:0.03, eth:0.4, bnb:5, sol:10 };

  async function loadAssets() {
    const list = document.getElementById("assetList");
    list.innerHTML = "";
    try {
      const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
      const prices = await res.json();

      symbols.forEach(sym => {
        const p = prices.find(x => x.symbol === sym);
        if (!p) return;
        const id = sym.replace("USDT","").toLowerCase();
        const value = holdings[id] * Number(p.lastPrice);

        list.innerHTML += `
          <li class="asset-item">
            <span>${names[id]}</span>
            <span>$${Number(p.lastPrice).toFixed(2)}</span>
            <span class="${p.priceChangePercent>=0?"positive":"negative"}">
              ${Number(p.priceChangePercent).toFixed(2)}%
            </span>
            <span>$${value.toFixed(2)}</span>
          </li>
        `;
      });
    } catch {}
  }

  async function loadTransactions() {
    try {
      const res = await fetch(`${API}/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const txs = await res.json();
      const list = document.getElementById("transactionList");
      list.innerHTML = "";

      txs.forEach(tx => {
        list.innerHTML += `
          <li class="transaction-item">
            <span>${tx.type.toUpperCase()}</span>
            <span>$${Number(tx.amount).toFixed(2)}</span>
            <span class="status ${tx.status}">${tx.status}</span>
          </li>
        `;
      });
    } catch {}
  }

  document.querySelectorAll(".nav-item").forEach(n => {
    n.onclick = () => {
      document.querySelectorAll(".nav-item").forEach(x => x.classList.remove("active"));
      document.querySelectorAll(".sections").forEach(s => s.classList.remove("active"));
      n.classList.add("active");
      document.getElementById(`${n.dataset.tab}Section`).classList.add("active");
    };
  });

  const profileIcon = document.getElementById("profileIcon");
  const logoutIcon = document.getElementById("logoutIcon");
  const profileModal = document.getElementById("profileModal");
  const closeProfile = document.getElementById("closeProfile");
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsModal = document.getElementById("settingsModal");
  const closeSettings = document.getElementById("closeSettings");

  profileIcon.onclick = () => profileModal.style.display = "flex";
  closeProfile.onclick = () => profileModal.style.display = "none";
  settingsBtn.onclick = () => settingsModal.style.display = "flex";
  closeSettings.onclick = () => settingsModal.style.display = "none";

  logoutIcon.onclick = () => {
    localStorage.clear();
    location.href = "./login.html";
  };

  const withdrawBtn = document.getElementById("withdrawBtn");
  const withdrawModal = document.getElementById("withdrawModal");
  const closeWithdraw = document.getElementById("closeWithdraw");
  const confirmWithdraw = document.getElementById("confirmWithdraw");
  const withdrawAmount = document.getElementById("withdrawAmount");
  const phoneNumber = document.getElementById("phoneNumber");
  const confirmDialog = document.getElementById("confirmDialog");
  const confirmMessage = document.getElementById("confirmMessage");
  const cancelConfirm = document.getElementById("cancelConfirm");
  const yesConfirm = document.getElementById("yesConfirm");
  const loadingOverlay = document.getElementById("loadingOverlay");

  withdrawBtn.onclick = () => withdrawModal.style.display = "flex";
  closeWithdraw.onclick = () => withdrawModal.style.display = "none";

  confirmWithdraw.onclick = () => {
    const amount = Number(withdrawAmount.value);
    const phone = phoneNumber.value.trim();

    if (!phone || amount < MIN_WITHDRAW_USD || amount > currentBalance) {
      showToast("Invalid withdrawal details", "error");
      return;
    }

    confirmMessage.innerHTML = `Withdraw <strong>$${amount.toFixed(2)}</strong> to ${phone}?`;
    confirmDialog.classList.add("active");
  };

  cancelConfirm.onclick = () => confirmDialog.classList.remove("active");

  yesConfirm.onclick = async () => {
    confirmDialog.classList.remove("active");
    loadingOverlay.classList.add("active");

    try {
      const res = await fetch(`${API}/wallet/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Number(withdrawAmount.value),
          phone: phoneNumber.value.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast("Withdrawal initiated. Check M-Pesa prompt.", "success", 7000);
      withdrawModal.style.display = "none";
      loadTransactions();

    } catch (e) {
      showToast(e.message || "Withdrawal failed", "error");
    } finally {
      loadingOverlay.classList.remove("active");
    }
  };

  const sendModal = document.getElementById("sendModal");
  const closeSend = document.getElementById("closeSend");

  document.getElementById("sendBtn").onclick = () => sendModal.style.display = "flex";
  closeSend.onclick = () => sendModal.style.display = "none";

  document.getElementById("confirmSend").onclick = () => {
    const addr = document.getElementById("sendAddress").value.trim();
    const amt = Number(document.getElementById("sendAmount").value);

    if (!addr || amt <= 0 || amt > currentBalance) {
      showToast("Invalid send details", "error");
      return;
    }

    showToast("Send feature is coming soon 🚧", "info", 6000);
    sendModal.style.display = "none";
  };

  const depositModal = document.getElementById("depositModal");
  const closeDeposit = document.getElementById("closeDeposit");

  document.getElementById("depositBtn").onclick = () => {
    depositModal.style.display = "flex";
    document.getElementById("depositAddress").textContent = document.getElementById("depositAddress").textContent || "Loading...";
  };

  closeDeposit.onclick = () => depositModal.style.display = "none";

  document.getElementById("copyDeposit").onclick = () => {
    const addr = document.getElementById("depositAddress").textContent;
    navigator.clipboard.writeText(addr);
    showToast("Deposit address copied", "success");
  };

  // Mobile Sidebar Toggle
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");

  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      if (window.innerWidth <= 900) {
        sidebar.classList.remove("open");
      }
    });
  });

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = "none";
    });
  });
});