# Multi Level Note Mover

An [Obsidian](https://obsidian.md) plugin that automatically organizes your notes based on tags using a hierarchical folder structure.

## Features

- **Tag-based Organization**: Automatically move notes to folders based on their tags
- **Hierarchical Support**: Supports nested tags like `#parent/child/grandchild`
- **Tree View Interface**: Visual sidebar showing your tag hierarchy with file counts
- **Auto-move**: Optionally move notes automatically when saved
- **Preview Mode**: See where a note will be moved before committing
- **Batch Operations**: Move multiple notes at once from the tree view
- **Excluded Folders**: Configure folders to ignore during auto-move

## How It Works

The plugin maps your tags to folders:

| Tag | Destination Folder |
|-----|-------------------|
| `#projects` | `projects/` |
| `#work/meetings` | `work/meetings/` |
| `#work/projects/client-a` | `work/projects/client-a/` |

When a note has multiple tags, the deepest hierarchy wins.

### Example

```markdown
# Meeting Notes
#meetings
#projects/work/client-a

→ Moves to: projects/work/client-a/Meeting Notes.md
```

## Installation

### From Community Plugins

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Multi Level Note Mover"
4. Install the plugin and enable it

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/jrjakiro/multi-level-note-mover/releases/latest)
2. Create a folder called `multi-level-note-mover` in your vault's `.obsidian/plugins/` directory
3. Copy the downloaded files into this folder
4. Reload Obsidian and enable the plugin in Settings → Community Plugins

## Usage

### Tag Tree View

Open the tree view by:
- Clicking the folder tree icon in the ribbon, or
- Using command palette: "Open Tag Tree View"

The tree view displays:
- All tags organized hierarchically
- File count for each tag
- Notes grouped under their tags
- Move buttons for batch operations

### Commands

| Command | Description |
|---------|-------------|
| Open Tag Tree View | Opens the tag tree sidebar |
| Move current note by tags | Moves the active note based on its tags |
| Move all notes by tags | Batch move all notes in the vault |
| Preview move for current note | Shows destination without moving |

### Settings

| Setting | Description |
|---------|-------------|
| Auto-move on save | Move notes automatically when saved |
| Show notifications | Display notifications when notes are moved |
| Excluded folders | Comma-separated list of folders to skip |
| Folder rules | Configure tag → folder mappings |

## Development

```bash
# Clone into your vault's plugins folder
git clone https://github.com/jrjakiro/multi-level-note-mover.git .obsidian/plugins/multi-level-note-mover

# Install dependencies
npm install

# Development build with watch mode
npm run dev

# Production build
npm run build
```

## Support

If you encounter issues or have feature requests, please [open an issue](https://github.com/jrjakiro/multi-level-note-mover/issues) on GitHub.

## License

[MIT](LICENSE)
