// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const KIT_JS = readFileSync(join(root, "dist/admin-kit.js"), "utf8");
const KIT_HTML = readFileSync(join(root, "dist/admin-kit.html"), "utf8");

function boot() {
  document.body.innerHTML = KIT_HTML;
  delete window.AdminKit;
  new Function(KIT_JS)();
  return {
    dialog: document.getElementById("akDialog"),
    title: document.getElementById("akDialogTitle"),
    message: document.getElementById("akDialogMsg"),
    input: document.getElementById("akDialogInput"),
    confirm: document.getElementById("akDialogConfirm"),
    cancel: document.getElementById("akDialogCancel"),
  };
}

describe("admin-kit dialog semantics", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    delete window.AdminKit;
  });

  it("ships a canonically named prompt input and no empty description", () => {
    const { dialog, message, input } = boot();

    expect(dialog.getAttribute("aria-labelledby")).toBe("akDialogTitle");
    expect(dialog.getAttribute("aria-describedby")).toBeNull();
    expect(input.getAttribute("aria-labelledby")).toBe("akDialogTitle");
    expect(input.getAttribute("aria-describedby")).toBeNull();
    expect(message.hidden).toBe(true);
  });

  it("names and describes a prompt from its title and visible message", async () => {
    const { dialog, title, message, input, confirm } = boot();
    const result = window.AdminKit.prompt({
      title: "Rename feed",
      message: "This name appears on the live calendar.",
      defaultValue: "Happenings",
    });

    expect(dialog.open).toBe(true);
    expect(title.textContent).toBe("Rename feed");
    expect(message.textContent).toBe("This name appears on the live calendar.");
    expect(message.hidden).toBe(false);
    expect(dialog.getAttribute("aria-describedby")).toBe(message.id);
    expect(input.getAttribute("aria-labelledby")).toBe(title.id);
    expect(input.getAttribute("aria-describedby")).toBe(message.id);
    expect(document.activeElement).toBe(input);

    input.value = "Community newsletter";
    confirm.click();
    await expect(result).resolves.toBe("Community newsletter");
  });

  it("removes stale descriptions when a later dialog has no message", async () => {
    const refs = boot();
    const first = window.AdminKit.prompt({ title: "First", message: "Previous detail" });
    refs.cancel.click();
    await expect(first).resolves.toBeNull();

    const second = window.AdminKit.prompt({ title: "Second" });
    expect(refs.message.textContent).toBe("");
    expect(refs.message.hidden).toBe(true);
    expect(refs.dialog.getAttribute("aria-describedby")).toBeNull();
    expect(refs.input.getAttribute("aria-describedby")).toBeNull();

    refs.cancel.click();
    await expect(second).resolves.toBeNull();
  });
});
