import { App, PluginSettingTab, Setting } from "obsidian";

export type SyncMode = "loose" | "partial-strict" | "strict";

export interface CheckboxAutocheckerSettings {
	syncMode: SyncMode;
	loggingEnabled: boolean;
}

export const DEFAULT_SETTINGS: CheckboxAutocheckerSettings = {
	syncMode: "partial-strict",
	loggingEnabled: false
};

export class CheckboxAutocheckerSettingTab extends PluginSettingTab {
	plugin: any;

	constructor(app: App, plugin: any) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.createEl("h2", { text: "Checkbox Autochecker Settings" });

		new Setting(containerEl)
			.setName("Sync Mode")
			.setDesc("Control how parent checkboxes affect children when toggled.")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("loose", "Loose (no downward sync)")
					.addOption("partial-strict", "Partial Strict (only update unchecked children)")
					.addOption("strict", "Strict (overwrite all children)")
					.setValue(this.plugin.settings.syncMode)
					.onChange(async (value: string) => {
					  this.plugin.settings.syncMode = value as SyncMode;
					  await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Enable Logging")
			.setDesc("Log debug information to console.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.loggingEnabled)
					.onChange(async (value) => {
						this.plugin.settings.loggingEnabled = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
