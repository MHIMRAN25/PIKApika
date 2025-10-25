const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pair10",
    author: "ɪᴍʀᴀɴ",
    role: 0,
    shortDescription: "Love Pair Photo Generator",
    longDescription: "Creates a random love match photo in the group 💞",
    category: "love",
    guide: "{pn}"
  },

  onStart: async function ({ api, event }) {
    try {
      api.setMessageReaction("💘", event.messageID, () => {}, true);

      const cache = path.join(__dirname, "cache");
      if (!fs.existsSync(cache)) fs.mkdirSync(cache);

      const pathImg = path.join(cache, "pair_bg.png");
      const pathAvt1 = path.join(cache, "avt1.png");
      const pathAvt2 = path.join(cache, "avt2.png");

      const id1 = event.senderID;
      const threadInfo = await api.getThreadInfo(event.threadID);
      const all = threadInfo.userInfo;
      const botID = api.getCurrentUserID();

      let gender1;
      for (const u of all) if (u.id == id1) gender1 = u.gender;

      let candidates = all.filter(
        (u) =>
          u.id !== id1 &&
          u.id !== botID &&
          u.gender &&
          gender1 &&
          u.gender !== gender1
      );

      if (candidates.length === 0) {
        candidates = all.filter((u) => u.id !== id1 && u.id !== botID);
        if (candidates.length === 0)
          return api.sendMessage(
            "😅 Sorry! No suitable person found for pairing.",
            event.threadID,
            event.messageID
          );
      }

      const id2 = candidates[Math.floor(Math.random() * candidates.length)].id;
      const name1 = all.find((u) => u.id === id1)?.name || "Unknown";
      const name2 = all.find((u) => u.id === id2)?.name || "Unknown";

      const bgUrl = "https://i.postimg.cc/cLzjPg8W/fdb70a57a84df74c5118d1ab5541d745.jpg";

      const [avt1Res, avt2Res, bgRes] = await Promise.all([
        axios.get(
          `https://graph.facebook.com/${id1}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          { responseType: "arraybuffer" }
        ),
        axios.get(
          `https://graph.facebook.com/${id2}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          { responseType: "arraybuffer" }
        ),
        axios.get(bgUrl, { responseType: "arraybuffer" })
      ]);

      await Promise.all([
        fs.writeFile(pathAvt1, avt1Res.data),
        fs.writeFile(pathAvt2, avt2Res.data),
        fs.writeFile(pathImg, bgRes.data)
      ]);

      const baseImage = await loadImage(pathImg);
      const img1 = await loadImage(pathAvt1);
      const img2 = await loadImage(pathAvt2);
      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

      function drawCircleImage(ctx, img, x, y, w, h) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, w, h);
        ctx.restore();
      }

      drawCircleImage(ctx, img1, 138, 128, 143, 142);
      drawCircleImage(ctx, img2, 433, 130, 142, 142);

      // ✨ Romantic font + soft color
      ctx.font = "bold 38px 'Brush Script MT'";
      ctx.fillStyle = "#ffb6c1";
      ctx.textAlign = "center";
      ctx.fillText(name1, 207, 343);
      ctx.fillText(name2, 509, 343);

      const rate = Math.floor(Math.random() * 100);
      ctx.font = "bold 32px 'Comic Sans MS'";
      ctx.fillStyle = "#ff80bf";
      ctx.fillText(`💞 Love Match: ${rate}% 💞`, canvas.width / 2, 430);

      const finalBuffer = canvas.toBuffer();
      const finalPath = path.join(cache, `pair_${Date.now()}.png`);
      fs.writeFileSync(finalPath, finalBuffer);

      await Promise.all([fs.remove(pathAvt1), fs.remove(pathAvt2)]);

      // 💬 Tag both users instead of just writing names
      const msg = {
        body: `💘 A new pair has been made!\n❤️ @${name1} 💞 @${name2}\nChance of love: ${rate}%`,
        mentions: [
          { tag: `@${name1}`, id: id1 },
          { tag: `@${name2}`, id: id2 }
        ],
        attachment: fs.createReadStream(finalPath)
      };

      return api.sendMessage(
        msg,
        event.threadID,
        () => fs.unlinkSync(finalPath),
        event.messageID
      );
    } catch (err) {
      console.error(err);
      return api.sendMessage(
        "❌ Error occurred while generating the love photo.",
        event.threadID,
        event.messageID
      );
    }
  }
};
