// ===============================
// File: news.js
// Author: M H IMRAN
// Description: Funny meme generator with Breaking News time text
// ===============================

const Canvas = require("canvas");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "news",
    version: "2.3",
    author: "M H IMRAN",
    countDown: 5,
    role: 2,
    shortDescription: "Funny Breaking News meme generator",
    longDescription: "Generate a funny meme using user avatars with Breaking News time text",
    category: "fun",
    guide: {
      en: "{pn} (for yourself) or {pn} @tag / reply (for others)"
    }
  },

  onStart: async function ({ event, message, usersData, api }) {
    let pathSave;
    try {
      // 🎨 Random background list
      const bgList = [
        "https://i.postimg.cc/g2D2yTcR/Picsart-25-11-12-15-33-00-690.jpg",
        "https://i.postimg.cc/dtRsvxym/Picsart-25-11-12-14-50-15-175.jpg"
      ];
      const bgURL = bgList[Math.floor(Math.random() * bgList.length)];
      const bg = await Canvas.loadImage(bgURL);

      let uid;

      // 🧍 Target user (tag/reply/self)
      if (Object.keys(event.mentions).length > 0) {
        uid = Object.keys(event.mentions)[0];
      } else if (event.messageReply) {
        uid = event.messageReply.senderID;
      } else {
        uid = event.senderID;
      }

      // 🧑 Avatar load
      const avatarURL = await usersData.getAvatarUrl(uid);
      const avatar = await Canvas.loadImage(avatarURL);

      // 🖼️ Canvas setup
      const canvas = Canvas.createCanvas(540, 758);
      const ctx = canvas.getContext("2d");

      // Draw background
      ctx.drawImage(bg, 0, 2, 540, 758);

      // Avatar (square, no circle)
      const avatarX = 150;
      const avatarY = 150;
      const avatarW = 240;
      const avatarH = 240;
      ctx.drawImage(avatar, avatarX, avatarY, avatarW, avatarH);

      // 🕒 Current time
      const now = new Date();
      const timeString = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });

      // 📝 Text styling
      ctx.font = "bold 28px Arial";
      ctx.fillStyle = "#ff0000";
      ctx.textAlign = "center";
      ctx.fillText(`Breaking News ${timeString}`, canvas.width / 2, canvas.height - 40);

      // 💾 Save file
      fs.ensureDirSync(`${__dirname}/tmp`);
      pathSave = `${__dirname}/tmp/${uid}_news.png`;
      fs.writeFileSync(pathSave, canvas.toBuffer());

      // 📩 Send message
      const sent = await message.reply({
        body: `📰 Breaking News Update — ${timeString}`,
        attachment: fs.createReadStream(pathSave)
      });

      if (sent && sent.messageID) {
        api.setMessageReaction("📰", sent.messageID, () => {}, true);
      }

    } catch (err) {
      console.error(err);
      message.reply("⚠️ Error: " + err.message);
    } finally {
      if (pathSave && await fs.pathExists(pathSave)) {
        await fs.remove(pathSave);
      }
    }
  }
};
