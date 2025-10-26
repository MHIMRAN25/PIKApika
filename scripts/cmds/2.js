const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "2",
    version: "3.5",
    author: "Imran | GoatBot v2 (Advanced bKash Edition)",
    description: "Offline bKash Simulator with real receipts & bot bank system",
    category: "💸 Economy",
    countDown: 10,
    role: 0
  },

  onStart: async function ({ args, message, event, api }) {
    const dataPath = path.join(__dirname, "bKashData.json");

    // ডাটাবেইস তৈরি না থাকলে নতুন করে বানাও
    if (!fs.existsSync(dataPath)) {
      fs.writeFileSync(dataPath, JSON.stringify({}), "utf8");
    }
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    const user = event.senderID;
    const userName = (await api.getUserInfo(user))[user].name;

    // বট ব্যাংক একাউন্ট তৈরি না থাকলে তৈরি করো
    const bankID = "BOT_BANK";
    if (!data[bankID]) {
      data[bankID] = {
        name: "bKash Bank Reserve",
        balance: 9999999,
        history: []
      };
    }

    // ইউজার একাউন্ট না থাকলে নতুন তৈরি
    if (!data[user]) {
      data[user] = {
        name: userName,
        balance: 1000,
        pin: "1234",
        history: []
      };
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    }

    const userData = data[user];
    const command = args[0]?.toLowerCase();
    const target = args[1];
    const amount = parseFloat(args[2]);

    function getTimeNow() {
      const now = new Date();
      return now.toLocaleString("en-BD", {
        timeZone: "Asia/Dhaka",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });
    }

    async function safeReply(text) {
      try {
        await message.reply(text);
      } catch (e) {
        console.log("Reply Error:", e);
      }
    }

    // ==================== RECEIPT BOX ==================== //
    function receiptBox(type, info) {
      const txn = "TXN" + Math.floor(1000000 + Math.random() * 9000000);
      const time = getTimeNow();
      const divider = "──────────────────────────────";

      if (type === "send") {
        return (
`📱 bKash
✅ Send Money Successful

👤 From: ${userData.name}
🎯 To: ${info.receiverName} (UID: ${info.receiverID})
💸 Amount: ${info.amount.toFixed(2)} BDT

${divider}
🆔 Transaction ID: ${txn}
⏰ ${time}
💰 Balance: ${userData.balance.toFixed(2)} BDT`
        );
      }

      if (type === "cashout") {
        return (
`🏧 bKash
✅ Cash Out Successful

👤 Agent UID: ${info.receiverID}
💵 Amount: ${info.amount.toFixed(2)} BDT
💰 Charge: ${info.charge.toFixed(2)} BDT

${divider}
🆔 Transaction ID: ${txn}
⏰ ${time}
💳 Balance: ${userData.balance.toFixed(2)} BDT`
        );
      }

      if (type === "recharge") {
        return (
`📶 bKash
✅ Mobile Recharge Successful

📱 Number: ${info.number}
💸 Amount: ${info.amount.toFixed(2)} BDT

${divider}
🆔 Transaction ID: ${txn}
⏰ ${time}
💳 Balance: ${userData.balance.toFixed(2)} BDT`
        );
      }

      if (type === "deposit") {
        return (
`🏦 bKash
✅ Deposit Successful

💰 Deposited To: bKash Bank Reserve
💸 Amount: ${info.amount.toFixed(2)} BDT

${divider}
🆔 Transaction ID: ${txn}
⏰ ${time}
💳 Balance: ${userData.balance.toFixed(2)} BDT`
        );
      }

      if (type === "withdraw") {
        return (
`🏦 bKash
✅ Withdraw Successful

💰 Withdraw From: bKash Bank Reserve
💸 Amount: ${info.amount.toFixed(2)} BDT

${divider}
🆔 Transaction ID: ${txn}
⏰ ${time}
💳 Balance: ${userData.balance.toFixed(2)} BDT`
        );
      }
    }

    // ==================== MAIN MENU ==================== //
    if (!command) {
      return safeReply(
`📱 bKash Main Menu

1️⃣ Send Money (UID)
2️⃣ Cash Out (Agent UID)
3️⃣ Mobile Recharge (Number)
4️⃣ Deposit (To Bank)
5️⃣ Withdraw (From Bank)
6️⃣ Reset PIN
7️⃣ History
8️⃣ Balance

💡 Example:
.bkash send 1000123456789 500
.bkash recharge 017XXXXXXXX 50`
      );
    }

    // ============= SEND MONEY =============
    if (command === "send") {
      if (!target || isNaN(amount))
        return safeReply("ব্যবহার: .bkash send <uid> <amount>");
      if (userData.balance < amount)
        return safeReply("❌ পর্যাপ্ত ব্যালান্স নেই।");

      if (!data[target]) {
        const userInfo = (await api.getUserInfo(target))[target];
        data[target] = {
          name: userInfo?.name || "Unknown User",
          balance: 1000,
          pin: "1234",
          history: []
        };
      }

      userData.balance -= amount;
      data[target].balance += amount;

      userData.history.push(`Sent ${amount} to ${data[target].name}`);
      data[target].history.push(`Received ${amount} from ${userData.name}`);

      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

      return safeReply(
        receiptBox("send", { receiverName: data[target].name, receiverID: target, amount })
      );
    }

    // ============= CASH OUT =============
    if (command === "cashout") {
      if (!target || isNaN(amount))
        return safeReply("ব্যবহার: .bkash cashout <agent_uid> <amount>");

      const charge = amount * 0.0185;
      const total = amount + charge;
      if (userData.balance < total)
        return safeReply("❌ পর্যাপ্ত ব্যালান্স নেই (চার্জসহ)।");

      userData.balance -= total;
      userData.history.push(`Cash Out ${amount} to Agent ${target}`);
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

      return safeReply(receiptBox("cashout", { receiverID: target, amount, charge }));
    }

    // ============= MOBILE RECHARGE =============
    if (command === "recharge") {
      if (!target || isNaN(amount))
        return safeReply("ব্যবহার: .bkash recharge <number> <amount>");
      if (userData.balance < amount)
        return safeReply("❌ পর্যাপ্ত ব্যালান্স নেই।");

      userData.balance -= amount;
      userData.history.push(`Recharged ${amount} to ${target}`);
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

      return safeReply(receiptBox("recharge", { number: target, amount }));
    }

    // ============= DEPOSIT =============
    if (command === "deposit") {
      if (isNaN(amount)) return safeReply("একটা সঠিক টাকা লিখুন।");
      userData.balance -= amount;
      data[bankID].balance += amount;
      userData.history.push(`Deposited ${amount} to Bank`);
      data[bankID].history.push(`Received ${amount} from ${userData.name}`);
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      return safeReply(receiptBox("deposit", { amount }));
    }

    // ============= WITHDRAW =============
    if (command === "withdraw") {
      if (isNaN(amount)) return safeReply("একটা সঠিক টাকা লিখুন।");
      if (data[bankID].balance < amount)
        return safeReply("❌ ব্যাংকে পর্যাপ্ত ব্যালান্স নেই।");

      userData.balance += amount;
      data[bankID].balance -= amount;
      userData.history.push(`Withdrew ${amount} from Bank`);
      data[bankID].history.push(`Sent ${amount} to ${userData.name}`);
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

      return safeReply(receiptBox("withdraw", { amount }));
    }

    // ============= RESET PIN =============
    if (command === "resetpin") {
      const newPin = Math.floor(1000 + Math.random() * 9000).toString();
      userData.pin = newPin;
      userData.history.push(`PIN Reset to ${newPin}`);
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      return safeReply(`🔐 আপনার নতুন PIN: ${newPin}`);
    }

    // ============= HISTORY =============
    if (command === "history") {
      if (userData.history.length === 0)
        return safeReply("📭 কোনো লেনদেনের ইতিহাস নেই।");
      return safeReply(
        "🕘 সাম্প্রতিক লেনদেনসমূহ:\n" + userData.history.slice(-10).reverse().join("\n")
      );
    }

    // ============= BALANCE =============
    if (command === "balance") {
      const emoji = userData.balance > 5000 ? "💰" : "📉";
      return safeReply(`${emoji} আপনার ব্যালান্স: ${userData.balance.toFixed(2)} BDT`);
    }

    return safeReply("❌ অকার্যকর কমান্ড। `.bkash` লিখে মেনু দেখুন।");
  }
};
