import { ItemView, TFile, WorkspaceLeaf, setIcon, Notice } from 'obsidian';
import { TagParser, TagNode } from './tagParser';
import { NoteMover, MoveOptions } from './noteMover';
import type MultiLevelNoteMoverPlugin from './main';

export const VIEW_TYPE_TAG_TREE = 'tag-tree-view';

/**
 * Tree view showing files organized by their tags
 */
export class TagTreeView extends ItemView {
	private noteMover: NoteMover;
	private tagTree: TagNode | null = null;
	private filesByTag: Map<string, TFile[]> = new Map();
	private plugin: MultiLevelNoteMoverPlugin;
	private isLoading = false;

	constructor(leaf: WorkspaceLeaf, plugin: MultiLevelNoteMoverPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.noteMover = new NoteMover(this.app);
	}

	private getMoveOptions(): MoveOptions {
		return { rules: this.plugin.settings.rules };
	}

	getViewType(): string {
		return VIEW_TYPE_TAG_TREE;
	}

	getDisplayText(): string {
		return 'Tag tree';
	}

	getIcon(): string {
		return 'folder-tree';
	}

	async onOpen(): Promise<void> {
		this.refresh();
	}

	onClose(): Promise<void> {
		this.tagTree = null;
		this.filesByTag.clear();
		return Promise.resolve();
	}

