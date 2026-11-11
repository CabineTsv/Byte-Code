import test from "node:test";
import assert from "node:assert/strict";
import { startState, copyState, token, indent } from "../src/luau/tokenizer.js";
import { withBlockIndent } from "../src/block-indent.js";

class MockStream {
  constructor(line) { this.string = line; this.pos = 0; this.start = 0; }
  sol() { return this.pos === 0; }
  eol() { return this.pos >= this.string.length; }
  peek() { return this.string.charAt(this.pos) || undefined; }
  next() { if (this.pos < this.string.length) return this.string.charAt(this.pos++); return undefined; }
  eat(m) {
    const ch = this.string.charAt(this.pos);
    const ok = typeof m === "string" ? ch === m : m.test(ch);
    if (ok) { this.pos++; return ch; }
    return undefined;
  }
  eatSpace() { const s = this.pos; while (/[\s\u00a0]/.test(this.string.charAt(this.pos))) this.pos++; return this.pos > s; }
  skipToEnd() { this.pos = this.string.length; }
  match(pattern, consume) {
    if (typeof pattern === "string") {
      if (this.string.substr(this.pos, pattern.length) === pattern) {
        if (consume !== false) this.pos += pattern.length;
        return true;
      }
      return null;
    }
    const m = this.string.slice(this.pos).match(pattern);
    if (m && m.index > 0) return null;
    if (m && consume !== false) this.pos += m[0].length;
    return m;
  }
  current() { return this.string.slice(this.start, this.pos); }
}

