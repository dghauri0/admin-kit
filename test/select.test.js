// @vitest-environment happy-dom
//
// Behaviour tests for the kit's dropdown. Ported from the calendar repo's
// src/admin/select.js tests, which this component supersedes — the coverage
// moves with the code rather than being dropped.
import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const KIT_JS = readFileSync(join(root, "dist/admin-kit.js"), "utf8");
const KIT_HTML = readFileSync(join(root, "dist/admin-kit.html"), "utf8");

function boot() {
  document.body.innerHTML = `
    ${KIT_HTML}
    <label for="kind">Email template</label>
    <select id="kind" class="ak-select-src">
      <option value="magic-link">Magic link email</option>
      <option value="renewal-14d">Renewal (14-day)</option>
      <option value="renewal-3d">Renewal (3-day)</option>
    </select>
  `;
  delete window.AdminKit;
  new Function(KIT_JS)();               // defines window.AdminKit
  window.AdminKit.enhance(document);
  return {
    select: document.getElementById("kind"),
    widget: document.querySelector(".ak-select"),
  };
}

describe("admin-kit dropdown", () => {
  beforeEach(() => { document.body.innerHTML = ""; });

  it("exposes the documented API", () => {
    boot();
    for (const fn of ["confirm", "alert", "prompt", "toast", "enhance", "refresh"]) {
      expect(typeof window.AdminKit[fn], fn).toBe("function");
    }
  });

  it("renders a custom widget and keeps the native select as the value store", () => {
    const { select, widget } = boot();
    expect(widget).toBeTruthy();
    expect(select.isConnected).toBe(true);
    expect(select.value).toBe("magic-link");
  });

  it("never leaves the native control as the visible interactive element", () => {
    const { select } = boot();
    // Either hidden from AT or visually removed — the kit must not present two
    // competing controls for one value.
    const cs = getComputedStyle(select);
    const hidden =
      select.getAttribute("aria-hidden") === "true" ||
      cs.position === "absolute" ||
      cs.display === "none" ||
      cs.opacity === "0";
    expect(hidden).toBe(true);
  });

  it("refresh() re-syncs the label after a programmatic .value set", () => {
    const { select, widget } = boot();
    select.value = "renewal-3d";
    window.AdminKit.refresh(document);
    expect(widget.textContent).toContain("Renewal (3-day)");
  });

  it("is idempotent — enhancing twice does not double-render", () => {
    boot();
    window.AdminKit.enhance(document);
    expect(document.querySelectorAll(".ak-select")).toHaveLength(1);
  });
});