	refresh(): void {
		if (this.isLoading) return;
		this.isLoading = true;

		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass('tag-tree-container');

		// Show loading state
		const loadingEl = container.createDiv({ cls: 'tag-tree-loading' });
		loadingEl.setText('Loading tags...');

		try {
			this.buildTagTree();

			container.empty();

			// Header
			const header = container.createDiv({ cls: 'tag-tree-header' });
			header.createEl('h4', { text: 'Tag tree' });

			const buttonsEl = header.createDiv({ cls: 'tag-tree-header-buttons' });

			const refreshBtn = buttonsEl.createEl('button', {
				cls: 'tag-tree-btn',
				attr: { 'aria-label': 'Refresh' }
			});
			setIcon(refreshBtn, 'refresh-cw');
			refreshBtn.addEventListener('click', () => { this.refresh(); });

			const moveAllBtn = buttonsEl.createEl('button', {
				cls: 'tag-tree-btn',
				attr: { 'aria-label': 'Move all notes' }
			});
			setIcon(moveAllBtn, 'folder-input');
			moveAllBtn.addEventListener('click', () => { void this.moveAllNotes(); });

			// Tree Content
			const treeContainer = container.createDiv({ cls: 'tag-tree-content' });

			if (this.tagTree && this.tagTree.children.size > 0) {
				this.renderTagNode(treeContainer, this.tagTree, 0);
			} else {
				const emptyEl = treeContainer.createDiv({ cls: 'tag-tree-empty' });
				emptyEl.createEl('p', { text: 'No tags found' });
				emptyEl.createEl('p', {
					text: 'Add tags to your notes to see them organized here.',
					cls: 'tag-tree-empty-hint'
				});
			}
		} catch {
			container.empty();
			const errorEl = container.createDiv({ cls: 'tag-tree-error' });
			errorEl.setText('Failed to load tags. Click to retry.');
			errorEl.addEventListener('click', () => { this.refresh(); });
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Build tag tree using metadata cache (fast)
	 */
	private buildTagTree(): void {
		const allFiles = this.noteMover.getAllMarkdownFiles();
		const allTags: string[] = [];
		this.filesByTag.clear();

		for (const file of allFiles) {
			const cache = this.app.metadataCache.getFileCache(file);
			const tags = TagParser.extractTagsFromCache(cache);

			for (const tag of tags) {
				allTags.push(tag);

				if (!this.filesByTag.has(tag)) {
					this.filesByTag.set(tag, []);
				}
				this.filesByTag.get(tag)!.push(file);
			}
		}

		this.tagTree = TagParser.buildTagTree([...new Set(allTags)]);
	}

	private renderTagNode(container: HTMLElement, node: TagNode, depth: number): void {
		node.children.forEach((childNode) => {
			const files = this.filesByTag.get(childNode.fullPath) || [];
			const hasFiles = files.length > 0;
			const hasChildren = childNode.children.size > 0;

			const nodeEl = container.createDiv({ cls: 'tag-tree-node' });
			if (depth > 0) {
				nodeEl.setCssStyles({ marginLeft: `${depth * 16}px` });
			}

			const nodeHeader = nodeEl.createDiv({ cls: 'tag-tree-node-header' });

			// Expand/Collapse Icon
			const expandIcon = nodeHeader.createSpan({ cls: 'tag-tree-expand-icon' });
			if (hasFiles || hasChildren) {
				setIcon(expandIcon, 'chevron-right');
			}

			// Folder Icon
			const folderIcon = nodeHeader.createSpan({ cls: 'tag-tree-icon' });
			setIcon(folderIcon, 'folder');

			// Tag Name
			nodeHeader.createSpan({
				text: childNode.tag,
				cls: 'tag-tree-tag-name'
			});

			// File Count Badge
			if (hasFiles) {
				nodeHeader.createSpan({
					text: String(files.length),
					cls: 'tag-tree-badge'
				});
			}

			// Move Button
			if (hasFiles) {
				const moveBtn = nodeHeader.createEl('button', {
					cls: 'tag-tree-move-btn',
					attr: { 'aria-label': 'Move files with this tag' }
				});
				setIcon(moveBtn, 'folder-input');
				moveBtn.addEventListener('click', (e) => {
					e.stopPropagation();
					void this.moveNotesForTag(childNode.fullPath);
				});
			}

			// Expandable Content
			if (hasFiles || hasChildren) {
				const contentEl = nodeEl.createDiv({ cls: 'tag-tree-node-content tag-tree-hidden' });

				// Files List
				if (hasFiles) {
					const filesContainer = contentEl.createDiv({ cls: 'tag-tree-files' });
					for (const file of files) {
						const fileEl = filesContainer.createDiv({ cls: 'tag-tree-file' });

						const fileIcon = fileEl.createSpan({ cls: 'tag-tree-icon' });
						setIcon(fileIcon, 'file-text');

						fileEl.createSpan({ text: file.basename, cls: 'tag-tree-file-name' });

						fileEl.addEventListener('click', (e) => {
							e.stopPropagation();
							void this.app.workspace.getLeaf().openFile(file);
						});
					}
				}

				// Render Child Tags
				if (hasChildren) {
					this.renderTagNode(contentEl, childNode, 0);
				}

				// Toggle Expand/Collapse
				let isExpanded = false;
				nodeHeader.addEventListener('click', () => {
					isExpanded = !isExpanded;
					contentEl.toggleClass('tag-tree-hidden', !isExpanded);
					setIcon(expandIcon, isExpanded ? 'chevron-down' : 'chevron-right');
					setIcon(folderIcon, isExpanded ? 'folder-open' : 'folder');
					nodeHeader.classList.toggle('expanded', isExpanded);
				});
			}
		});
	}

	private async moveNotesForTag(tag: string): Promise<void> {
		const files = this.filesByTag.get(tag) || [];

		if (files.length === 0) {
			new Notice('No files to move');
			return;
		}

		if (this.plugin.settings.rules.length === 0) {
			new Notice('No folder rules configured');
			return;
		}

		const results = await this.noteMover.moveMultipleNotes(files, this.getMoveOptions());
		const movedCount = results.filter(r => r.success && r.moved).length;

		if (movedCount > 0) {
			new Notice(`Moved ${movedCount} note(s)`);
			this.refresh();
		} else {
			new Notice('No notes were moved');
		}
	}

	private async moveAllNotes(): Promise<void> {
		if (this.plugin.settings.rules.length === 0) {
			new Notice('No folder rules configured');
			return;
		}

		const allFiles = this.noteMover.getAllMarkdownFiles();

		if (allFiles.length === 0) {
			new Notice('No notes to move');
			return;
		}

		new Notice(`Processing ${allFiles.length} notes...`);

		const results = await this.noteMover.moveMultipleNotes(allFiles, this.getMoveOptions());
		const movedCount = results.filter(r => r.success && r.moved).length;

		new Notice(`Moved ${movedCount} of ${allFiles.length} note(s)`);
		this.refresh();
	}
}
