const axios = require("axios");
const { execSync } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const cheerio = require("cheerio");
const { client } = global;

const { configCommands } = global.GoatBot;
const { log, loading, removeHomeDir } = global.utils;

function getDomain(url) {
	const regex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n]+)/im;
	const match = url.match(regex);
	return match ? match[1] : null;
}

function isURL(str) {
	try { new URL(str); return true; }
	catch (e) { return false; }
}

// --------------------- LOAD SCRIPTS --------------------- //
function loadScripts(folder, fileName, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang, rawCode) {
	const storageCommandFilesPath = global.GoatBot[folder == "cmds" ? "commandFilesPath" : "eventCommandsFilesPath"];
	try {
		if (rawCode) {
			if (!fileName.endsWith(".js")) fileName += ".js";
			fs.writeFileSync(path.join(process.cwd(), `scripts/${folder}/${fileName}`), rawCode, "utf8");
		}

		const pathCommand = path.normalize(process.cwd() + `/scripts/${folder}/${fileName}`);
		const contentFile = fs.readFileSync(pathCommand, "utf8");

		// ------------------- CHECK REQUIRED PACKAGES ------------------- //
		const regExpCheckPackage = /require\((['"`])([^'"`]+)\1\)/g;
		let match;
		const packageAlready = [];
		while ((match = regExpCheckPackage.exec(contentFile)) !== null) {
			let packageName = match[2];
			if (packageName.startsWith("@")) packageName = packageName.split("/").slice(0, 2).join("/");
			else packageName = packageName.split("/")[0];

			if (!packageAlready.includes(packageName) && !fs.existsSync(`${process.cwd()}/node_modules/${packageName}`)) {
				packageAlready.push(packageName);
				let spinnerCount = 0;
				const spinner = "|/-\\";
				const interval = setInterval(() => {
					spinnerCount++;
					loading.info("PACKAGE", `Installing ${packageName} ${spinner[spinnerCount % spinner.length]}`);
				}, 80);
				try { execSync(`npm install ${packageName} --save`, { stdio: "pipe" }); }
				catch (e) { clearInterval(interval); throw new Error(`Can't install package ${packageName}`); }
				clearInterval(interval);
			}
		}

		// ------------------- DELETE OLD CACHE ------------------- //
		delete require.cache[require.resolve(pathCommand)];

		const command = require(pathCommand);
		if (!command.config || typeof command.config != "object") throw new Error("config of command must be an object");
		const scriptName = command.config.name;
		if (!scriptName) throw new Error("Name of command is missing!");
		if (!command.onStart || typeof command.onStart != "function") throw new Error("Function onStart is missing or not a function!");

		// ------------------- ALIASES ------------------- //
		if (command.config.aliases) {
			let aliases = Array.isArray(command.config.aliases) ? command.config.aliases : [command.config.aliases];
			for (const alias of aliases) {
				if (GoatBot.aliases.has(alias)) throw new Error(`Alias "${alias}" already exists`);
				GoatBot.aliases.set(alias, scriptName);
			}
		}

		// ------------------- ADD TO STORAGE ------------------- //
		const setMap = folder == "cmds" ? "commands" : "eventCommands";
		GoatBot[setMap].set(scriptName, command);
		storageCommandFilesPath.push({ filePath: pathCommand, commandName: [scriptName, ...(command.config.aliases || [])] });

		// ------------------- ADD TO EVENTS ------------------- //
		if (command.onChat) GoatBot.onChat.push(scriptName);
		if (command.onFirstChat) GoatBot.onFirstChat.push({ commandName: scriptName, threadIDsChattedFirstTime: [] });
		if (command.onEvent) GoatBot.onEvent.push(scriptName);
		if (command.onAnyEvent) GoatBot.onAnyEvent.push(scriptName);

		fs.writeFileSync(client.dirConfigCommands, JSON.stringify(configCommands, null, 2));
		return { status: "success", name: fileName, command };
	}
	catch (err) {
		const defaultError = { name: err.name, message: err.message, stack: err.stack };
		return { status: "failed", name: fileName, error: err, errorWithThoutRemoveHomeDir: defaultError };
	}
}

// --------------------- UNLOAD SCRIPTS --------------------- //
function unloadScripts(folder, fileName, configCommands, getLang) {
	const pathCommand = `${process.cwd()}/scripts/${folder}/${fileName}`;
	if (!fs.existsSync(pathCommand)) throw new Error(getLang("missingFile", fileName));
	const command = require(pathCommand);
	const commandName = command.config?.name;
	if (!commandName) throw new Error(getLang("invalidFileName", fileName));

	const setMap = folder == "cmds" ? "commands" : "eventCommands";
	delete require.cache[require.resolve(pathCommand)];
	GoatBot[setMap].delete(commandName);

	// remove aliases
	if (command.config.aliases) {
		const aliases = Array.isArray(command.config.aliases) ? command.config.aliases : [command.config.aliases];
		for (const alias of aliases) GoatBot.aliases.delete(alias);
	}

	const commandUnload = configCommands[folder == "cmds" ? "commandUnload" : "commandEventUnload"] || [];
	if (!commandUnload.includes(fileName)) commandUnload.push(fileName);
	configCommands[folder == "cmds" ? "commandUnload" : "commandEventUnload"] = commandUnload;

	fs.writeFileSync(global.client.dirConfigCommands, JSON.stringify(configCommands, null, 2));
	return { status: "success", name: fileName };
}

global.utils.loadScripts = loadScripts;
global.utils.unloadScripts = unloadScripts;

// --------------------- MODULE EXPORT --------------------- //
module.exports = {
	config: {
		name: "cmd2",
		version: "1.19",
		author: "NTKhang",
		countDown: 5,
		role: 2,
		description: { vi: "Quản lý các tệp lệnh của bạn", en: "Manage your command files" },
		category: "owner",
		guide: {
			vi: "{pn} load <tên file lệnh> : Load lệnh cụ thể\n{pn} loadAll : Load tất cả lệnh\n{pn} unload <tên file lệnh> : Unload lệnh\n{pn} install <url> <tên file lệnh> : Cài đặt lệnh từ url\n{pn} install <tên file lệnh> <code> : Cài đặt lệnh từ code",
			en: "{pn} load <command file name> : Load a specific command\n{pn} loadAll : Load all commands\n{pn} unload <command file name> : Unload a command\n{pn} install <url> <command file name> : Install a command from url\n{pn} install <command file name> <code> : Install a command from code"
		}
	},
	onReaction: async function ({ Reaction, message, event, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang }) {
		const { loadScripts } = global.utils;
		const { author, data: { fileName, rawCode } } = Reaction;
		if (event.userID != author) return;
		const infoLoad = loadScripts("cmds", fileName, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang, rawCode);
		infoLoad.status == "success" ?
			message.reply(getLang("installed", infoLoad.name, path.join(__dirname, fileName).replace(process.cwd(), ""))) :
			message.reply(getLang("installedError", infoLoad.name, infoLoad.error.name, infoLoad.error.message));
	}
};
