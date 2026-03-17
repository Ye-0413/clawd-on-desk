#!/usr/bin/env node
// Clawd Desktop Pet — Claude Code Hook Script
// Zero dependencies, fast cold start, 1s timeout
// Usage: node clawd-hook.js <event_name>
// Reads stdin JSON from Claude Code for session_id

const EVENT_TO_STATE = {
  SessionStart: "idle",
  SessionEnd: "sleeping",
  UserPromptSubmit: "thinking",
  PreToolUse: "working",
  PostToolUse: "working",
  PostToolUseFailure: "error",
  Stop: "attention",
  SubagentStart: "juggling",
  SubagentStop: "working",
  PreCompact: "sweeping",
  PostCompact: "attention",
  Notification: "notification",
  PermissionRequest: "notification",
  Elicitation: "notification",
  WorktreeCreate: "carrying",
};

const event = process.argv[2];
const state = EVENT_TO_STATE[event];
if (!state) process.exit(0);

// Read stdin for session_id (Claude Code pipes JSON with session metadata)
const chunks = [];
let sent = false;

process.stdin.on("data", (c) => chunks.push(c));
process.stdin.on("end", () => {
  let sessionId = "default";
  try {
    const payload = JSON.parse(Buffer.concat(chunks).toString());
    sessionId = payload.session_id || "default";
  } catch {}
  send(sessionId);
});

// Safety: if stdin doesn't end in 200ms, send with default session
setTimeout(() => send("default"), 200);

function send(sessionId) {
  if (sent) return;
  sent = true;

  const data = JSON.stringify({ state, session_id: sessionId, event });
  const req = require("http").request(
    {
      hostname: "127.0.0.1",
      port: 23333,
      path: "/state",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
      timeout: 800,
    },
    () => process.exit(0)
  );
  req.on("error", () => process.exit(0));
  req.on("timeout", () => { req.destroy(); process.exit(0); });
  req.end(data);
}
