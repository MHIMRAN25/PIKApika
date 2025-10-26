const fs = require("fs-extra");
const path = require("path");
const bcrypt = require("bcrypt");

// ---------------- Config ----------------
// ডেটা ফাইলটি আপনার বোট ফোল্ডারে সেভ হবে
const DATA_FILE = path.join(__dirname, "bKashData.json"); 
const FEE_PERCENT = 1.5;
const MIN_FEE = 5;
const MAX_FEE = 10000;
const OWNER_UID = "100089926788317"; // আপনার UID দিন
const OWNER_NAME = "Imran";

// ---------------- Smart Cache ----------------
let dbCache = null;
let lastSave = 0;
const SAVE_INTERVAL = 1000 * 60 * 1; // 1 minute

function readAll() {
  if (!dbCache) {
    try {
      if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "{}");
      dbCache = JSON.parse(fs.readFileSync(DATA_FILE, "utf8") || "{}");
      // console.log("[Cache] Data loaded.");
    } catch (err) {
      console.error("[Cache] Load error:", err);
      dbCache = {};
    }
  }
  return dbCache;
}

function writeAll(obj, forceSave = false) {
  dbCache = obj;
  const now = Date.now();
  if (forceSave || now - lastSave > SAVE_INTERVAL) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(dbCache, null, 2), "utf8");
      lastSave = now;
      // console.log("[Cache] Data saved" + (forceSave ? " (Forced)." : "."));
    } catch (err) {
      console.error("[Cache] Save error:", err);
    }
  }
}

// Ensure final save on process exit
process.on("exit", () => {
  if (dbCache) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(dbCache, null, 2), "utf8");
      // console.log("[Cache] Final save done.");
    } catch (err) {
      console.error("[Cache] Exit save failed:", err);
    }
  }
});

// ---------------- Utilities ----------------
function computeFee(amount) {
  const raw = Math.ceil((amount * FEE_PERCENT) / 100);
  return Math.max(MIN_FEE, Math.min(MAX_FEE, raw));
}
function nowStr() {
  return new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}
function fmt(n) { return `${Number(n).toLocaleString('en-IN')} BDT`; } 
function makeTxnId() { return Math.random().toString(36).substring(2,10).toUpperCase(); }

// ---------------- PIN ----------------
async function setPIN(uid, pin) {
  const db = readAll();
  const hash = await bcrypt.hash(pin, 10);
  if (!db[uid]) db[uid] = {};
  db[uid].pinHash = hash;
  if (db[uid].balance === undefined) db[uid].balance = 0;
  if (db[uid].bank === undefined) db[uid].bank = 0;
  if (!db[uid].history) db[uid].history = [];
  writeAll(db, true); 
}
async function verifyPIN(uid, pin) {
  const db = readAll();
  if (!db[uid] || !db[uid].pinHash) return false;
  return bcrypt.compare(pin, db[uid].pinHash);
}
function hasPIN(uid) {
  const db = readAll();
  return !!(db[uid] && db[uid].pinHash);
}

// ---------------- User Data ----------------
function ensureUser(uid, name="User") {
  const db = readAll();
  if (!db[uid]) {
    db[uid] = { name, balance: 0, bank: 0, history: [] };
  }
  return db[uid];
}
function pushHistory(uid, text) {
  const db = readAll();
  if (!db[uid]) db[uid] = { balance: 0, bank: 0, history: [] };
  db[uid].history = db[uid].history || [];
  db[uid].history.unshift(`[${nowStr()}] ${text}`);
  db[uid].history = db[uid].history.slice(0,50);
}

// ---------------- Receipt Helper (Messaging Platform Compatible) ----------------
function receiptBox(title, lines=[], pin="<PIN>") {
  const safeLines = Array.isArray(lines)? lines.filter(l=>l && String(l).trim().length>0) : [];
  if(safeLines.length===0) safeLines.push("No details available");
  const lineSep = "──────────────────────────";
  
  // ১. টেক্সট কনটেন্ট তৈরি করা হলো
  const textContent = [title, lineSep, ...safeLines, lineSep].join("\n");

  // ২. কুইক রিপ্লাই বাটন অবজেক্ট তৈরি করা হলো
  const buttonData = {
    content_type: "text",
    title: "🔙 মেনুতে ফিরুন",
    payload: `.bkash ${pin}`
  };
  
  // ৩. ফ্রেমওয়ার্ক-এর জন্য প্রত্যাশিত অবজেক্ট রিটার্ন করা হলো
  return {
      body: textContent.trim() || "✅ Transaction completed",
      quickReply: [buttonData], 
  };
}

