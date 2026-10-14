// Slash commands and the omnibar parser. Pure data + logic, no UI.

import type { Cmd, ExtractedInfo, ListKey } from "@/types";

export const LIST_CMDS: Cmd[] = [
  { cmd: "/todo",  alias: "/td", desc: "Todo",  type: "list", target: "todo"  },
  { cmd: "/watch", alias: "/wt", desc: "Watch", type: "list", target: "watch" },
  { cmd: "/later", alias: "/lt", desc: "Later", type: "list", target: "later" },
  { cmd: "/rough", alias: "/rg", desc: "Rough", type: "list", target: "rough" },
];

export const DATE_CMDS: Cmd[] = [
  { cmd: "/week",     alias: "/wk", desc: "This week",  type: "date", days: 7  },
  { cmd: "/nextweek", alias: "/nw", desc: "Next week",  type: "date", days: 14 },
  { cmd: "/month",    alias: "/mn", desc: "This month", type: "date", days: 30 },
];

export const PRIORITY_CMDS: Cmd[] = [
  { cmd: "/p1", alias: "/high", desc: "High",   type: "priority", priority: 1 },
  { cmd: "/p2", alias: "/med",  desc: "Medium", type: "priority", priority: 2 },
  { cmd: "/p3", alias: "/low",  desc: "Low",    type: "priority", priority: 3 },
];

export const ACTION_CMDS: Cmd[] = [
  { cmd: "/pin", alias: "/pin", desc: "Pin to Focus",      type: "action", action: "pin" },
  { cmd: "/did", alias: "/did", desc: "Log to Done today", type: "action", action: "did" },
];

export const SYS_CMDS: Cmd[] = [
  { cmd: "/help", alias: "/h", desc: "Help & preferences", type: "view" },
];

export const ALL_CMDS: Cmd[] = [...LIST_CMDS, ...DATE_CMDS, ...PRIORITY_CMDS, ...ACTION_CMDS, ...SYS_CMDS];

export const CMD_GROUPS: { type: Cmd["type"]; label: string }[] = [
  { type: "list",     label: "Send to"  },
  { type: "date",     label: "When"     },
  { type: "priority", label: "Priority" },
  { type: "action",   label: "Actions"  },
  { type: "view",     label: "App"      },
];

export const LIST_LABEL: Record<ListKey, string> = {
  todo: "Todo",
  watch: "Watch",
  later: "Later",
  rough: "Rough",
};

export function parseOmnibarInput(input: string): ExtractedInfo {
  let listMatch: ExtractedInfo["list"];
  let dateMatch: ExtractedInfo["date"];
  let priorityMatch: ExtractedInfo["priority"];
  let pinMatch: ExtractedInfo["pin"];
  let didMatch: ExtractedInfo["did"];

  const words = input.split(" ");
  const cleanWords: string[] = [];

  for (const w of words) {
    const lower = w.toLowerCase();
    const lCmd = LIST_CMDS.find(c => c.cmd === lower || c.alias === lower);
    if (lCmd && lCmd.target && !listMatch) {
      listMatch = { raw: w, key: lCmd.target, label: lCmd.desc };
      continue;
    }

    const dCmd = DATE_CMDS.find(c => c.cmd === lower || c.alias === lower);
    if (dCmd && dCmd.days && !dateMatch) {
      dateMatch = { raw: w, label: dCmd.desc, days: dCmd.days };
      continue;
    }

    const pCmd = PRIORITY_CMDS.find(c => c.cmd === lower || c.alias === lower);
    if (pCmd && pCmd.priority && !priorityMatch) {
      priorityMatch = { raw: w, level: pCmd.priority, label: `P${pCmd.priority}` };
      continue;
    }

    const aCmd = ACTION_CMDS.find(c => c.cmd === lower || c.alias === lower);
    if (aCmd) {
      if (aCmd.action === "pin" && !pinMatch) { pinMatch = { raw: w }; continue; }
      if (aCmd.action === "did" && !didMatch) { didMatch = { raw: w }; continue; }
    }

    // Strip every remaining slash token so no command text ever lands in a title.
    if (w.startsWith("/") && w.length > 1) continue;

    cleanWords.push(w);
  }

  return {
    list: listMatch,
    date: dateMatch,
    priority: priorityMatch,
    pin: pinMatch,
    did: didMatch,
    cleanText: cleanWords.join(" "),
  };
}
