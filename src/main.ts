import { Plugin, TFile, Editor } from "obsidian";
import { CheckboxAutocheckerSettingTab, DEFAULT_SETTINGS, CheckboxAutocheckerSettings, SyncMode } from "./settings";

export default class CheckboxAutochecker extends Plugin {

	private fileCache: Map<string, string> = new Map();
	private filesBeingUpdated: Set<string> = new Set();

	settings!: CheckboxAutocheckerSettings;

	async onload() {
		console.log("CheckboxAutochecker plugin loaded");

		await this.loadSettings();
		this.addSettingTab(new CheckboxAutocheckerSettingTab(this.app, this));

		// init cache
		this.app.workspace.onLayoutReady(() => {
			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile) this.cacheFileContent(activeFile);
		});

		// file-level vault sync - runs when file is modified
		this.registerEvent(
			this.app.vault.on("modify", async (file) => {
				if (!(file instanceof TFile)) return;

				// cache file first time
				if (!this.fileCache.has(file.path)) {
					await this.cacheFileContent(file);
				}

				const activeFile = this.app.workspace.getActiveFile();
				if (file.path === activeFile?.path) {
					await this.syncCurrentFile(file);
				}
			})
		);

		// editor-level real-time sync - runs while typing
		this.registerEvent(
			this.app.workspace.on("editor-change", (editor, view) => {
				this.handleEditorChange(editor);
			})
		);
	}

	async cacheFileContent(file: TFile) {
		const content = await this.app.vault.read(file);
		this.fileCache.set(file.path, content);
	}

	handleEditorChange(editor: Editor) {
		const content = editor.getValue();

		const syncedContent = syncCheckboxes(
			content,
			null, // no diff possible while typing
			this.settings.syncMode,
			this.settings.loggingEnabled
		);

		if (content !== syncedContent) {
			editor.setValue(syncedContent);
		}
	}

	// runs when file is saved/modified
	async syncCurrentFile(file: TFile) {
		// Prevent re-processing our own updates
		if (this.filesBeingUpdated.has(file.path)) {
			this.filesBeingUpdated.delete(file.path);
			return;
		}

		// only handle markdown files - no .canvas
		if (file.extension !== "md") {
			return;
		}

		const previousContent = this.fileCache.get(file.path) ?? "";
		const currentContent = await this.app.vault.read(file);

		if (previousContent === currentContent) return;

		// find which line was changed und run logic
		const changedLineIdx = this.detectChangedLine(previousContent, currentContent);
		const updatedContent = syncCheckboxes(
			currentContent,
			changedLineIdx,
			this.settings.syncMode,
			this.settings.loggingEnabled
		);

		// only write back if any changes occurred
		if (currentContent !== updatedContent) {
			this.filesBeingUpdated.add(file.path);
			await this.app.vault.modify(file, updatedContent);
			this.fileCache.set(file.path, updatedContent);
		} else {
			this.fileCache.set(file.path, currentContent);
		}
	}

	detectChangedLine(oldContent: string, newContent: string): number | null {
		const oldLines = oldContent.split("\n");
		const newLines = newContent.split("\n");
		const maxLength = Math.max(oldLines.length, newLines.length);

		for (let i = 0; i < maxLength; i++) {
			if (oldLines[i] !== newLines[i]) {
				return i;
			}
		}
		return null;
	}

	// loads saved user settings
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	// saves updated user settings
	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// ----------------------------------------------
// CORE CHECKBOX LOGIC
// ----------------------------------------------

interface Task {
	line: string;
	indent: number;
	checked: boolean;
	isTask: boolean;
	children: number[];
	parent: number | null;
}

function syncCheckboxes(content: string, changedLineIdx: number | null, mode: SyncMode, logging: boolean): string {
	if (logging) console.log("Sync triggered (mode:", mode, ")");

	const lines = content.split("\n");

	// parse lines into task objects
	const tasks: Task[] = lines.map((line) => ({
		line,
		indent: line.search(/\S|$/),
		checked: /^\s*[-*] \[x\]/i.test(line),
		isTask: /^\s*[-*] \[[ x]\]/.test(line),
		children: [],
		parent: null,
	}));

	// build task tree - parent/child relationships based on indentation
	const stack: number[] = [];
	tasks.forEach((task, i) => {
		if (!task.isTask) return;
		while (stack.length && tasks[stack[stack.length - 1]].indent >= task.indent) {
			stack.pop();
		}
		if (stack.length) {
			const parentIdx = stack[stack.length - 1];
			task.parent = parentIdx;
			tasks[parentIdx].children.push(i);
		}
		stack.push(i);
	});

	// apply downward propagation if a checkbox was toggled
	if (changedLineIdx !== null && tasks[changedLineIdx]?.isTask) {
		const state = tasks[changedLineIdx].checked;

		const propagateDown = (index: number, state: boolean) => {
			tasks[index].checked = state;
			tasks[index].children.forEach((child) => {
				const childTask = tasks[child];

				if (mode === "strict") {
					propagateDown(child, state);
				} else if (mode === "partial-strict") {
					if (state === true && childTask.checked === false) {
						propagateDown(child, state);
					}
					if (state === false) {
						propagateDown(child, state);
					}
				}
				// loose mode = no downward sync
			});
		};

		if (mode !== "loose") {
			propagateDown(changedLineIdx, state);
		}
	}

	// parent reflects childrens states - gets always applied
	const propagateUp = (idx: number) => {
		const parentIdx = tasks[idx].parent;
		if (parentIdx === null) return;
		const parentTask = tasks[parentIdx];
		const allChildrenChecked = parentTask.children.every((child) => tasks[child].checked);
		if (parentTask.checked !== allChildrenChecked) {
			parentTask.checked = allChildrenChecked;
			propagateUp(parentIdx);
		}
	};

	tasks.forEach((task, idx) => {
		if (task.isTask) propagateUp(idx);
	});

	// build return content for file
	return tasks
		.map((t) =>
			t.isTask ? t.line.replace(/\[.\]/, t.checked ? "[x]" : "[ ]") : t.line
		)
		.join("\n");
}

