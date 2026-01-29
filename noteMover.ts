import { App, TFile, normalizePath } from 'obsidian';
import { TagParser } from './tagParser';
import { FolderRule } from './settings';

export interface MoveResult {
	success: boolean;
	file: TFile;
	oldPath: string;
	newPath: string;
	moved: boolean;
	error?: string;
}

export interface MoveOptions {
	rules: FolderRule[];
}

/**
 * Handles the logic for moving notes based on their tags and configured rules.
 */
export class NoteMover {
	constructor(private app: App) {}

	/**
	 * Move a note based on its tags
	 */
	async moveNoteByTags(file: TFile, options: MoveOptions): Promise<MoveResult> {
		// Capture old path before any operations
		const oldPath = file.path;

		try {
			const cache = this.app.metadataCache.getFileCache(file);
			const tags = TagParser.extractTagsFromCache(cache);

			if (tags.length === 0) {
				return this.createResult(file, oldPath, oldPath, true, false, 'No tags found');
			}

			const targetFolder = this.getTargetFolderFromTags(tags, options);

			if (!targetFolder) {
				return this.createResult(file, oldPath, oldPath, true, false, 'No matching rule');
			}

			const newPath = normalizePath(`${targetFolder}/${file.name}`);

			// Already in correct location
			if (oldPath === newPath) {
				return this.createResult(file, oldPath, newPath, true, false);
			}

			// Check for file conflict at destination
			const existingFile = this.app.vault.getAbstractFileByPath(newPath);
			if (existingFile) {
				return this.createResult(file, oldPath, newPath, false, false, 'File already exists at destination');
			}

			// Check if target folder exists - do NOT create it
			const folderExists = this.app.vault.getAbstractFileByPath(targetFolder);
			if (!folderExists) {
				return this.createResult(file, oldPath, newPath, false, false, `Folder "${targetFolder}" does not exist`);
			}

			// Move the file
			await this.app.fileManager.renameFile(file, newPath);

			return this.createResult(file, oldPath, newPath, true, true);

		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			return this.createResult(file, oldPath, oldPath, false, false, message);
		}
	}

	/**
	 * Move multiple notes based on their tags
	 */
	async moveMultipleNotes(files: TFile[], options: MoveOptions): Promise<MoveResult[]> {
		const results: MoveResult[] = [];

		for (const file of files) {
			const result = await this.moveNoteByTags(file, options);
			results.push(result);
		}

		return results;
	}

	/**
	 * Get target folder based on tags and tree-based rules.
	 * Finds the deepest matching rule path by walking the rule tree.
	 */
	private getTargetFolderFromTags(tags: string[], options: MoveOptions): string | null {
		const { rules } = options;

		if (!rules || rules.length === 0) {
			return null;
		}

		// Normalize tags and create set for O(1) lookup
		const tagSet = new Set(tags.map(t => t.replace(/^#/, '').toLowerCase()));

		const findDeepestPath = (ruleList: FolderRule[], currentPath: string): string | null => {
			let deepestPath: string | null = null;
			let deepestDepth = 0;

			for (const rule of ruleList) {
				if (!rule.tag || !rule.folder) continue;

				const normalizedRuleTag = rule.tag.replace(/^#/, '').toLowerCase();

				if (tagSet.has(normalizedRuleTag)) {
					// Use the rule's folder directly (not combined with parent path)
					const newPath = rule.folder;
					const newDepth = newPath.split('/').length;

					if (newDepth > deepestDepth) {
						deepestPath = newPath;
						deepestDepth = newDepth;
					}

					// Check children for deeper matches
					if (rule.children && rule.children.length > 0) {
						// Pass the current rule's folder as context for children
						const childPath = findDeepestPath(rule.children, newPath);
						if (childPath) {
							const childDepth = childPath.split('/').length;
							if (childDepth > deepestDepth) {
								deepestPath = childPath;
								deepestDepth = childDepth;
							}
						}
					}
				}
			}

			return deepestPath;
		};

		return findDeepestPath(rules, '');
	}

	/**
	 * Get all markdown files in the vault
	 */
	getAllMarkdownFiles(): TFile[] {
		return this.app.vault.getMarkdownFiles();
	}

	/**
	 * Preview where a note would be moved
	 */
	previewMove(file: TFile, options: MoveOptions): string {
		const cache = this.app.metadataCache.getFileCache(file);
		const tags = TagParser.extractTagsFromCache(cache);

		if (tags.length === 0) {
			return `${file.path} (no tags)`;
		}

		const targetFolder = this.getTargetFolderFromTags(tags, options);

		if (!targetFolder) {
			return `${file.path} (no matching rule)`;
		}

		return normalizePath(`${targetFolder}/${file.name}`);
	}

	/**
	 * Create a standardized result object
	 */
	private createResult(
		file: TFile,
		oldPath: string,
		newPath: string,
		success: boolean,
		moved: boolean,
		error?: string
	): MoveResult {
		return { file, oldPath, newPath, success, moved, error };
	}
}
