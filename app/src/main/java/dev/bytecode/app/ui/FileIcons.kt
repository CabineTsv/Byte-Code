package dev.bytecode.app.ui

import androidx.annotation.DrawableRes
import dev.bytecode.app.R
import dev.bytecode.editor.LanguageRegistry

object FileIcons {

    private val imageExtensions = setOf("png", "jpg", "jpeg", "gif", "webp", "bmp", "ico", "heic", "avif")
    private val archiveExtensions = setOf("zip", "rar", "7z", "tar", "gz", "tgz", "bz2", "xz", "jar", "apk", "aab")
    private val configExtensions = setOf(
        "toml", "ini", "cfg", "conf", "properties", "gradle", "lock", "editorconfig", "gitignore", "gitattributes", "env"
    )
    private val textExtensions = setOf("txt", "log", "text")

    @DrawableRes
    fun forLanguage(languageId: String): Int = when (languageId) {
        "html" -> R.drawable.ic_lang_html
        "css" -> R.drawable.ic_lang_css
        "javascript" -> R.drawable.ic_lang_javascript
        "jsx" -> R.drawable.ic_lang_jsx
        "typescript" -> R.drawable.ic_lang_typescript
        "tsx" -> R.drawable.ic_lang_tsx
        "json" -> R.drawable.ic_lang_json
        "python" -> R.drawable.ic_lang_python
        "java" -> R.drawable.ic_lang_java
        "kotlin" -> R.drawable.ic_lang_kotlin
        "c" -> R.drawable.ic_lang_c
        "cpp" -> R.drawable.ic_lang_cpp
        "csharp" -> R.drawable.ic_lang_csharp
        "php" -> R.drawable.ic_lang_php
        "ruby" -> R.drawable.ic_lang_ruby
        "go" -> R.drawable.ic_lang_go
        "rust" -> R.drawable.ic_lang_rust
        "sql" -> R.drawable.ic_lang_sql
        "shell" -> R.drawable.ic_lang_shell
        "lua" -> R.drawable.ic_lang_lua
        "luau" -> R.drawable.ic_lang_luau
        "markdown" -> R.drawable.ic_lang_markdown
        "yaml" -> R.drawable.ic_lang_yaml
        "xml" -> R.drawable.ic_lang_xml
        else -> R.drawable.ic_file_text
    }

    @DrawableRes
    fun forFileName(name: String): Int {
        val extension = name.substringAfterLast('.', "").lowercase()
        val language = LanguageRegistry.forFileName(name)
        return when {
            language.id != LanguageRegistry.plainText.id -> forLanguage(language.id)
            extension in imageExtensions -> R.drawable.ic_file_image
            extension in archiveExtensions -> R.drawable.ic_file_archive
            extension in configExtensions -> R.drawable.ic_file_config
            extension in textExtensions -> R.drawable.ic_file_text
            else -> R.drawable.ic_file_generic
        }
    }
}
