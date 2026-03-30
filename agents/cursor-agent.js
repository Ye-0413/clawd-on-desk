// Cursor IDE — Agent (Composer) hooks via ~/.cursor/hooks.json
// Event names are camelCase (Cursor hook spec); cursor-hook.js normalizes to PascalCase for the state machine.

module.exports = {
  id: "cursor-agent",
  name: "Cursor Agent",
  // Hook-driven only; the IDE binary is not a reliable active-agent-session signal for startup recovery.
  processNames: { win: [], mac: [], linux: [] },
  nodeCommandPatterns: [],
  eventSource: "hook",
  eventMap: {
    sessionStart: "idle",
    sessionEnd: "sleeping",
    beforeSubmitPrompt: "thinking",
    preToolUse: "working",
    postToolUse: "working",
    postToolUseFailure: "error",
    stop: "attention",
    subagentStart: "juggling",
    subagentStop: "working",
    preCompact: "sweeping",
    afterAgentThought: "thinking",
  },
  capabilities: {
    httpHook: false,
    permissionApproval: false,
    sessionEnd: true,
    subagent: true,
  },
  hookConfig: {
    configFormat: "cursor-hooks-json",
  },
  stdinFormat: "cursorHookJson",
  pidField: "cursor_pid",
};
