import test from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("../harness/loader.mjs", import.meta.url);

const { backspaceRange, pairsFor } = await import("../src/editing.js");
const { leadingColumns, guideColumns } = await import("../src/indent-guides.js");

const all = pairsFor(["(", "[", "{", "'", '"', "`"]);

test("backspace on an empty pair removes both characters", () => {
  for (const [open, close] of [["(", ")"], ["[", "]"], ["{", "}"], ["'", "'"], ['"', '"'], ["`", "`"]]) {
    const text = `x = ${open}${close}`;
    assert.deepEqual(backspaceRange(text, 5, 4, all), { from: 4, to: 6 }, open);
  }
});

test("backspace beside a lone opening character removes only that character", () => {
  assert.equal(backspaceRange("call(abc)", 5, 4, all), null);
  assert.equal(backspaceRange("call(", 5, 4, all), null);
  assert.equal(backspaceRange("a(b)", 2, 4, all), null);
});

test("a pair is only removed when its kind is enabled", () => {
  const brackets = pairsFor(["(", "[", "{"]);
  assert.equal(backspaceRange('s = ""', 5, 4, brackets), null);
  assert.deepEqual(backspaceRange("f()", 2, 4, brackets), { from: 1, to: 3 });
  assert.equal(backspaceRange("f()", 2, 4, {}), null);
});

test("backspace in leading spaces removes back to the previous indent stop", () => {
  assert.deepEqual(backspaceRange("        x", 8, 4, {}), { from: 4, to: 8 });
  assert.deepEqual(backspaceRange("      x", 6, 4, {}), { from: 4, to: 6 });
  assert.deepEqual(backspaceRange("    x", 4, 4, {}), { from: 0, to: 4 });
  assert.deepEqual(backspaceRange("   ", 3, 4, {}), { from: 0, to: 3 });
  assert.deepEqual(backspaceRange("          ", 10, 2, {}), { from: 8, to: 10 });
});

test("backspace outside leading spaces falls through to the normal deletion", () => {
  assert.equal(backspaceRange("    x = 1", 7, 4, {}), null);
  assert.equal(backspaceRange("x    ", 5, 4, {}), null);
  assert.equal(backspaceRange("    x", 0, 4, {}), null);
  assert.equal(backspaceRange("\t\tx", 2, 4, {}), null);
  assert.equal(backspaceRange("    ", 4, 0, {}), null);
});

test("leading columns count spaces and tabs", () => {
  assert.deepEqual(leadingColumns("    x", 4), { columns: 4, blank: false });
  assert.deepEqual(leadingColumns("\t\tx", 4), { columns: 8, blank: false });
  assert.deepEqual(leadingColumns("  \tx", 4), { columns: 4, blank: false });
  assert.deepEqual(leadingColumns("    ", 4), { columns: 4, blank: true });
  assert.deepEqual(leadingColumns("", 4), { columns: 0, blank: true });
});

test("blank lines continue the guides of the surrounding block", () => {
  assert.equal(guideColumns("        x", 4, () => 99), 8);
  assert.equal(guideColumns("", 4, () => 8), 8);
  assert.equal(guideColumns("    ", 4, () => 0), 4);
  assert.equal(guideColumns("", 4, () => 0), 0);
});

const { clipboardPayload } = await import("../src/editing.js");

function fakeState(text, ranges, readOnly = false) {
  const lines = [];
  let from = 0;
  for (const raw of text.split("\n")) {
    lines.push({ from, to: from + raw.length });
    from += raw.length + 1;
  }
  return {
    readOnly,
    lineBreak: "\n",
    selection: { ranges: ranges.map(([a, b]) => ({ from: Math.min(a, b), to: Math.max(a, b), empty: a === b })), main: { head: ranges[0][1] } },
    doc: {
      length: text.length,
      lineAt: (pos) => lines.find((line) => pos >= line.from && pos <= line.to) || lines[lines.length - 1],
    },
    sliceDoc: (a, b) => text.slice(a, b),
  };
}

test("copy takes the selected text and leaves the document alone", () => {
  const payload = clipboardPayload(fakeState("alpha beta", [[6, 10]]), false);
  assert.deepEqual(payload, { text: "beta", removeSelection: false, removeRange: null });
});

test("cut removes the selection, except in a read-only document", () => {
  assert.equal(clipboardPayload(fakeState("alpha beta", [[0, 5]]), true).removeSelection, true);
  assert.equal(clipboardPayload(fakeState("alpha beta", [[0, 5]], true), true).removeSelection, false);
  assert.equal(clipboardPayload(fakeState("alpha beta", [[0, 5]], true), true).text, "alpha");
});

test("several selections are joined with line breaks", () => {
  assert.equal(clipboardPayload(fakeState("one two three", [[0, 3], [8, 13]]), false).text, "one\nthree");
});

test("with nothing selected, copy and cut take the whole line", () => {
  const state = () => fakeState("first\nsecond\nthird", [[8, 8]]);
  assert.equal(clipboardPayload(state(), false).text, "second\n");
  assert.deepEqual(clipboardPayload(state(), true).removeRange, { from: 6, to: 13 });
  assert.equal(clipboardPayload(state(), false).removeRange, null);
});

test("cutting the last line does not leave an empty line behind", () => {
  const payload = clipboardPayload(fakeState("first\nsecond\nthird", [[16, 16]]), true);
  assert.equal(payload.text, "third\n");
  assert.deepEqual(payload.removeRange, { from: 12, to: 18 });
});

test("an empty document has nothing to copy", () => {
  assert.equal(clipboardPayload(fakeState("", [[0, 0]]), false).text, "");
});

test("a read-only document never removes a line", () => {
  assert.equal(clipboardPayload(fakeState("a\nb", [[0, 0]], true), true).removeRange, null);
});

const { lineRange } = await import("../src/editing.js");

test("tapping a line number selects the line including its line break", () => {
  const state = fakeState("first\nsecond\nthird", [[0, 0]]);
  assert.deepEqual(lineRange(state.doc, 8), { from: 6, to: 13 });
  assert.deepEqual(lineRange(state.doc, 0), { from: 0, to: 6 });
});

test("the last line is selected without a line break to take", () => {
  const state = fakeState("first\nsecond\nthird", [[0, 0]]);
  assert.deepEqual(lineRange(state.doc, 15), { from: 13, to: 18 });
});
