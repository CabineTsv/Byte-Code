# Changelog

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
