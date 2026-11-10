# Test plan (on a device or emulator)

Run this list on a device or emulator before each release; it was written without access to an Android device,
emulator, SDK or NDK. Work through it after the first successful build and tick items off. Report
failures with the Logcat output and, for editor problems, the **Log** tab of the console.

## Application
- [ ] Launches without a crash (debug and release APK)
- [ ] With no file open the welcome screen shows (logo, Open folder, Open file, recent files); it disappears when a file opens and returns when the last tab is closed
- [ ] No white flash when launching in dark theme
- [ ] Rotating the device keeps the open files, caret and undo history (no editor reload)
- [ ] Phone layout: explorer is a drawer; tablet/landscape: docked with a draggable divider
- [ ] Settings persist after restarting the app
- [ ] Dark, light and "follow system" themes; each accent preset; a custom hex accent

## Open with (other apps)
- [ ] In a file manager, open a `.lua`, `.json`, `.md`, `.py`, `.html` and a file with no extension: ByteCode is listed in the chooser
- [ ] Choosing ByteCode opens the file in a new tab; opening a second file while ByteCode is running adds another tab
- [ ] Opening a file from a cold start (app not running, previous session had tabs) leaves the opened file as the active tab
- [ ] Editing and saving a file opened this way writes back to it, or shows a clear save error when the source app granted read-only access
- [ ] An image or other binary file is refused with a message instead of opening garbage
- [ ] A file manager that sends a raw `file://` path shows the "can't read this file directly" message; Open file works for the same file

## File explorer
- [ ] Open folder (internal storage and a cloud provider if available); folder is reopened on the next launch
- [ ] File and tab icons show the real language logos (Lua, Luau, Python, JavaScript, HTML, Markdown, …), readable in dark and light themes
- [ ] Create file / folder; rename; delete (with confirmation); refresh; collapse all
- [ ] Copy → paste, cut → paste (also into another folder); paste of a folder into itself is refused
- [ ] Import files into a folder; export a file
- [ ] Expanded folders are remembered

## Editor
- [ ] Several tabs; switching keeps text, selection, scroll position and undo history
- [ ] Unsaved dot appears on edit and disappears after saving
- [ ] Save, Save all, autosave (after delay / when leaving the file)
- [ ] Kill the app while a file has unsaved changes → restore prompt on the next open
- [ ] Find and replace, go to line, fold/unfold, toggle comment, indent/outdent, auto-indent, bracket matching, auto-close
- [ ] Word wrap, line numbers, font size/family, imported font, tab size, spaces/tabs
- [ ] Soft-keyboard: the caret stays visible; the extra keys do not close the keyboard
- [ ] Hardware keyboard: Ctrl+S, Ctrl+P, Ctrl+Shift+P, Ctrl+B, Ctrl+J, F5
- [ ] A 3 MB file opens as plain text; a 25 MB file is refused; a Latin-1 file opens read-only; CRLF and BOM survive a save

## Languages
- [ ] Highlighting for every extension in the README table
- [ ] `.luau`: highlighting of Roblox globals/methods, types, interpolation, `continue`
- [ ] `.luau`: completion (`game:GetService("`, `Instance.new("`, member lists, snippets)
- [ ] `.luau`: syntax error squiggle, Problems list entry, tapping it jumps to the line
- [ ] JSON syntax errors are underlined

## Execution
- [ ] Luau: `print`, `warn`, runtime error with traceback and clickable line, syntax error, infinite loop stopped by Stop and by the timeout, `game` raises the compatibility error
- [ ] JavaScript: `console.log/warn/error`, error with line number, `setTimeout`
- [ ] Shell: output, exit code, Stop
- [ ] Run button is hidden for languages without a runtime

## Search and navigation
- [ ] Go to file (Ctrl+P / menu), command palette, recent files, recent folders
- [ ] Search in files (plain, case-sensitive, regex); results open the file at the line

## Build and release
- [ ] `./gradlew :app:assembleDebug` locally
- [ ] GitHub Actions run (push, manual, release) uploads the APK artifact
- [ ] Signed release APK when the signing secrets are configured
