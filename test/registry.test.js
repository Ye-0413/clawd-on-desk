const { describe, it } = require("node:test");
const assert = require("node:assert");
const registry = require("../agents/registry");

describe("Agent Registry", () => {
  it("should return all four agents", () => {
    const agents = registry.getAllAgents();
    assert.strictEqual(agents.length, 4);
    const ids = agents.map((a) => a.id);
    assert.ok(ids.includes("claude-code"));
    assert.ok(ids.includes("codex"));
    assert.ok(ids.includes("copilot-cli"));
    assert.ok(ids.includes("cursor-agent"));
  });

  it("should look up agents by ID", () => {
    assert.strictEqual(registry.getAgent("claude-code").name, "Claude Code");
    assert.strictEqual(registry.getAgent("codex").name, "Codex CLI");
    assert.strictEqual(registry.getAgent("copilot-cli").name, "Copilot CLI");
    assert.strictEqual(registry.getAgent("cursor-agent").name, "Cursor Agent");
    assert.strictEqual(registry.getAgent("nonexistent"), undefined);
  });

  it("should return correct process names for Windows", () => {
    // Temporarily mock platform if needed — just check the data structure
    const cc = registry.getAgent("claude-code");
    assert.deepStrictEqual(cc.processNames.win, ["claude.exe"]);
    assert.deepStrictEqual(cc.processNames.mac, ["claude"]);

    const codex = registry.getAgent("codex");
    assert.deepStrictEqual(codex.processNames.win, ["codex.exe"]);

    const copilot = registry.getAgent("copilot-cli");
    assert.deepStrictEqual(copilot.processNames.win, ["copilot.exe"]);
  });

  it("should include explicit Linux process names", () => {
    const cc = registry.getAgent("claude-code");
    assert.deepStrictEqual(cc.processNames.linux, ["claude"]);

    const codex = registry.getAgent("codex");
    assert.deepStrictEqual(codex.processNames.linux, ["codex"]);

    const copilot = registry.getAgent("copilot-cli");
    assert.deepStrictEqual(copilot.processNames.linux, ["copilot"]);
  });

  it("should leave cursor-agent process names empty (hook-driven; no IDE startup match)", () => {
    const c = registry.getAgent("cursor-agent");
    assert.deepStrictEqual(c.processNames.mac, []);
    assert.deepStrictEqual(c.processNames.win, []);
    assert.deepStrictEqual(c.processNames.linux, []);
  });

  it("should aggregate all process names", () => {
    const all = registry.getAllProcessNames();
    assert.ok(all.length >= 3);
    const expectedIds = new Set(registry.getAllAgents().map((a) => a.id));
    const agentIdsFromNames = new Set(all.map((p) => p.agentId));
    for (const id of expectedIds) {
      if (id === "cursor-agent") {
        assert.ok(
          !agentIdsFromNames.has("cursor-agent"),
          "cursor-agent has no process names for startup polling"
        );
        continue;
      }
      assert.ok(agentIdsFromNames.has(id), `expected process row for ${id}`);
    }
  });

  it("should have correct capabilities", () => {
    const cc = registry.getAgent("claude-code");
    assert.strictEqual(cc.capabilities.httpHook, true);
    assert.strictEqual(cc.capabilities.permissionApproval, true);
    assert.strictEqual(cc.capabilities.sessionEnd, true);
    assert.strictEqual(cc.capabilities.subagent, true);

    const codex = registry.getAgent("codex");
    assert.strictEqual(codex.capabilities.httpHook, false);
    assert.strictEqual(codex.capabilities.permissionApproval, false);
    assert.strictEqual(codex.capabilities.sessionEnd, false);
    assert.strictEqual(codex.capabilities.subagent, false);

    const copilot = registry.getAgent("copilot-cli");
    assert.strictEqual(copilot.capabilities.httpHook, false);
    assert.strictEqual(copilot.capabilities.permissionApproval, false);
    assert.strictEqual(copilot.capabilities.sessionEnd, true);
    assert.strictEqual(copilot.capabilities.subagent, true);

    const cursor = registry.getAgent("cursor-agent");
    assert.strictEqual(cursor.capabilities.httpHook, false);
    assert.strictEqual(cursor.capabilities.permissionApproval, false);
    assert.strictEqual(cursor.capabilities.sessionEnd, true);
    assert.strictEqual(cursor.capabilities.subagent, true);
  });

  it("should have eventMap for hook-based agents", () => {
    const cc = registry.getAgent("claude-code");
    assert.strictEqual(cc.eventMap.SessionStart, "idle");
    assert.strictEqual(cc.eventMap.PreToolUse, "working");
    assert.strictEqual(cc.eventMap.Stop, "attention");

    const copilot = registry.getAgent("copilot-cli");
    assert.strictEqual(copilot.eventMap.sessionStart, "idle");
    assert.strictEqual(copilot.eventMap.preToolUse, "working");
    assert.strictEqual(copilot.eventMap.agentStop, "attention");

    const cursor = registry.getAgent("cursor-agent");
    assert.strictEqual(cursor.eventMap.sessionStart, "idle");
    assert.strictEqual(cursor.eventMap.preToolUse, "working");
    assert.strictEqual(cursor.eventMap.afterAgentThought, "thinking");
    assert.strictEqual(cursor.eventMap.stop, "attention");
  });

  it("should have logEventMap for poll-based agents", () => {
    const codex = registry.getAgent("codex");
    assert.strictEqual(codex.logEventMap["session_meta"], "idle");
    assert.strictEqual(codex.logEventMap["event_msg:task_started"], "thinking");
    assert.strictEqual(codex.logEventMap["event_msg:task_complete"], "codex-turn-end");
    assert.strictEqual(codex.logEventMap["event_msg:turn_aborted"], "idle");
  });
});
