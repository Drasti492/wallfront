document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) return window.location.href = "./login.html";

  let currentBalance = 0;

  /* =========================
     FETCH WALLET
  ========================== */
  fetch("https://wallback.onrender.com/api/wallet/me", {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(async res => {
      if (res.status === 401 || res.status === 403) {
        localStorage.clear();
        window.location.href = "./login.html";
        return;
      }
      if (!res.ok) throw new Error("Wallet load failed");
      return res.json();
    })
    .then(data => {
      if (!data) return;

      currentBalance = Number(data.walletBalance || 0);

      document.querySelector(".balance").textContent = `$${currentBalance.toFixed(2)}`;
      document.querySelector(".wallet-address").textContent = data.walletAddress;
      document.querySelector("#profileAddress").textContent = data.walletAddress;
      document.querySelector("#withdrawAmount").placeholder =
        `Amount (Max: $${currentBalance.toFixed(2)})`;

      document.querySelector(".profile-icon").textContent = "U";

      loadAssets();
      loadTransactions();
    })
    .catch(err => {
      console.error(err);
      alert("Failed to load wallet. Try again.");
    });

  /* =========================
     BINANCE PRICES
  ========================== */
  const symbols = ['BNBUSDT','BTCUSDT','ETHUSDT','SOLUSDT','XRPUSDT','ADAUSDT','DOGEUSDT','TRXUSDT'];
  const nameMap = {
    bnb:'BNB', btc:'Bitcoin', eth:'Ethereum', sol:'Solana',
    xrp:'Ripple', ada:'Cardano', doge:'Dogecoin', trx:'TRON'
  };
  const mockHoldings = { bnb:5, btc:0.05, eth:0.4, sol:10, xrp:2000, ada:500, doge:5000, trx:10000 };

  async function fetchPrices() {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr`);
    return res.json();
  }

  async function loadAssets() {
    const list = document.getElementById("assetList");
    list.innerHTML = "";

    const prices = await fetchPrices();
    symbols.forEach(sym => {
      const coin = prices.find(p => p.symbol === sym);
      if (!coin) return;

      const id = sym.replace("USDT","").toLowerCase();
      const qty = mockHoldings[id] || 0;
      const price = Number(coin.lastPrice);
      const value = qty * price;
      const change = Number(coin.priceChangePercent);

      list.innerHTML += `
        <li class="asset-item">
          <span>${nameMap[id]} (${id.toUpperCase()})</span>
          <span>$${price.toFixed(2)}</span>
          <span class="${change >= 0 ? 'positive':'negative'}">${change.toFixed(2)}%</span>
          <span>$${value.toFixed(2)}</span>
        </li>
      `;
    });

    setTimeout(loadAssets, 60000);
  }

  /* =========================
     TRANSACTIONS
  ========================== */
  async function loadTransactions() {
    try {
      const res = await fetch("https://wallback.onrender.com/api/transactions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;

      const txs = await res.json();
      const list = document.getElementById("transactionList");
      list.innerHTML = "";

      txs.forEach(tx => {
  list.innerHTML += `
    <li class="transaction-item">
      <span class="type">${tx.type.toUpperCase()}</span>
      <span class="amount">$${tx.amount.toFixed(2)}</span>
      <span class="status ${tx.status}">${tx.status}</span>
    </li>
  `;
});
    } catch {}
  }


  /* =========================
   WITHDRAW (UX POLISHED)
========================== */
const withdrawBtn = document.getElementById("withdrawBtn");
const withdrawModal = document.getElementById("withdrawModal");
const closeWithdraw = document.getElementById("closeWithdraw");
const confirmWithdraw = document.getElementById("confirmWithdraw");

withdrawBtn.onclick = () => {
  withdrawModal.style.display = "flex";
};

closeWithdraw.onclick = () => {
  withdrawModal.style.display = "none";
};

confirmWithdraw.onclick = async () => {
  const amount = Number(document.getElementById("withdrawAmount").value);
  const phone = document.getElementById("phoneNumber").value.trim();

  if (!phone || isNaN(amount) || amount <= 0) {
    showToast("Enter valid withdrawal details", "error");
    return;
  }

  if (amount > currentBalance) {
    showToast("Insufficient wallet balance", "error");
    return;
  }

  confirmWithdraw.textContent = "Processing...";
  confirmWithdraw.disabled = true;

  try {
    const res = await fetch(
      "https://wallback.onrender.com/api/wallet/withdraw",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount, phone })
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    showToast(
      `Withdrawal of $${amount} initiated. Check your phone to confirm.`,
      "info",
      6000
    );

    withdrawModal.style.display = "none";

    // 🔑 PayHero STK Push
    if (data.checkoutUrl) {
      setTimeout(() => {
        window.location.href = data.checkoutUrl;
      }, 1500);
    }

  } catch (err) {
    showToast(err.message || "Withdrawal cancelled", "error");
  } finally {
    confirmWithdraw.textContent = "Confirm Withdraw";
    confirmWithdraw.disabled = false;
  }
};

  /* =========================
     LOGOUT
  ========================== */
  document.getElementById("logoutBtn").onclick = () => {
    localStorage.clear();
    window.location.href = "./login.html";
  };
});
