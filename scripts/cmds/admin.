const { writeFileSync, readFileSync, existsSync } = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "admin",
        version: "1.2",
        author: "MH-BOT TEAM",
        role: 2,
        shortDescription: {
            en: "Manage group admins",
            bn: "গ্রুপ এডমিন নিয়ন্ত্রণ",
            vi: "Quản lý quản trị viên nhóm",
            hi: "ग्रुप एडमिन प्रबंधित करें",
            ur: "گروپ ایڈمنز کا انتظام کریں"
        },
        longDescription: {
            en: "Add, remove, view group admin list",
            bn: "গ্রুপ এডমিন যুক্ত/বহিষ্কার এবং তালিকা দেখুন",
            vi: "Thêm, xóa, xem danh sách quản trị viên nhóm",
            hi: "ग्रुप एडमिन जोड़ें, हटाएं और सूची देखें",
            ur: "گروپ ایڈمن شامل/ہٹائیں اور فہرست دیکھیں"
        },
        category: "box chat",
        guide: {
            en: "{pn} [add | -a] <uid | @tag>\n{pn} [remove | -r] <uid | @tag>\n{pn} [list | -l]",
            bn: "{pn} [add | -a] <uid | @tag>\n{pn} [remove | -r] <uid | @tag>\n{pn} [list | -l]"
        }
    },

    langs: {
        en: {
            added: "✅ | Added group admin role for %1 users:\n%2",
            alreadyAdmin: "\n⚠️ | %1 users already group admin:\n%2",
            missingIdAdd: "⚠️ | Please enter ID or tag user to add group admin",
            removed: "✅ | Removed group admin role of %1 users:\n%2",
            notAdmin: "⚠️ | %1 users are not group admin:\n%2",
            missingIdRemove: "⚠️ | Please enter ID or tag user to remove group admin",
            listAdmin: "📋 | List of group admins:\n%1",
            cannotRemoveSelf: "⛔ | You cannot remove your own group admin role",
            cannotRemoveCreator: "⛔ | Cannot remove thread creator from admin",
            notifyAdd: "🎉 | You are now a group admin",
            notifyRemove: "⚠️ | You are no longer suitable to be a group admin"
        },
        bn: {
            added: "✅ | %1 জন ব্যবহারকারীর জন্য গ্রুপ এডমিন যুক্ত হয়েছে:\n%2",
            alreadyAdmin: "\n⚠️ | %1 জন ব্যবহারকারীর আগে থেকেই গ্রুপ এডমিন:\n%2",
            missingIdAdd: "⚠️ | দয়া করে ID বা ব্যবহারকারী tag দিন যাতে গ্রুপ এডমিন যুক্ত করা যায়",
            removed: "✅ | %1 জন ব্যবহারকারীর গ্রুপ এডমিন পদ বহিষ্কার করা হয়েছে:\n%2",
            notAdmin: "⚠️ | %1 জন ব্যবহারকারীর গ্রুপ এডমিন নেই:\n%2",
            missingIdRemove: "⚠️ | দয়া করে ID বা ব্যবহারকারী tag দিন যাতে গ্রুপ এডমিন remove করা যায়",
            listAdmin: "📋 | গ্রুপ এডমিন তালিকা:\n%1",
            cannotRemoveSelf: "⛔ | আপনি নিজের গ্রুপ এডমিন পদ মুছে ফেলতে পারবেন না",
            cannotRemoveCreator: "⛔ | Thread Creator কে remove করা যাবে না",
            notifyAdd: "🎉 | আপনি এখন গ্রুপ এডমিন",
            notifyRemove: "⚠️ | আপনি গ্রুপ এডমিন হওয়ার উপযুক্ত নন"
        },
        vi: {
            added: "✅ | Đã thêm quyền quản trị viên nhóm cho %1 người dùng:\n%2",
            alreadyAdmin: "\n⚠️ | %1 người dùng đã là quản trị viên nhóm:\n%2",
            missingIdAdd: "⚠️ | Vui lòng nhập ID hoặc tag người dùng để thêm quản trị viên nhóm",
            removed: "✅ | Đã xóa quyền quản trị viên nhóm của %1 người dùng:\n%2",
            notAdmin: "⚠️ | %1 người dùng không phải quản trị viên nhóm:\n%2",
            missingIdRemove: "⚠️ | Vui lòng nhập ID hoặc tag người dùng để xóa quản trị viên nhóm",
            listAdmin: "📋 | Danh sách quản trị viên nhóm:\n%1",
            cannotRemoveSelf: "⛔ | Bạn không thể xóa quyền quản trị viên nhóm của chính mình",
            cannotRemoveCreator: "⛔ | Không thể xóa người tạo nhóm khỏi quản trị viên",
            notifyAdd: "🎉 | Bạn hiện là quản trị viên nhóm",
            notifyRemove: "⚠️ | Bạn không còn đủ tư cách làm quản trị viên nhóm"
        },
        hi: {
            added: "✅ | %1 उपयोगकर्ताओं को ग्रुप एडमिन बनाया गया:\n%2",
            alreadyAdmin: "\n⚠️ | %1 उपयोगकर्ताओं के पास पहले से ही ग्रुप एडमिन है:\n%2",
            missingIdAdd: "⚠️ | कृपया ID या उपयोगकर्ता tag दें",
            removed: "✅ | %1 उपयोगकर्ताओं का ग्रुप एडमिन हटा दिया गया:\n%2",
            notAdmin: "⚠️ | %1 उपयोगकर्ता ग्रुप एडमिन नहीं हैं:\n%2",
            missingIdRemove: "⚠️ | कृपया ID या उपयोगकर्ता tag दें",
            listAdmin: "📋 | ग्रुप एडमिन सूची:\n%1",
            cannotRemoveSelf: "⛔ | आप अपना ग्रुप एडमিন नहीं हटा सकते",
            cannotRemoveCreator: "⛔ | Thread Creator को remove नहीं किया जा सकता",
            notifyAdd: "🎉 | आप अब ग्रुप एडमिन हैं",
            notifyRemove: "⚠️ | आप अब ग्रुप एडमिन होने योग्य नहीं हैं"
        },
        ur: {
            added: "✅ | %1 صارفین کو گروپ ایڈمن بنایا گیا:\n%2",
            alreadyAdmin: "\n⚠️ | %1 صارفین پہلے ہی گروپ ایڈمن ہیں:\n%2",
            missingIdAdd: "⚠️ | براہ کرم ID یا صارف کا tag دیں تاکہ گروپ ایڈمن شامل کیا جا سکے",
            removed: "✅ | %1 صارفین کا گروپ ایڈمن ہٹا دیا گیا:\n%2",
            notAdmin: "⚠️ | %1 صارفین گروپ ایڈمن نہیں ہیں:\n%2",
            missingIdRemove: "⚠️ | براہ کرم ID یا صارف کا tag دیں تاکہ گروپ ایڈمن remove کیا جا سکے",
            listAdmin: "📋 | گروپ ایڈمن فہرست:\n%1",
            cannotRemoveSelf: "⛔ | آپ اپنا گروپ ایڈمن نہیں ہٹا سکتے",
            cannotRemoveCreator: "⛔ | Thread Creator کو remove نہیں کیا جا سکتا",
            notifyAdd: "🎉 | آپ اب گروپ ایڈمن ہیں",
            notifyRemove: "⚠️ | آپ اب گروپ ایڈمن ہونے کے اہل نہیں ہیں"
        }
    },

    onStart: async function({ event, args, message, usersData, getLang }) {
        const threadID = event.threadID;
        const dataPath = path.join(global.client.dirConfig, "threadData.json");
        let threadData = existsSync(dataPath) ? JSON.parse(readFileSync(dataPath, "utf8")) : {};
        if (!threadData[threadID]) threadData[threadID] = { admins: [] };

        const isThreadAdmin = () => {
            const admins = threadData[threadID]?.admins || [];
            const botAdmins = config.adminBot || [];
            const ownerIds = config.ADMIN_IDS || [];
            return ownerIds.includes(event.senderID) || botAdmins.includes(event.senderID) || admins.includes(event.senderID);
        };

        if (!isThreadAdmin()) return message.reply("⛔ | আপনার এই কমান্ড চালানোর অনুমতি নেই");

        const getTargetUids = () => {
            if (event.mentions && Object.keys(event.mentions).length) return Object.keys(event.mentions);
            if (event.messageReply) return [event.messageReply.senderID];
            return args.slice(1).filter(arg => !isNaN(arg));
        };

        const saveData = () => writeFileSync(dataPath, JSON.stringify(threadData, null, 2));
        const sendNamesList = async uids => await Promise.all(uids.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));

        const action = args[0]?.toLowerCase();
        switch(action) {
            case "add":
            case "-a": {
                const uids = getTargetUids();
                if (!uids.length) return message.reply(getLang("missingIdAdd"));

                const added = [], already = [];
                for (const uid of uids) threadData[threadID].admins.includes(uid) ? already.push(uid) : added.push(uid);
                threadData[threadID].admins.push(...added);
                saveData();

                const names = await sendNamesList(uids);

                // Notify added users
                for (const uid of added) {
                    message.send(getLang("notifyAdd"), { mentions: [{ tag: names.find(n => n.uid === uid)?.name || uid, id: uid }] });
                }

                return message.reply(
                    (added.length ? getLang("added", added.length, names.filter(u => added.includes(u.uid)).map(u => `• ${u.name} (${u.uid})`).join("\n")) : "") +
                    (already.length ? getLang("alreadyAdmin", already.length, already.map(uid => `• ${uid}`).join("\n")) : "")
                );
            }

            case "remove":
            case "-r": {
                const uids = getTargetUids();
                if (!uids.length) return message.reply(getLang("missingIdRemove"));

                const removed = [], notAdmin = [];
                for (const uid of uids) {
                    if (!threadData[threadID].admins.includes(uid)) notAdmin.push(uid);
                    else if (uid === event.senderID) return message.reply(getLang("cannotRemoveSelf"));
                    else removed.push(uid);
                }

                removed.forEach(uid => threadData[threadID].admins.splice(threadData[threadID].admins.indexOf(uid), 1));
                saveData();

                const names = await sendNamesList(removed);

                // Notify removed users
                for (const uid of removed) {
                    message.send(getLang("notifyRemove"), { mentions: [{ tag: names.find(n => n.uid === uid)?.name || uid, id: uid }] });
                }

                return message.reply(
                    (removed.length ? getLang("removed", removed.length, names.map(u => `• ${u.name} (${u.uid})`).join("\n")) : "") +
                    (notAdmin.length ? getLang("notAdmin", notAdmin.length, notAdmin.map(uid => `• ${uid}`).join("\n")) : "")
                );
            }

            case "list":
            case "-l": {
                const names = await sendNamesList(threadData[threadID].admins);
                const list = names.length ? names.map(u => `👑 ${u.name} (${u.uid})`).join("\n") : "❌ এখনো কোন গ্রুপ এডমিন নেই";
                return message.reply(getLang("listAdmin", list));
            }

            default:
                return message.SyntaxError();
        }
    }
};
