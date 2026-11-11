package dev.bytecode.app.ui

import android.content.Context
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.PopupWindow
import android.widget.TextView
import androidx.annotation.DrawableRes
import dev.bytecode.app.AppCommand
import dev.bytecode.app.R

class EditToolsPopup(private val context: Context, private val onSelected: (AppCommand) -> Unit) {

    class Tool(val command: AppCommand, @DrawableRes val icon: Int, val enabled: Boolean = true)

    private var window: PopupWindow? = null

    val isShowing: Boolean
        get() = window?.isShowing == true

    fun dismiss() {
        window?.dismiss()
        window = null
    }

    fun show(anchor: View, groups: List<List<Tool>>) {
        dismiss()
        val column = LinearLayout(context)
        column.orientation = LinearLayout.VERTICAL
        column.setPadding(0, context.dp(6), 0, context.dp(6))
        groups.forEachIndexed { index, group ->
            if (index > 0) column.addView(divider())
            for (tool in group) column.addView(row(tool))
        }
        val popup = PopupWindow(column, context.dp(240), ViewGroup.LayoutParams.WRAP_CONTENT, false)
        popup.setBackgroundDrawable(background())
        popup.elevation = context.dp(10).toFloat()
        popup.isOutsideTouchable = true
        popup.setOnDismissListener { if (window === popup) window = null }
        window = popup
        popup.showAsDropDown(anchor, -context.dp(6), 0, Gravity.END)
    }

    private fun background(): GradientDrawable {
        val drawable = GradientDrawable()
        drawable.setColor(Palette.color(context, R.color.bc_surface_raised))
        drawable.cornerRadius = context.dp(14).toFloat()
        drawable.setStroke(context.dp(1), Palette.color(context, R.color.bc_border))
        return drawable
    }

    private fun divider(): View {
        val line = View(context)
        line.setBackgroundColor(Palette.color(context, R.color.bc_border))
        val params = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, context.dp(1))
        params.setMargins(context.dp(12), context.dp(4), context.dp(12), context.dp(4))
        line.layoutParams = params
        return line
    }

    private fun row(tool: Tool): View {
        val row = LinearLayout(context)
        row.orientation = LinearLayout.HORIZONTAL
        row.gravity = Gravity.CENTER_VERTICAL
        row.minimumHeight = context.dp(46)
        row.setPaddingRelative(context.dp(16), 0, context.dp(16), 0)
        row.setBackgroundResource(R.drawable.bg_item_ripple)
        row.alpha = if (tool.enabled) 1f else 0.38f

        val icon = ImageView(context)
        icon.setImageResource(tool.icon)
        icon.importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
        row.addView(icon, LinearLayout.LayoutParams(context.dp(20), context.dp(20)))

        val title = TextView(context)
        title.setText(tool.command.title)
        title.setTextColor(Palette.color(context, R.color.bc_text))
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
        title.maxLines = 1
        val titleParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        titleParams.marginStart = context.dp(16)
        row.addView(title, titleParams)

        val shortcut = tool.command.shortcut
        if (shortcut != null) {
            val hint = TextView(context)
            hint.text = shortcut
            hint.setTextColor(Palette.color(context, R.color.bc_text_secondary))
            hint.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            hint.maxLines = 1
            val hintParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
            hintParams.marginStart = context.dp(12)
            row.addView(hint, hintParams)
        }

        if (tool.enabled) {
            row.setOnClickListener {
                dismiss()
                onSelected(tool.command)
            }
        } else {
            row.isClickable = false
        }
        return row
    }
}
