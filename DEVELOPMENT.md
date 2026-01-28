# Development Guide

## Project Structure

```
Auto-NoteMover/
├── main.ts              # Main plugin entry point
├── tagParser.ts         # Tag extraction and tree building
├── noteMover.ts         # Note moving logic
├── treeView.ts          # Tree view UI component
├── settings.ts          # Settings panel
├── manifest.json        # Plugin metadata
├── package.json         # NPM dependencies
├── tsconfig.json        # TypeScript configuration
├── esbuild.config.mjs   # Build configuration
└── styles.css           # Custom styles
```

## Architecture

### Core Components

1. **TagParser** (`tagParser.ts`)
   - Extracts tags from note content (hashtags and frontmatter)
   - Builds hierarchical tree structure from tags
   - Determines target folder paths

2. **NoteMover** (`noteMover.ts`)
   - Handles file moving operations
   - Creates folders as needed
   - Provides preview functionality
   - Batch operations support

3. **TagTreeView** (`treeView.ts`)
   - Renders interactive tree UI
   - Displays tag hierarchy
   - Provides move buttons and file navigation
   - Handles user interactions

4. **Settings** (`settings.ts`)
   - Configuration panel
   - User preferences
   - Usage instructions

5. **Main Plugin** (`main.ts`)
   - Plugin lifecycle management
   - Command registration
   - Event handlers
   - View registration

## Development Workflow

### Setup

```bash
# Install dependencies
npm install

# Start development build (watch mode)
npm run dev
```

### Making Changes

1. Edit TypeScript files
2. esbuild will automatically rebuild
3. Reload Obsidian to see changes (Cmd/Ctrl + R in developer mode)

### Building for Production

```bash
npm run build
```

### Testing

1. Create test notes with various tag patterns
2. Test tag extraction
3. Test note moving
4. Test tree view interactions
5. Test settings changes

## Key Concepts

### Tag Hierarchy

Tags use `/` as a separator for hierarchy:
- `#parent` → single level
- `#parent/child` → two levels
- `#parent/child/grandchild` → three levels

### Tag Extraction

The plugin extracts tags from:
1. Inline hashtags: `#tag`
2. Frontmatter array: `tags: [tag1, tag2]`
3. Frontmatter list:
   ```yaml
   tags:
     - tag1
     - tag2
   ```

### Folder Determination

When a note has multiple tags:
- The deepest hierarchy wins
- Example: `#work` and `#work/projects/client` → moves to `work/projects/client/`

## API Reference

### TagParser

```typescript
// Extract tags from content
TagParser.extractTags(content: string): string[]

// Build tree structure
TagParser.buildTagTree(tags: string[]): TagNode

// Get target folder path
TagParser.getTargetFolder(tags: string[], rootFolder?: string): string

// Check if tag is child of another
TagParser.isChildTag(childTag: string, parentTag: string): boolean
```

### NoteMover

```typescript
// Move a single note
await noteMover.moveNoteByTags(file: TFile, rootFolder?: string): Promise<MoveResult>

// Move multiple notes
await noteMover.moveMultipleNotes(files: TFile[], rootFolder?: string): Promise<MoveResult[]>

// Preview move destination
await noteMover.previewMove(file: TFile, rootFolder?: string): Promise<string>

// Get all markdown files
noteMover.getAllMarkdownFiles(): TFile[]
```

## Adding New Features

### Example: Add a new command

```typescript
// In main.ts onload()
this.addCommand({
    id: 'my-new-command',
    name: 'My New Command',
    callback: async () => {
        // Your logic here
    }
});
```

### Example: Add a new setting

```typescript
// In settings.ts interface
export interface AutoNoteMoverSettings {
    // ... existing settings
    myNewSetting: boolean;
}

// In DEFAULT_SETTINGS
export const DEFAULT_SETTINGS: AutoNoteMoverSettings = {
    // ... existing defaults
    myNewSetting: false
};

// In display() method
new Setting(containerEl)
    .setName('My New Setting')
    .setDesc('Description of what it does')
    .addToggle(toggle => toggle
        .setValue(this.plugin.settings.myNewSetting)
        .onChange(async (value) => {
            this.plugin.settings.myNewSetting = value;
            await this.plugin.saveSettings();
        }));
```

## Debugging

### Enable Developer Tools

1. Open Obsidian
2. Press Cmd/Ctrl + Shift + I
3. Check Console tab for errors

### Common Issues

**TypeScript errors:**
- Run `npm run build` to see all errors
- Check type definitions in `node_modules/obsidian/obsidian.d.ts`

**Plugin not loading:**
- Check manifest.json is valid JSON
- Verify main.js exists and is not empty
- Check console for error messages

**Changes not appearing:**
- Make sure dev build is running
- Reload Obsidian after changes
- Clear cache if needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Resources

- [Obsidian API Documentation](https://github.com/obsidianmd/obsidian-api)
- [Obsidian Plugin Developer Docs](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

