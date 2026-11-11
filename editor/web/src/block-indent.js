const LINE_STARTS_WITH_CLOSER = /^(?:(?:end|else|elseif|until)(?![A-Za-z0-9_])|[)}\]])/;
const LUA_OPEN = /^(?:function|if|repeat|do|\(|\{|\[)$/;
const LUA_CLOSE = /^(?:end|until|\)|\}|\])$/;

export function newBlockState() {
  return { levels: [], lineLevel: -1 };
}

export function copyBlockState(from, to) {
  to.levels = from.levels.slice();
  to.lineLevel = from.lineLevel;
  return to;
}

export function levelFor(state, rest) {
  const count = state.levels.length;
  if (count === 0) return 0;
  const top = state.levels[count - 1];
  return LINE_STARTS_WITH_CLOSER.test(rest.replace(/^\s+/, "")) ? top : top + 1;
}

export function startLine(state) {
  state.lineLevel = -1;
}

export function markLine(state, stream) {
  if (state.lineLevel >= 0) return;
  const rest = stream.string.slice(stream.pos);
  if (rest.trim() === "") return;
  state.lineLevel = levelFor(state, rest);
}

export function openBlock(state) {
  state.levels.push(state.lineLevel >= 0 ? state.lineLevel : levelFor(state, ""));
}

export function closeBlock(state) {
  state.levels.pop();
}

export function indentColumns(state, textAfter, unit) {
  return levelFor(state, textAfter) * unit;
}

export function withBlockIndent(mode) {
  return {
    ...mode,
    startState() {
      return Object.assign(mode.startState(), newBlockState());
    },
    copyState(state) {
      const copy = mode.copyState ? mode.copyState(state) : Object.assign({}, state);
      return copyBlockState(state, copy);
    },
    token(stream, state) {
      if (stream.sol()) startLine(state);
      markLine(state, stream);
      const style = mode.token(stream, state);
      if (style !== "comment" && style !== "string") {
        const text = stream.current();
        if (LUA_OPEN.test(text)) openBlock(state);
        else if (LUA_CLOSE.test(text)) closeBlock(state);
      }
      return style;
    },
    indent(state, textAfter, context) {
      return indentColumns(state, textAfter, context.unit);
    },
  };
}
