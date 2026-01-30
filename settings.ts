import { App, PluginSettingTab, Setting, TFolder, TAbstractFile } from 'obsidian';
import MultiLevelNoteMoverPlugin from './main';

export interface FolderRule {
	id: string;
	tag: string;
	folder: string;
	children: FolderRule[];
}

export interface MultiLevelNoteMoverSettings {
	autoMoveOnSave: boolean;
	showNotifications: boolean;
	excludedFolders: string[];
	rules: FolderRule[];
}

export const DEFAULT_SETTINGS: MultiLevelNoteMoverSettings = {
	autoMoveOnSave: false,
	showNotifications: true,
	excludedFolders: [],
	rules: []
};

/**
 * Generate a unique ID for rules
 */
function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

/**
 * Settings tab for the Multi Level Note Mover plugin
 */
export class MultiLevelNoteMoverSettingTab extends PluginSettingTab {
	plugin: MultiLevelNoteMoverPlugin;

	constructor(app: App, plugin: MultiLevelNoteMoverPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * Get all unique tags from the vault using metadata cache
	 */
	private getAllVaultTags(): string[] {
		const tags = new Set<string>();
		const metadataCache = this.app.metadataCache;

		for (const file of this.app.vault.getMarkdownFiles()) {
			const cache = metadataCache.getFileCache(file);

			if (cache?.tags) {
				for (const tagCache of cache.tags) {
					const tag = tagCache.tag.replace(/^#/, '');
					if (tag) tags.add(tag);
				}
			}

			if (cache?.frontmatter?.tags) {
				const fmTags = cache.frontmatter.tags;
				if (Array.isArray(fmTags)) {
					for (const t of fmTags) {
						const tag = String(t).replace(/^#/, '').trim();
						if (tag) tags.add(tag);
					}
				} else if (typeof fmTags === 'string') {
					const tag = fmTags.replace(/^#/, '').trim();
					if (tag) tags.add(tag);
				}
			}
		}

		return Array.from(tags).sort((a, b) => a.localeCompare(b));
	}

	/**
	 * Get all folders from the vault
	 */
	private getAllVaultFolders(): string[] {
		const folders: string[] = [];

		const collectFolders = (folder: TAbstractFile): void => {
			if (folder instanceof TFolder) {
				if (folder.path && folder.path !== '/') {
					folders.push(folder.path);
				}
				for (const child of folder.children) {
					collectFolders(child);
				}
			}
		};

		collectFolders(this.app.vault.getRoot());
		return folders.sort((a, b) => a.localeCompare(b));
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass('mlnm-settings');

		// Header
		new Setting(containerEl).setName('Organize notes by tags').setHeading();

		// General settings section
		this.renderGeneralSettings(containerEl);

		// Rules Section
		this.renderRulesSection(containerEl);

		// Help Section
		this.renderHelpSection(containerEl);
	}

	private renderGeneralSettings(containerEl: HTMLElement): void {
		new Setting(containerEl).setName('Behavior').setHeading();

		new Setting(containerEl)
			.setName('Auto-move on save')
			.setDesc('Automatically move notes when they are saved')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoMoveOnSave)
				.onChange((value) => {
					this.plugin.settings.autoMoveOnSave = value;
					void this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show notifications')
			.setDesc('Display notifications when notes are moved')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showNotifications)
				.onChange((value) => {
					this.plugin.settings.showNotifications = value;
					void this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Excluded folders')
			.setDesc('Folders to exclude from auto-moving (comma-separated)')
			.addText(text => text
				.setPlaceholder('Templates, Archive, Daily notes')
				.setValue(this.plugin.settings.excludedFolders.join(', '))
				.onChange((value) => {
					this.plugin.settings.excludedFolders = value
						.split(',')
						.map(f => f.trim())
						.filter(f => f.length > 0);
					void this.plugin.saveSettings();
				}));
	}

	private renderRulesSection(containerEl: HTMLElement): void {
		new Setting(containerEl).setName('Folder rules').setHeading();

		const rulesDesc = containerEl.createEl('p', {
			cls: 'setting-item-description mlnm-rules-desc'
		});
		rulesDesc.setText('Map tags to folders. Child rules create nested folder structures.');

		// Add Rule Button
		new Setting(containerEl)
			.addButton(button => button
				.setButtonText('Add rule')
				.setCta()
				.onClick(() => {
					this.plugin.settings.rules.push({
						id: generateId(),
						tag: '',
						folder: '',
						children: []
					});
					this.plugin.saveSettings().then(() => this.display()).catch(() => {});
				}));

		// Get data for dropdowns
		const availableTags = this.getAllVaultTags();
		const availableFolders = this.getAllVaultFolders();

		// Rules Container
		const rulesContainer = containerEl.createDiv({ cls: 'mlnm-rules-container' });

		if (this.plugin.settings.rules.length === 0) {
			rulesContainer.createEl('p', {
				text: 'No rules configured. Add a rule to get started.',
				cls: 'mlnm-empty-state'
			});
		} else {
			for (let i = 0; i < this.plugin.settings.rules.length; i++) {
				this.renderRule(
					rulesContainer,
					this.plugin.settings.rules[i],
					0,
					this.plugin.settings.rules,
					i,
					availableTags,
					availableFolders
				);
			}
		}
	}

	private renderRule(
		container: HTMLElement,
		rule: FolderRule,
		depth: number,
		parentArray: FolderRule[],
		index: number,
		availableTags: string[],
		availableFolders: string[]
	): void {
		const isIncomplete = !rule.tag || !rule.folder;
		const hasChildren = rule.children && rule.children.length > 0;

		// Rule Container
		const ruleEl = container.createDiv({
			cls: `mlnm-rule ${isIncomplete ? 'mlnm-rule-incomplete' : ''} ${depth > 0 ? 'mlnm-rule-child' : ''}`
		});

		// Rule Row
		const ruleRow = ruleEl.createDiv({ cls: 'mlnm-rule-row' });

		// Tag Select
		const tagSelect = ruleRow.createEl('select', { cls: 'mlnm-select mlnm-tag-select' });
		tagSelect.createEl('option', { text: 'Select tag...', value: '' });

		for (const tag of availableTags) {
			const opt = tagSelect.createEl('option', { text: `#${tag}`, value: tag });
			if (tag === rule.tag) opt.selected = true;
		}

		// Add current tag if not in list
		if (rule.tag && !availableTags.includes(rule.tag)) {
			const opt = tagSelect.createEl('option', { text: `#${rule.tag}`, value: rule.tag });
			opt.selected = true;
		}

		tagSelect.addEventListener('change', () => {
			rule.tag = tagSelect.value;
			this.plugin.saveSettings().then(() => this.display()).catch(() => {});
		});

		// Arrow
		ruleRow.createSpan({ text: '→', cls: 'mlnm-arrow' });

		// Folder Select
		const folderSelect = ruleRow.createEl('select', { cls: 'mlnm-select mlnm-folder-select' });
		folderSelect.createEl('option', { text: 'Select folder...', value: '' });

		for (const folder of availableFolders) {
			const opt = folderSelect.createEl('option', { text: folder, value: folder });
			if (folder === rule.folder) opt.selected = true;
		}

		// Add current folder if not in list
		if (rule.folder && !availableFolders.includes(rule.folder)) {
			const opt = folderSelect.createEl('option', {
				text: `${rule.folder} (new)`,
				value: rule.folder
			});
			opt.selected = true;
		}

		folderSelect.addEventListener('change', () => {
			rule.folder = folderSelect.value;
			void this.plugin.saveSettings();
		});

		// Actions
		const actionsEl = ruleRow.createDiv({ cls: 'mlnm-rule-actions' });

		// Add Child Button
		const addChildBtn = actionsEl.createEl('button', {
			cls: 'mlnm-btn mlnm-btn-add',
			attr: { 'aria-label': 'Add child rule' }
		});
		addChildBtn.setText('+');
		addChildBtn.addEventListener('click', () => {
			rule.children.push({
				id: generateId(),
				tag: '',
				folder: '',
				children: []
			});
			this.plugin.saveSettings().then(() => this.display()).catch(() => {});
		});

		// Delete Button
		const deleteBtn = actionsEl.createEl('button', {
			cls: 'mlnm-btn mlnm-btn-delete',
			attr: { 'aria-label': 'Delete rule' }
		});
		deleteBtn.setText('×');
		deleteBtn.addEventListener('click', () => {
			parentArray.splice(index, 1);
			this.plugin.saveSettings().then(() => this.display()).catch(() => {});
		});

		// Children Section (Collapsible)
		if (hasChildren) {
			const childrenSection = ruleEl.createDiv({ cls: 'mlnm-children-section' });

			// Toggle Header
			const toggleHeader = childrenSection.createDiv({ cls: 'mlnm-children-toggle' });
			const toggleIcon = toggleHeader.createSpan({ cls: 'mlnm-toggle-icon', text: '▼' });
			toggleHeader.createSpan({
				text: `${rule.children.length} sub-rule${rule.children.length > 1 ? 's' : ''}`,
				cls: 'mlnm-children-count'
			});

			// Children Container
			const childrenContainer = childrenSection.createDiv({ cls: 'mlnm-children-container' });

			for (let i = 0; i < rule.children.length; i++) {
				this.renderRule(
					childrenContainer,
					rule.children[i],
					depth + 1,
					rule.children,
					i,
					availableTags,
					availableFolders
				);
			}

			// Toggle Behavior
			let isCollapsed = false;
			toggleHeader.addEventListener('click', () => {
				isCollapsed = !isCollapsed;
				childrenContainer.toggleClass('mlnm-hidden', isCollapsed);
				toggleIcon.setText(isCollapsed ? '▶' : '▼');
				toggleHeader.classList.toggle('collapsed', isCollapsed);
			});
		}
	}

	private renderHelpSection(containerEl: HTMLElement): void {
		new Setting(containerEl).setName('How it works').setHeading();

		const helpEl = containerEl.createDiv({ cls: 'mlnm-help' });

		const list = helpEl.createEl('ul');
		list.createEl('li', { text: 'Select a tag and a destination folder for each rule' });
		list.createEl('li', { text: 'Add child rules to create nested folder structures' });
		list.createEl('li', { text: 'Example: #work → Work/, child #project → Project/ results in Work/Project/' });
		list.createEl('li', { text: 'Notes are moved to the deepest matching rule path' });
		list.createEl('li', { text: 'Missing folders are created automatically' });
	}
}
