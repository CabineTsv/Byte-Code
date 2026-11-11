import { EditorSelection, findClusterBreak } from "@codemirror/state";
import { indentUnit } from "@codemirror/language";

const PAIRS = { "(": ")", "[": "]", "{": "}", "'": "'", '"': '"', "`": "`" };

export function pairsFor(opening) {
  const pairs = {};
  for (const character of opening) if (PAIRS[character]) pairs[character] = PAIRS[character];
  return pairs;
}

export function backspaceRange(lineText, column, unitColumns, pairs) {
  if (column <= 0) return null;
  const previous = lineText[column - 1];
  const next = lineText[column];
  if (next !== undefined && pairs[previous] === next) return { from: column - 1, to: column + 1 };
  if (unitColumns > 0 && /^ +$/.test(lineText.slice(0, column))) {
    const drop = column % unitColumns || unitColumns;
    return { from: column - drop, to: column };
  }
  return null;
}

function spaceUnit(state) {
  const unit = state.facet(indentUnit);
  return unit.length > 0 && !/[^ ]/.test(unit) ? unit.length : 0;
}

export function backspaceCommand(opening = [], { indentStops = true } = {}) {
  const pairs = pairsFor(opening);
  return (view) => {
    const { state } = view;
    if (state.readOnly) return false;
    if (state.selection.ranges.some((range) => !range.empty)) return false;
    const unit = indentStops ? spaceUnit(state) : 0;
    let special = false;
    const spec = state.changeByRange((range) => {
      const line = state.doc.lineAt(range.head);
      const column = range.head - line.from;
      const target = backspaceRange(line.text, column, unit, pairs);
      if (target) {
        special = true;
        return {
          changes: { from: line.from + target.from, to: line.from + target.to },
          range: EditorSelection.cursor(line.from + target.from),
        };
      }
      if (range.head === 0) return { range };
      const from = column === 0 ? range.head - 1 : line.from + findClusterBreak(line.text, column, false);
      return { changes: { from, to: range.head }, range: EditorSelection.cursor(from) };
    });
    if (!special) return false;
    view.dispatch(spec, { scrollIntoView: true, userEvent: "delete.backward" });
    return true;
  };
}

export function clipboardPayload(state, cut) {
  const ranges = state.selection.ranges.filter((range) => !range.empty);
  if (ranges.length > 0) {
    const text = ranges.map((range) => state.sliceDoc(range.from, range.to)).join(state.lineBreak);
    return { text, removeSelection: cut && !state.readOnly, removeRange: null };
  }
  if (state.doc.length === 0) return { text: "", removeSelection: false, removeRange: null };
  const line = state.doc.lineAt(state.selection.main.head);
  const end = Math.min(line.to + 1, state.doc.length);
  const lastLine = end === line.to;
  const text = state.sliceDoc(line.from, end) + (lastLine ? state.lineBreak : "");
  const from = lastLine && line.from > 0 ? line.from - 1 : line.from;
  const removeRange = cut && !state.readOnly ? { from, to: end } : null;
  return { text, removeSelection: false, removeRange };
}

export function lineRange(doc, pos) {
  const line = doc.lineAt(pos);
  return { from: line.from, to: Math.min(line.to + 1, doc.length) };
}