// ---------------- Command ----------------
module.exports = {
  config:{
    name: "bkash",
    version: "1.1",
    category: "💰 Economy",
    author: "Imran (Modified by AI)",
    shortDescription: "Offline bKash simulator.",
    longDescription: "Send Money, Cash Out, Mobile Recharge, Bank Deposit/Withdraw, Transaction History, Owner/Admin Panel."
  },

  onStart: async function({message, args, event}) { return; },

  run: async function({message, args, event}) {
    if(!message || !event) return console.error("Missing message/event object");
    const uid = String(event?.senderID || message?.senderID);
    const name = event?.senderName || message?.senderName || `User_${uid}`;
    
    const db = readAll();
    ensureUser(uid,name);
    ensureUser(OWNER_UID, OWNER_NAME);
    writeAll(db); 

    const body = event?.body || message?.text || message?.body || "";
    const tokens = typeof body==="string" && body.trim().length>0 ? body.trim().split(/\s+/) : (args||[]);

    try {
      // ---------------- PIN Setup ----------------
      if(!hasPIN(uid)){
        const pinCandidate = tokens[1] || tokens[0];
        if(!pinCandidate || !/^\d{4}$/.test(pinCandidate)){
          return await message.reply("🔐 আপনার ৪-সংখ্যার PIN সেট করুন: .bkash 1234");
        }
        await setPIN(uid,pinCandidate);
        const d = readAll();
        if(d[uid].balance===0){ 
            d[uid].balance=500; 
            writeAll(d, true); // ৫০০ টাকা বোনাস ব্যালেন্স সেট
        }
        return await message.reply("✅ PIN সফলভাবে সেট করা হয়েছে। মেনু খুলতে ব্যবহার করুন: `.bkash <PIN>`");
      }

      if(tokens.length<2) return await message.reply("🔐 আপনার ৪-সংখ্যার PIN দিন। উদাহরণ: .bkash 1234");

      const pin = tokens[1];
      if(!/^\d{4}$/.test(pin)) return await message.reply("❌ PIN অবশ্যই ৪-সংখ্যার হতে হবে।");
      const okPin = await verifyPIN(uid,pin);
      if(!okPin) return await message.reply("❌ ভুল PIN দেওয়া হয়েছে।");

      const userObj = db[uid];

      // ---------------- Menu ----------------
      if(tokens.length===2){
        const menuLines = [
          `💸 bKash মেনু — ${userObj.name}`,
          `💰 ব্যালেন্স: ${fmt(userObj.balance)}`,
          `🏦 ব্যাংক  : ${fmt(userObj.bank)}`,
          `1️⃣ টাকা পাঠান   → .bkash ${pin} 1 <UID> <পরিমাণ>`,
          `2️⃣ ক্যাশ আউট     → .bkash ${pin} 2 <পরিমাণ>`,
          `3️⃣ মোবাইল রিচার্জ→ .bkash ${pin} 3 <মোবাইল> <পরিমাণ>`,
          `4️⃣ ব্যালেন্স      → .bkash ${pin} 4`,
          `5️⃣ ব্যাংকে জমা   → .bkash ${pin} 5 <পরিমাণ>`,
          `6️⃣ ব্যাংক থেকে তুলুন→ .bkash ${pin} 6 <পরিমাণ>`,
          `7️⃣ PIN পরিবর্তন   → .bkash ${pin} 7 <নতুন PIN>`,
          `📜 ইতিহাস      → .bkash ${pin} history`,
          uid===OWNER_UID ? `👑 এডমিন → .bkash ${pin} admin` : ""
        ].filter(Boolean).join("\n");
        return await message.reply(menuLines);
      }

      // ---------------- Options ----------------
      const option = tokens[2]?.toLowerCase() || "";

      // --- Send Money (1) ---
      if(option==="1"||option==="send"){
        const receiver = tokens[3];
        const amount = Number(tokens[4]);
        if(!receiver || !/^\d+$/.test(receiver)) return await message.reply("❌ প্রাপকের UID দিন (শুধুমাত্র সংখ্যা)।");
        if(!amount||isNaN(amount)||amount<=0) return await message.reply("❌ টাকার পরিমাণ সঠিক নয়।");
        if(receiver===uid) return await message.reply("❌ নিজের কাছে টাকা পাঠানো যাবে না।");
        
        const fee = computeFee(amount);
        const total = amount+fee;
        if(userObj.balance<total) return await message.reply(`❌ যথেষ্ট ব্যালেন্স নেই (চার্জ সহ): ${fmt(total)}`);

        ensureUser(receiver,`User_${receiver}`);
        db[uid].balance-=total;
        db[receiver].balance=(db[receiver].balance||0)+amount;
        db[OWNER_UID].balance=(db[OWNER_UID].balance||0)+fee; 
        writeAll(db, true);

        const txn = makeTxnId();
        pushHistory(uid,`পাঠানো হয়েছে ${fmt(amount)} UID:${receiver} (চার্জ ${fmt(fee)}) Txn:${txn}`);
        pushHistory(receiver,`পেয়েছেন ${fmt(amount)} UID:${uid} Txn:${txn}`);

        const textSend = receiptBox("📱 টাকা পাঠানো সফল ✅",[
          `💳 প্রেরক   : ${userObj.name} (${uid})`,
          `👤 প্রাপক   : ${receiver}`,
          `💰 পরিমাণ  : ${fmt(amount)}`,
          `💸 চার্জ    : ${fmt(fee)}`,
          `🆔 ট্রানস্যাকশন আইডি: ${txn}`,
          `🗓 তারিখ   : ${nowStr()}`,
          `💳 বর্তমান ব্যালেন্স: ${fmt(db[uid].balance)}`
        ],pin);

        return await message.reply(textSend);
      }

      // --- Cash Out (2) ---
      if(option==="2"||option==="cash"){
        const amount = Number(tokens[3]);
        if(!amount||isNaN(amount)||amount<=0) return await message.reply("❌ টাকার পরিমাণ সঠিক নয়।");
        const fee = computeFee(amount);
        const total = amount+fee;
        if(userObj.balance<total) return await message.reply(`❌ যথেষ্ট ব্যালেন্স নেই (চার্জ সহ): ${fmt(total)}`);
        
        db[uid].balance-=total;
        db[OWNER_UID].balance=(db[OWNER_UID].balance||0)+fee; 
        writeAll(db, true);

        const txn = makeTxnId();
        pushHistory(uid,`ক্যাশ আউট ${fmt(amount)} (চার্জ ${fmt(fee)}) Txn:${txn}`);
        const textCash = receiptBox("💵 ক্যাশ আউট সফল ✅",[
          `💰 পরিমাণ  : ${fmt(amount)}`,
          `💸 চার্জ    : ${fmt(fee)}`,
          `🆔 ট্রানস্যাকশন আইডি: ${txn}`,
          `🗓 তারিখ   : ${nowStr()}`,
          `💳 ব্যালেন্স: ${fmt(db[uid].balance)}`
        ],pin);
        return await message.reply(textCash);
      }

      // --- Mobile Recharge (3) ---
      if(option==="3"||option==="recharge"){
        const mobile = tokens[3];
        const amount = Number(tokens[4]);
        if(!mobile || !/^\d{11}$/.test(mobile)) return await message.reply("❌ মোবাইল নম্বর সঠিক নয় (১১-সংখ্যার)।");
        if(!amount||isNaN(amount)||amount<=0) return await message.reply("❌ টাকার পরিমাণ সঠিক নয়।");
        const fee = computeFee(amount);
        const total = amount+fee;
        if(userObj.balance<total) return await message.reply(`❌ যথেষ্ট ব্যালেন্স নেই (চার্জ সহ): ${fmt(total)}`);
        
        db[uid].balance-=total;
        db[OWNER_UID].balance=(db[OWNER_UID].balance||0)+fee; 
        writeAll(db, true);

        const txn = makeTxnId();
        pushHistory(uid,`মোবাইল রিচার্জ ${mobile} ${fmt(amount)} (চার্জ ${fmt(fee)}) Txn:${txn}`);

        const textRecharge = receiptBox("📱 মোবাইল রিচার্জ সফল ✅",[
          `📱 মোবাইল : ${mobile}`,
          `💰 পরিমাণ : ${fmt(amount)}`,
          `💸 চার্জ   : ${fmt(fee)}`,
          `🆔 ট্রানস্যাকশন আইডি: ${txn}`,
          `🗓 তারিখ : ${nowStr()}`,
          `💳 ব্যালেন্স: ${fmt(db[uid].balance)}`
        ],pin);
        return await message.reply(textRecharge);
      }

      // --- Balance (4) ---
      if(option==="4"||option==="balance"){
        const textBalance = receiptBox("💰 আপনার ব্যালেন্স",[
          `💵 ক্যাশ : ${fmt(db[uid].balance)}`,
          `🏦 ব্যাংক : ${fmt(db[uid].bank)}`
        ],pin);
        return await message.reply(textBalance);
      }

      // --- Bank Deposit (5) ---
      if(option==="5"||option==="deposit"){
        const amount = Number(tokens[3]);
        if(!amount||isNaN(amount)||amount<=0) return await message.reply("❌ টাকার পরিমাণ সঠিক নয়।");
        if(userObj.balance<amount) return await message.reply("❌ জমা করার জন্য যথেষ্ট ক্যাশ নেই।");
        
        db[uid].balance-=amount;
        db[uid].bank+=amount;
        writeAll(db, true);
        const txn = makeTxnId();
        pushHistory(uid,`ব্যাংকে জমা ${fmt(amount)} Txn:${txn}`);
        const textDeposit = receiptBox("🏦 ব্যাংকে জমা সফল ✅",[
          `💵 পরিমাণ : ${fmt(amount)}`,
          `💳 ক্যাশ   : ${fmt(db[uid].balance)}`,
          `🏦 ব্যাংক   : ${fmt(db[uid].bank)}`,
          `🆔 ট্রানস্যাকশন আইডি: ${txn}`,
          `🗓 তারিখ   : ${nowStr()}`
        ],pin);
        return await message.reply(textDeposit);
      }

      // --- Bank Withdraw (6) ---
      if(option==="6"||option==="withdraw"){
        const amount = Number(tokens[3]);
        if(!amount||isNaN(amount)||amount<=0) return await message.reply("❌ টাকার পরিমাণ সঠিক নয়।");
        if(userObj.bank<amount) return await message.reply("❌ ব্যাংক ব্যালেন্স যথেষ্ট নয়।");
        
        db[uid].bank-=amount;
        db[uid].balance+=amount;
        writeAll(db, true);
        const txn = makeTxnId();
        pushHistory(uid,`ব্যাংক থেকে তোলা ${fmt(amount)} Txn:${txn}`);
        const textWithdraw = receiptBox("🏦 ব্যাংক থেকে তোলা সফল ✅",[
          `💵 পরিমাণ : ${fmt(amount)}`,
          `💳 ক্যাশ   : ${fmt(db[uid].balance)}`,
          `🏦 ব্যাংক   : ${fmt(db[uid].bank)}`,
          `🆔 ট্রানস্যাকশন আইডি: ${txn}`,
          `🗓 তারিখ   : ${nowStr()}`
        ],pin);
        return await message.reply(textWithdraw);
      }

      // --- Reset PIN (7) ---
      if(option==="7"||option==="reset"){
        const newPin = tokens[3];
        if(!newPin||!/^\d{4}$/.test(newPin)) return await message.reply("❌ নতুন PIN অবশ্যই ৪-সংখ্যার হতে হবে।");
        await setPIN(uid,newPin);
        return await message.reply("✅ PIN সফলভাবে পরিবর্তন হয়েছে। নতুন PIN ব্যবহার করুন।");
      }

      // --- History ---
      if(option==="history"){
        const hist = db[uid]?.history?.slice(0,10).join("\n")||"কোনো হিস্টরি নেই।";
        const textHist = receiptBox("📜 শেষ লেনদেনসমূহ",[hist],pin);
        return await message.reply(textHist);
      }

      // --- Admin / Owner Menu ---
      if(option==="admin"&&uid===OWNER_UID){
        const totalUsers = Object.keys(db).length;
        const totalBalance = Object.values(db).reduce((a,u)=>a+(u.balance||0)+(u.bank||0),0);
        const textAdmin = receiptBox("👑 এডমিন তথ্য",[
            `ইউজার সংখ্যা: ${totalUsers}`,
            `মোট ইউজার ফান্ড: ${fmt(totalBalance)}`,
            `bKash ফান্ডের ব্যালেন্স: ${fmt(db[OWNER_UID].balance)}`
        ],pin);
        return await message.reply(textAdmin);
      }

      // --- Default ---
      return await message.reply(receiptBox("❌ অবৈধ অপশন", ["ব্যবহার করুন: 1-send, 2-cash, 3-recharge, 4-balance, 5-deposit, 6-withdraw, 7-reset, বা history"], pin));

    } catch(e){
      console.error("bkash command error:",e);
      try{ await message.reply("❌ একটি ত্রুটি হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।"); }catch(err){console.error("Fallback message failed:",err);}
    }
  }
};
