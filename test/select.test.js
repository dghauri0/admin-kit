// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const KIT_JS = readFileSync(join(root, "dist/admin-kit.js"), "utf8");
const KIT_CSS = readFileSync(join(root, "dist/admin-kit.css"), "utf8");
const KIT_HTML = readFileSync(join(root, "dist/admin-kit.html"), "utf8");

function fixture(selectMarkup) {
  document.head.innerHTML = `<style>${KIT_CSS}</style>`;
  document.body.innerHTML = `${KIT_HTML}${selectMarkup}`;
}

function runKit() {
  delete window.AdminKit;
  new Function(KIT_JS)();
  window.AdminKit.enhance(document);
}

function boot(selectMarkup = `
  <label for="kind">Email template</label>
  <select id="kind" name="kind" data-ak-select required aria-describedby="kind-hint">
    <option value="magic-link">Magic link email</option>
    <option value="renewal-14d">Renewal (14-day)</option>
    <option value="renewal-3d">Renewal (3-day)</option>
  </select>
  <p id="kind-hint">Choose the message to send.</p>
`) {
  fixture(selectMarkup);
  runKit();
  return {
    select: document.querySelector("select"),
    widget: document.querySelector(".ak-select"),
    trigger: document.querySelector(".ak-select-trigger"),
    panel: document.querySelector(".ak-select-panel"),
  };
}

function key(target, key) {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
}

