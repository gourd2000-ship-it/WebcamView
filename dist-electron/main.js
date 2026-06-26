import { BrowserWindow as e, app as t, ipcMain as n } from "electron";
import r from "path";
import i from "fs";
import { fileURLToPath as a } from "url";
//#region electron/main.ts
var o = a(import.meta.url), s = r.dirname(o), c = null;
function l() {
	c = new e({
		width: 1024,
		height: 768,
		minWidth: 800,
		minHeight: 600,
		webPreferences: {
			preload: r.join(s, "preload.mjs"),
			nodeIntegration: !1,
			contextIsolation: !0,
			sandbox: !0
		},
		autoHideMenuBar: !0
	}), process.env.VITE_DEV_SERVER_URL ? c.loadURL(process.env.VITE_DEV_SERVER_URL) : c.loadFile(r.join(s, "../dist/index.html")), c.on("closed", () => {
		c = null;
	});
}
t.whenReady().then(() => {
	l(), t.on("activate", () => {
		e.getAllWindows().length === 0 && l();
	});
}), t.on("window-all-closed", () => {
	process.platform !== "darwin" && t.quit();
}), n.handle("save-capture", async (e, n, a) => {
	try {
		let e = t.getPath("pictures"), o = r.join(e, "WebcamViewer");
		i.existsSync(o) || i.mkdirSync(o, { recursive: !0 });
		let s = r.join(o, a), c = Buffer.from(n);
		return await i.promises.writeFile(s, c), {
			success: !0,
			filePath: s
		};
	} catch (e) {
		return console.error("Failed to save capture:", e), {
			success: !1,
			error: e.message
		};
	}
});
//#endregion
export {};
