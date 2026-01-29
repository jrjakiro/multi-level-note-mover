import { Plugin, TFile, Notice, WorkspaceLeaf, EventRef, debounce } from 'obsidian';
import { MultiLevelNoteMoverSettings, DEFAULT_SETTINGS, MultiLevelNoteMoverSettingTab, FolderRule } from './settings';
import { NoteMover } from './noteMover';
import { TagTreeView, VIEW_TYPE_TAG_TREE } from './treeView';

/** Plugin ID constant */
const PLUGIN_ID = 'multi-level-note-mover';
const STYLE_ID = `${PLUGIN_ID}-styles`;

/**
 * Multi Level Note Mover Plugin
 * Automatically organizes notes into folders based on their tags using hierarchical rules.
 */
export default class MultiLevelNoteMoverPlugin extends Plugin {
	settings: MultiLevelNoteMoverSettings;
	noteMover: NoteMover;
	private autoMoveEventRef: EventRef | null = null;
	private debouncedMoveNote: (file: TFile) => void;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.noteMover = new NoteMover(this.app);

		// Create debounced move function (300ms delay)
		this.debouncedMoveNote = debounce(
			(file: TFile) => this.moveNote(file),
			300,
			true
		);

		this.registerView(
			VIEW_TYPE_TAG_TREE,
			(leaf) => new TagTreeView(leaf, this)
		);

		this.addRibbonIcon('folder-tree', 'Open tag tree', () => {
			void this.activateView();
		});

		this.registerCommands();
		this.updateAutoMoveHandler();
		this.addSettingTab(new MultiLevelNoteMoverSettingTab(this.app, this));
	}

	onunload(): void {
		// Clean up event handler
		if (this.autoMoveEventRef) {
			this.app.vault.offref(this.autoMoveEventRef);
			this.autoMoveEventRef = null;
		}
	}

	private registerCommands(): void {
		this.addCommand({
			id: 'open-tag-tree-view',
			name: 'Open tag tree view',
			callback: () => { void this.activateView(); }
		});

		this.addCommand({
			id: 'move-current-note',
			name: 'Move current note by tags',
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					if (!checking) {
						void this.moveNoteWithFeedback(activeFile);
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({
			id: 'move-all-notes',
			name: 'Move all notes by tags',
			callback: () => { void this.moveAllNotes(); }
		});

		this.addCommand({
			id: 'preview-move-current-note',
			name: 'Preview move for current note',
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					if (!checking) {
						void this.previewMoveWithFeedback(activeFile);
					}
					return true;
				}
				return false;
			}
		});
	}

	updateAutoMoveHandler(): void {
		// Remove existing handler
		if (this.autoMoveEventRef) {
			this.app.vault.offref(this.autoMoveEventRef);
			this.autoMoveEventRef = null;
		}

		// Register new handler if enabled
		if (this.settings.autoMoveOnSave) {
			this.autoMoveEventRef = this.app.vault.on('modify', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.debouncedMoveNote(file);
				}
			});
			this.registerEvent(this.autoMoveEventRef);
		}
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_TAG_TREE);

		let leaf: WorkspaceLeaf | null = null;

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			const rightLeaf = workspace.getRightLeaf(false);
			if (rightLeaf) {
				leaf = rightLeaf;
				await leaf.setViewState({ type: VIEW_TYPE_TAG_TREE, active: true });
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	getMoveOptions() {
		return { rules: this.settings.rules };
	}

	/**
	 * Move a note silently (for auto-move on save)
	 */
	async moveNote(file: TFile): Promise<void> {
		if (!this.shouldProcessFile(file)) {
			return;
		}

		const result = await this.noteMover.moveNoteByTags(file, this.getMoveOptions());

		if (this.settings.showNotifications && result.success && result.moved) {
			const folderPath = result.newPath.substring(0, result.newPath.lastIndexOf('/'));
			new Notice(`Note Moved to "${folderPath}"`);
		}
	}

	/**
	 * Move a note with user feedback (for manual command)
	 */
	async moveNoteWithFeedback(file: TFile): Promise<void> {
		if (this.settings.rules.length === 0) {
			new Notice('No folder rules configured. Add rules in settings.');
			return;
		}

		const result = await this.noteMover.moveNoteByTags(file, this.getMoveOptions());

		if (result.success) {
			if (result.moved) {
				const folderPath = result.newPath.substring(0, result.newPath.lastIndexOf('/'));
				new Notice(`Note Moved to "${folderPath}"`);
			} else {
				new Notice(`${file.basename} is already in the correct location`);
			}
		} else {
			new Notice(`Could not move: ${result.error}`);
		}
	}

	/**
	 * Preview move with user feedback
	 */
	previewMoveWithFeedback(file: TFile): void {
		if (this.settings.rules.length === 0) {
			new Notice('No folder rules configured. Add rules in settings.');
			return;
		}

		const targetPath = this.noteMover.previewMove(file, this.getMoveOptions());
		new Notice(`Would move to: ${targetPath}`);
	}

	async moveAllNotes(): Promise<void> {
		if (this.settings.rules.length === 0) {
			new Notice('No folder rules configured. Add rules in settings.');
			return;
		}

		const allFiles = this.noteMover.getAllMarkdownFiles()
			.filter(file => !this.isFileExcluded(file));

		if (allFiles.length === 0) {
			new Notice('No files to process');
			return;
		}

		new Notice(`Processing ${allFiles.length} notes...`);

		const results = await this.noteMover.moveMultipleNotes(allFiles, this.getMoveOptions());
		const movedCount = results.filter(r => r.success && r.moved).length;
		const skippedCount = results.filter(r => r.success && !r.moved).length;
		const failedCount = results.filter(r => !r.success).length;

		let message = `Moved ${movedCount} note(s)`;
		if (skippedCount > 0) {
			message += `, ${skippedCount} already in place`;
		}
		if (failedCount > 0) {
			message += `, ${failedCount} failed`;
		}

		new Notice(message);
	}

	private shouldProcessFile(file: TFile): boolean {
		return this.settings.rules.length > 0 && !this.isFileExcluded(file);
	}

	isFileExcluded(file: TFile): boolean {
		if (this.settings.excludedFolders.length === 0) {
			return false;
		}
		return this.settings.excludedFolders.some(folder => {
			const normalizedFolder = folder.endsWith('/') ? folder : folder + '/';
			return file.path.startsWith(normalizedFolder) || file.path === folder;
		});
	}

	async loadSettings(): Promise<void> {
		const data = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
		this.validateAndCleanRules(this.settings.rules);
	}

	async saveSettings(): Promise<void> {
		this.validateAndCleanRules(this.settings.rules);
		await this.saveData(this.settings);
		this.updateAutoMoveHandler();
	}

	/**
	 * Validate and clean rules recursively
	 */
	private validateAndCleanRules(rules: FolderRule[]): void {
		if (!Array.isArray(rules)) {
			return;
		}

		for (const rule of rules) {
			// Clean tag - remove # prefix
			if (rule.tag) {
				rule.tag = rule.tag.replace(/^#/, '').trim();
			}

			// Clean folder - trim whitespace
			if (rule.folder) {
				rule.folder = rule.folder.trim();
			}

			// Ensure children array exists
			if (!Array.isArray(rule.children)) {
				rule.children = [];
			}

			// Recursively validate children
			this.validateAndCleanRules(rule.children);
		}
	}
}