describe("admin-kit dropdown", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("exposes the documented API", () => {
    boot();
    for (const fn of ["confirm", "alert", "prompt", "toast", "enhance", "refresh"]) {
      expect(typeof window.AdminKit[fn], fn).toBe("function");
    }
  });

  it("ships real date-navigation glyphs instead of escaped source text", () => {
    expect(KIT_JS).toContain("‹");
    expect(KIT_JS).toContain("›");
    expect(KIT_JS).not.toContain("\\\\u2039");
    expect(KIT_CSS).toContain('content: "📅"');
  });

  it("leaves the native source visible and usable before JavaScript runs", () => {
    fixture(`<label for="kind">Kind</label><select id="kind" data-ak-select><option>One</option></select>`);
    const select = document.querySelector("select");

    expect(document.querySelector(".ak-select")).toBeNull();
    expect(select.classList.contains("ak-select-src")).toBe(false);
    expect(getComputedStyle(select).position).not.toBe("absolute");
    expect(select.getAttribute("aria-hidden")).toBeNull();
  });

  it("renders an accessible combobox and keeps the native select as the form value store", () => {
    const { select, widget, trigger, panel } = boot();
    const label = document.querySelector("label");
    const listbox = panel.querySelector('[role="listbox"]');

    expect(widget).toBeTruthy();
    expect(select.isConnected).toBe(true);
    expect(select.value).toBe("magic-link");
    expect(select.classList.contains("ak-select-src")).toBe(true);
    expect(select.getAttribute("aria-hidden")).toBe("true");
    expect(trigger.getAttribute("role")).toBe("combobox");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBe(listbox.id);
    expect(trigger.getAttribute("aria-describedby")).toBe("kind-hint");
    expect(trigger.getAttribute("aria-required")).toBe("true");
    expect(label.htmlFor).toBe(trigger.id);

    select.focus();
    expect(document.activeElement).toBe(trigger);
  });

  it("selects by pointer, dispatches one change, and returns focus", () => {
    const { select, trigger, panel } = boot();
    const events = [];
    const onChange = vi.fn();
    select.addEventListener("input", () => events.push("input"));
    select.addEventListener("change", () => events.push("change"));
    select.addEventListener("change", onChange);

    trigger.click();
    panel.querySelector('[data-idx="2"]').click();

    expect(select.value).toBe("renewal-3d");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(events).toEqual(["input", "change"]);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("does not select disabled rows and preserves native form serialization", () => {
    const { select, trigger, panel } = boot(`
      <form id="settings"><label for="kind">Kind</label>
      <select id="kind" name="kind" data-ak-select>
        <option value="one">One</option><option value="two" disabled>Two</option>
      </select></form>
    `);
    const onChange = vi.fn();
    select.addEventListener("change", onChange);

    trigger.click();
    panel.querySelector('[data-idx="1"]').click();

    expect(select.value).toBe("one");
    expect(onChange).not.toHaveBeenCalled();
    expect(new FormData(document.getElementById("settings")).get("kind")).toBe("one");
  });

  it("supports Arrow, Home, End, Enter, and Escape while skipping disabled options", () => {
    const { select, trigger } = boot(`
      <label for="kind">Kind</label>
      <select id="kind" data-ak-select>
        <option value="one">One</option>
        <option value="two" disabled>Two</option>
        <option value="three">Three</option>
        <option value="four">Four</option>
      </select>
    `);

    trigger.focus();
    key(trigger, "ArrowDown");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    key(trigger, "ArrowDown");
    key(trigger, "Enter");
    expect(select.value).toBe("three");
    expect(document.activeElement).toBe(trigger);

    key(trigger, "End");
    key(trigger, "Enter");
    expect(select.value).toBe("four");

    key(trigger, "Home");
    key(trigger, "Escape");
    expect(select.value).toBe("four");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("supports buffered type-ahead on short lists", () => {
    const { select, trigger } = boot(`
      <label for="kind">Kind</label>
      <select id="kind" data-ak-select>
        <option value="alpha">Alpha</option>
        <option value="beta">Beta</option>
        <option value="zulu">Zulu renewal</option>
      </select>
    `);

    trigger.focus();
    key(trigger, "z");
    key(trigger, "u");
    key(trigger, "Enter");

    expect(select.value).toBe("zulu");
  });

  it("commits the visibly active short-list choice on Tab without trapping focus", () => {
    const { select, trigger } = boot();
    trigger.focus();
    key(trigger, "ArrowDown");
    key(trigger, "ArrowDown");
    key(trigger, "Tab");

    expect(select.value).toBe("renewal-14d");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("does not commit an Escape-cancelled or click-collapsed choice on a later Tab", () => {
    const { select, trigger } = boot();
    trigger.focus();
    key(trigger, "ArrowDown");
    key(trigger, "ArrowDown");
    key(trigger, "Escape");
    key(trigger, "Tab");
    expect(select.value).toBe("magic-link");

    trigger.click();
    key(trigger, "ArrowDown");
    trigger.click();
    key(trigger, "Tab");
    expect(select.value).toBe("magic-link");
  });

  it("does not swallow Escape while the dropdown is closed", () => {
    const { trigger } = boot();
    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    trigger.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it("adds search and preserves optgroup semantics for long lists", () => {
    const choices = Array.from({ length: 13 }, (_, index) =>
      `<option value="role-${index}">${index === 12 ? "House Auditor" : `Role ${index}`}</option>`
    ).join("");
    const { select, trigger, panel } = boot(`
      <label for="role">Role</label>
      <select id="role" data-ak-select><optgroup label="House roles">${choices}</optgroup></select>
    `);
    const search = panel.querySelector('input[type="search"]');

    expect(panel.querySelector('[role="group"]').getAttribute("aria-label")).toBe("House roles");
    expect(search.getAttribute("aria-label")).toBe("Search Role");
    trigger.click();
    expect(document.activeElement).toBe(search);
    search.value = "auditor";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    expect(panel.querySelectorAll(".ak-option:not([hidden])")).toHaveLength(1);
    key(search, "Enter");
    expect(select.value).toBe("role-12");
    expect(document.activeElement).toBe(trigger);
  });

  it("does not commit a stale hidden row when search has no matches", () => {
    const choices = Array.from({ length: 13 }, (_, index) =>
      `<option value="role-${index}">Role ${index}</option>`
    ).join("");
    const { select, trigger, panel } = boot(`<label for="role">Role</label><select id="role" data-ak-select>${choices}</select>`);
    const search = panel.querySelector('input[type="search"]');
    const onChange = vi.fn();
    select.addEventListener("change", onChange);

    trigger.click();
    search.value = "role 12";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    search.value = "no such role";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    key(search, "Enter");

    expect(select.value).toBe("role-0");
    expect(onChange).not.toHaveBeenCalled();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("commits the active searched choice on Tab", () => {
    const choices = Array.from({ length: 13 }, (_, index) =>
      `<option value="role-${index}">Role ${index}</option>`
    ).join("");
    const { select, trigger, panel } = boot(`<label for="role">Role</label><select id="role" data-ak-select>${choices}</select>`);
    const search = panel.querySelector('input[type="search"]');

    trigger.click();
    search.value = "role 12";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    key(search, "Tab");

    expect(select.value).toBe("role-12");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("does not enhance multiple or size-based listboxes", () => {
    fixture(`
      <select id="multi" data-ak-select multiple><option>One</option><option>Two</option></select>
      <select id="sized" class="ak-select-src" size="3"><option>One</option><option>Two</option></select>
    `);
    runKit();

    expect(document.querySelectorAll(".ak-select")).toHaveLength(0);
    for (const select of document.querySelectorAll("select")) {
      expect(select.getAttribute("aria-hidden")).toBeNull();
      expect(getComputedStyle(select).position).not.toBe("absolute");
    }
  });

  it("leaves an implicitly labelled select native instead of nesting a generated button", () => {
    fixture(`<label>Kind<select data-ak-select><option>One</option></select></label>`);
    runKit();

    const select = document.querySelector("select");
    expect(document.querySelector(".ak-select")).toBeNull();
    expect(select.getAttribute("aria-hidden")).toBeNull();
  });

  it("mirrors disabled and invalid state without checkValidity stealing focus", async () => {
    const { select, trigger } = boot(`
      <form><label for="kind">Kind</label>
      <select id="kind" data-ak-select required disabled>
        <option value="">Choose</option><option value="one">One</option>
      </select></form>
    `);

    expect(trigger.disabled).toBe(true);
    select.disabled = false;
    window.AdminKit.refresh(document);
    expect(trigger.disabled).toBe(false);

    const sentinel = document.createElement("button");
    document.body.appendChild(sentinel);
    sentinel.focus();
    expect(select.checkValidity()).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(trigger.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(sentinel);

    select.value = "one";
    window.AdminKit.refresh(document);
    expect(trigger.getAttribute("aria-invalid")).toBeNull();
  });

  it("keeps a validated-invalid blank choice invalid when it is recommitted", () => {
    const { select, trigger } = boot(`
      <label for="kind">Kind</label>
      <select id="kind" data-ak-select required>
        <option value="">Choose</option><option value="one">One</option>
      </select>
    `);
    expect(select.checkValidity()).toBe(false);
    expect(trigger.getAttribute("aria-invalid")).toBe("true");

    trigger.click();
    key(trigger, "Enter");
    expect(select.value).toBe("");
    expect(trigger.getAttribute("aria-invalid")).toBe("true");
  });

  it("closes and refuses generated choices when the native source becomes disabled", () => {
    const { select, trigger, panel } = boot();
    const onInput = vi.fn();
    const onChange = vi.fn();
    select.addEventListener("input", onInput);
    select.addEventListener("change", onChange);

    trigger.click();
    select.disabled = true;
    window.AdminKit.refresh(document);
    panel.querySelector('[data-idx="2"]').click();

    expect(trigger.disabled).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(select.value).toBe("magic-link");
    expect(onInput).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("refreshes labels/options, resets with its form, and stays idempotent", async () => {
    const { select, trigger } = boot(`<form><label for="kind">Kind</label><select id="kind" data-ak-select><option value="one">One</option><option value="two">Two</option></select></form>`);
    select.value = "two";
    window.AdminKit.refresh(document);
    expect(trigger.textContent).toContain("Two");

    select.insertAdjacentHTML("beforeend", '<option value="three">Three</option>');
    window.AdminKit.enhance(document);
    expect(document.querySelectorAll(".ak-select")).toHaveLength(1);
    expect(document.querySelectorAll(".ak-option")).toHaveLength(3);

    document.querySelector("form").reset();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(trigger.textContent).toContain("One");
  });

  it("closes an open popup when its form resets", async () => {
    const { select, trigger } = boot(`<form><label for="kind">Kind</label><select id="kind" data-ak-select><option value="one">One</option><option value="two">Two</option></select></form>`);
    trigger.click();
    key(trigger, "ArrowDown");
    document.querySelector("form").reset();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(select.value).toBe("one");
    expect(trigger.textContent).toContain("One");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    key(trigger, "Enter");
    key(trigger, "Escape");
    expect(select.value).toBe("one");
  });
});
