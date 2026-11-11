# Changelog

## 1.1.0

**Fixed**
- Pressing Enter after `pcall(function()` (or any line that opens a call and a function) indented two levels instead
  of one, and `end)` stayed one level too deep. The indenter counted every bracket and keyword, so one line could add
  several levels. It now remembers the indent of the line each block opened on, like VS Code. Applies to Luau and plain
  Lua. Regression tests cover nested callbacks, tables, multi-line arguments and control flow.
- Luau inline `if` expressions (`local x = if a then 1 else 2`) left the rest of the file indented one level too deep,
  because their `then` opened a block that no `end` closes. They are now recognised as expressions.

**Added**
- Edit tools: a toolbar button that groups select all, select line, cut, copy, paste, search, go to line, toggle
  comment, duplicate line and delete line. The menu does not take focus, so the keyboard stays open.
- Tap a line number to select the whole line (including its line break), so one Backspace deletes it.
- Copy and Cut with nothing selected act on the current line. The clipboard is handled natively, so it works the same
  in every WebView version.
- Search is now labelled *Search* (it still opens find and replace).

## 1.0.0

**Opens files from other apps**
- ByteCode is now offered in Android's *Open with* and *Edit with* chooser for every file type. Previously the app
  declared no `VIEW`/`EDIT` intent filters, so it never appeared. Both `content://` and `file://` URIs are accepted,
  with and without a MIME type.
- Files opened this way land in a new tab, also when ByteCode is already running (`onNewIntent`) and when the
  previous session is still being restored.
- A `file://` path that Android does not let ByteCode read produces a clear message instead of a silent failure.

**New look**
- New launcher icon: two chevrons and an accent slash on a dark tile, with a themed (monochrome) variant.
- Real language logos (Simple Icons, Material Design Icons) replace the hand-drawn glyphs and letter badges, in the
  explorer, tabs, welcome screen and status bar. Images, archives and config files get their own icons.
- One consistent set of interface icons (Material Design Icons) for toolbar, explorer, console and extra keys.
- Flat toolbar and tab strip, hairline separators, rounded selection rows, rounded extra keys and dialog fields,
  a quieter light and dark palette, and a window background that avoids a white flash on launch.
- Welcome screen with *Open folder*, *Open file* and recent files when no file is open.
- Editor colours (background, panels, borders, tooltips) match the new native palette.

**Removed**
- `ui/FileIconDrawable.kt` and `ui/LanguageGlyphs.kt` (replaced by `ui/FileIcons.kt` and vector drawables). If your
  repository still contains them, delete them.
