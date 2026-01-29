import { CachedMetadata } from 'obsidian';

export interface TagNode {
	tag: string;
	fullPath: string;
	children: Map<string, TagNode>;
	parent: TagNode | null;
}

/**
 * Utility class for parsing and organizing tags from notes.
 */
export class TagParser {
	/**
	 * Extract tags from Obsidian's metadata cache (preferred method - faster)
	 */
	static extractTagsFromCache(cache: CachedMetadata | null): string[] {
		if (!cache) {
			return [];
		}

		const tags = new Set<string>();

		// Extract inline tags (#tag in content)
		if (cache.tags) {
			for (const tagCache of cache.tags) {
				const tag = tagCache.tag.replace(/^#/, '');
				if (tag) {
					tags.add(tag);
				}
			}
		}

		// Extract frontmatter tags
		if (cache.frontmatter?.tags) {
			const fmTags = cache.frontmatter.tags;

			if (Array.isArray(fmTags)) {
				for (const t of fmTags) {
					const tag = String(t).replace(/^#/, '').trim();
					if (tag) {
						tags.add(tag);
					}
				}
			} else if (typeof fmTags === 'string') {
				const tag = fmTags.replace(/^#/, '').trim();
				if (tag) {
					tags.add(tag);
				}
			}
		}

		return Array.from(tags);
	}

	/**
	 * Extract tags from raw content (fallback method)
	 */
	static extractTagsFromContent(content: string): string[] {
		if (!content) {
			return [];
		}

		const tags = new Set<string>();

		// Parse frontmatter first
		const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
		let contentBody = content;

		if (frontmatterMatch) {
			const frontmatter = frontmatterMatch[1];
			contentBody = content.slice(frontmatterMatch[0].length);

			// Inline array: tags: [tag1, tag2]
			const inlineMatch = frontmatter.match(/tags:\s*\[([^\]]+)\]/);
			if (inlineMatch) {
				const tagList = inlineMatch[1].split(',');
				for (const t of tagList) {
					const tag = t.trim().replace(/['"#]/g, '');
					if (tag) {
						tags.add(tag);
					}
				}
			}

			// YAML list: tags:\n  - tag1\n  - tag2
			const listMatch = frontmatter.match(/tags:\s*\r?\n((?:\s*-\s*.+\r?\n?)+)/);
			if (listMatch) {
				const lines = listMatch[1].split(/\r?\n/);
				for (const line of lines) {
					const tag = line.trim().replace(/^-\s*/, '').replace(/['"#]/g, '');
					if (tag) {
						tags.add(tag);
					}
				}
			}

			// Single value: tags: sometag
			if (!inlineMatch && !listMatch) {
				const singleMatch = frontmatter.match(/tags:\s*([^\n\[\]]+)/);
				if (singleMatch) {
					const tag = singleMatch[1].trim().replace(/['"#]/g, '');
					if (tag) {
						tags.add(tag);
					}
				}
			}
		}

		// Extract hashtags from content body
		const hashtagRegex = /#([a-zA-Z][a-zA-Z0-9_/-]*)/g;
		let match;

		while ((match = hashtagRegex.exec(contentBody)) !== null) {
			tags.add(match[1]);
		}

		return Array.from(tags);
	}

	/**
	 * Build a hierarchical tree structure from a list of tags.
	 * Supports nested tags like "parent/child/grandchild".
	 */
	static buildTagTree(tags: string[]): TagNode {
		const root: TagNode = {
			tag: '',
			fullPath: '',
			children: new Map(),
			parent: null
		};

		for (const tag of tags) {
			const parts = tag.split('/');
			let currentNode = root;
			let currentPath = '';

			for (const part of parts) {
				currentPath = currentPath ? `${currentPath}/${part}` : part;

				if (!currentNode.children.has(part)) {
					const newNode: TagNode = {
						tag: part,
						fullPath: currentPath,
						children: new Map(),
						parent: currentNode
					};
					currentNode.children.set(part, newNode);
				}

				currentNode = currentNode.children.get(part)!;
			}
		}

		return root;
	}
}