function fakeLegacyLua() {
  return {
    name: "lua",
    startState: () => ({ basecol: 0, indentDepth: 0 }),
    token(stream) {
      if (stream.eatSpace()) return null;
      const rest = stream.string.slice(stream.pos);
      let m;
      if ((m = /^--.*/.exec(rest))) { stream.pos += m[0].length; return "comment"; }
      if ((m = /^"[^"]*"/.exec(rest))) { stream.pos += m[0].length; return "string"; }
      if ((m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(rest))) { stream.pos += m[0].length; return "variable"; }
      stream.next();
      return null;
    },
    indent: () => 0,
  };
}

function walk(lines, mode, unit) {
  const state = mode.startState();
  const results = [];
  for (const raw of lines) {
    const text = raw.trim();
    results.push(mode.indent(state, text, { unit }));
    const stream = new MockStream(raw);
    while (!stream.eol()) {
      stream.start = stream.pos;
      const before = stream.pos;
      mode.token(stream, state);
      assert.ok(stream.pos > before);
    }
  }
  return results;
}

const luauMode = { startState, copyState, token, indent };
const luaMode = withBlockIndent(fakeLegacyLua());

const expectedColumns = (lines, unit) =>
  lines.map((line) => {
    const lead = /^ */.exec(line)[0].length;
    return lead;
  });

const SAMPLES = {
  pcall: [
    "local succ, err = pcall(function()",
    "    error(\"should work\")",
    "end)",
    "print(succ)",
  ],
  nestedCallbacks: [
    "Players.PlayerAdded:Connect(function(player)",
    "    player.CharacterAdded:Connect(function(character)",
    "        task.spawn(function()",
    "            print(character)",
    "        end)",
    "    end)",
    "end)",
  ],
  tableWithCallback: [
    "local config = {",
    "    name = \"x\",",
    "    run = function()",
    "        return 1",
    "    end,",
    "    nested = {",
    "        a = 1,",
    "    },",
    "}",
  ],
  closerThenReopen: [
    "local x = foo({",
    "    a = 1,",
    "}, function()",
    "    b()",
    "end)",
  ],
  controlFlow: [
    "local function f(a)",
    "    if a then",
    "        print(1)",
    "    elseif b then",
    "        print(2)",
    "    else",
    "        print(3)",
    "    end",
    "    for i = 1, 3 do",
    "        pcall(function()",
    "            work(i)",
    "        end)",
    "    end",
    "    repeat",
    "        step()",
    "    until done",
    "end",
  ],
  argumentsOnSeveralLines: [
    "call(",
    "    first,",
    "    second",
    ")",
    "after()",
  ],
};

for (const [name, mode] of [["luau", luauMode], ["lua", luaMode]]) {
  for (const [sample, lines] of Object.entries(SAMPLES)) {
    test(`${name}: every line of "${sample}" re-indents to where it already sits`, () => {
      assert.deepEqual(walk(lines, mode, 4), expectedColumns(lines, 4));
    });
  }

  test(`${name}: a line that opens a call and a function indents once`, () => {
    const state = mode.startState();
    const stream = new MockStream("local succ, err = pcall(function()");
    while (!stream.eol()) { stream.start = stream.pos; mode.token(stream, state); }
    assert.equal(mode.indent(state, "", { unit: 4 }), 4);
    assert.equal(mode.indent(state, "end)", { unit: 4 }), 0);
    assert.equal(mode.indent(state, "end)", { unit: 2 }), 0);
    assert.equal(mode.indent(state, "x()", { unit: 2 }), 2);
  });

  test(`${name}: copied state is independent`, () => {
    const state = mode.startState();
    const stream = new MockStream("foo(function()");
    while (!stream.eol()) { stream.start = stream.pos; mode.token(stream, state); }
    const copy = mode.copyState(state);
    const more = new MockStream("bar(function()");
    while (!more.eol()) { more.start = more.pos; mode.token(more, copy); }
    assert.equal(mode.indent(state, "x", { unit: 4 }), 4);
    assert.equal(mode.indent(copy, "x", { unit: 4 }), 8);
  });
}

test("luau: strings and comments never open blocks", () => {
  const lines = ["local s = \"function(\"", "-- if ( {", "print(s)"];
  assert.deepEqual(walk(lines, luauMode, 4), [0, 0, 0]);
  assert.deepEqual(walk(lines, luaMode, 4), [0, 0, 0]);
});

function stateAfter(lines) {
  const state = startState();
  for (const raw of lines) {
    const stream = new MockStream(raw);
    while (!stream.eol()) { stream.start = stream.pos; token(stream, state); }
  }
  return state;
}

test("luau: an inline if expression does not leave a block open", () => {
  for (const line of [
    "local x = if a then 1 else 2",
    "return if a then 1 else 2",
    "foo(if a then 1 else 2, if b then 3 else 4)",
    "local t = { if a then 1 else 2, 5 }",
    "local ok = a and if b then 1 else 2",
    "local label = if score > 10 then \"high\" elseif score > 5 then \"mid\" else \"low\"",
  ]) {
    const state = stateAfter([line]);
    assert.equal(state.levels.length, 0, line);
    assert.equal(indent(state, "", { unit: 4 }), 0, line);
  }
});

test("luau: an if expression split over several lines closes without an end", () => {
  const state = stateAfter(["local label = if score > 10", "    then \"high\"", "    else \"low\""]);
  assert.equal(state.levels.length, 0);
});

test("luau: an if expression nested in another if expression", () => {
  assert.equal(stateAfter(["local x = if a then (if b then 1 else 2) else 3"]).levels.length, 0);
});

test("luau: if statements still open a block next to if expressions", () => {
  const lines = [
    "local function f(a)",
    "    local v = if a then 1 else 2",
    "    if v > 1 then",
    "        print(if a then \"x\" else \"y\")",
    "    end",
    "    return v",
    "end",
  ];
  assert.deepEqual(walk(lines, luauMode, 4), [0, 4, 4, 8, 4, 4, 0]);
  assert.equal(stateAfter(lines).levels.length, 0);
});

test("luau: a condition containing an if expression still opens its block", () => {
  const state = stateAfter(["if (if a then b else c) then"]);
  assert.equal(state.levels.length, 1);
});
