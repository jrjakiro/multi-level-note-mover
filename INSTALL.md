# Installation Guide

## Quick Install

The plugin has been successfully built! Here's how to install it in Obsidian:

### Method 1: Manual Installation (Recommended for Testing)

1. **Locate your Obsidian vault's plugins folder:**
   - Navigate to your vault folder
   - Go to `.obsidian/plugins/` (create this folder if it doesn't exist)

2. **Create the plugin folder:**
   ```bash
   mkdir -p /path/to/your/vault/.obsidian/plugins/auto-note-mover
   ```

3. **Copy the required files:**
   Copy these files from this directory to your vault's plugin folder:
   - `main.js` (the compiled plugin)
   - `manifest.json` (plugin metadata)
   - `styles.css` (optional, for styling)

   ```bash
   cp main.js manifest.json styles.css /path/to/your/vault/.obsidian/plugins/auto-note-mover/
   ```

4. **Reload Obsidian:**
   - Restart Obsidian, or
   - Go to Settings → Community Plugins → Reload plugins

5. **Enable the plugin:**
   - Go to Settings → Community Plugins
   - Find "Auto Note Mover" in the list
   - Toggle it on

### Method 2: Development Installation

If you want to continue developing the plugin:

1. **Clone/link this directory directly into your vault:**
   ```bash
   ln -s /Users/jr/Workspace/Projects/Auto-NoteMover /path/to/your/vault/.obsidian/plugins/auto-note-mover
   ```

2. **Run in development mode:**
   ```bash
   npm run dev
   ```
   This will watch for changes and rebuild automatically.

3. **Reload Obsidian** after each build to see changes.

## Verification

After installation, you should see:

1. **Ribbon Icon:** A folder-tree icon in the left sidebar
2. **Commands:** Open command palette (Cmd/Ctrl + P) and search for "Auto Note Mover"
3. **Settings:** A new "Auto Note Mover" section in Settings → Community Plugins

## First Steps

1. **Open the Tag Tree View:**
   - Click the folder-tree icon in the ribbon, or
   - Use command palette: "Open Tag Tree View"

2. **Add tags to a note:**
   ```markdown
   # My First Note
   #test/example
   
   This is a test note.
   ```

3. **Move the note:**
   - Use command: "Move current note by tags", or
   - Click "Move" in the Tag Tree View, or
   - Enable "Auto-move on save" in settings

4. **Check the result:**
   - The note should now be in `test/example/` folder

## Troubleshooting

### Plugin doesn't appear
- Make sure all three files (main.js, manifest.json, styles.css) are in the correct folder
- Check that the folder name is exactly `auto-note-mover`
- Restart Obsidian completely

### Plugin won't enable
- Check the console (Cmd/Ctrl + Shift + I) for errors
- Make sure you're using Obsidian version 0.15.0 or higher

### Notes aren't moving
- Check that the note has valid tags
- Verify settings (auto-move might be disabled)
- Check excluded folders list
- Look for error notifications

## Build Information

- **Build Date:** 2024-01-27
- **Version:** 1.0.0
- **Build Output:** main.js (20KB)
- **Status:** ✅ Build successful

## Next Steps

- Read [README.md](README.md) for full documentation
- Check [EXAMPLES.md](EXAMPLES.md) for usage examples
- Configure settings to your preference
- Start organizing your notes!

