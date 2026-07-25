(function () {
  "use strict";
  if (window.AdminKit) return;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  // ----- Dialog + toast ----------------------------------------------------
  var dlg, dTitle, dMsg, dInput, dConfirm, dCancel, toastEl, toastTimer = null;
  var resolveFn = null, mode = "confirm";

  function ensureRefs() {
    if (dlg) return;
    dlg = document.getElementById("akDialog");
    dTitle = document.getElementById("akDialogTitle");
    dMsg = document.getElementById("akDialogMsg");
    dInput = document.getElementById("akDialogInput");
    dConfirm = document.getElementById("akDialogConfirm");
    dCancel = document.getElementById("akDialogCancel");
    toastEl = document.getElementById("akToast");
    if (!dlg) return;
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close("cancel"); });
    dlg.addEventListener("close", function () {
      if (!resolveFn) return;
      var fn = resolveFn; resolveFn = null;
      var ok = dlg.returnValue === "confirm";
      if (mode === "prompt") fn(ok ? dInput.value.trim() : null);
      else fn(ok);
    });
    dConfirm.addEventListener("click", function () { dlg.close("confirm"); });
    dCancel.addEventListener("click", function () { dlg.close("cancel"); });
    dInput.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); dlg.close("confirm"); } });
  }

  function confirmDialog(opts) {
    ensureRefs();
    var o = opts || {};
    return new Promise(function (resolve) {
      if (!dlg) { resolve(false); return; }
      resolveFn = resolve; mode = "confirm";
      dTitle.textContent = o.title || "Confirm";
      dMsg.textContent = o.message || "";
      dMsg.style.display = o.message ? "" : "none";
      dInput.classList.add("is-hidden");
      dConfirm.classList.remove("is-hidden");
      dConfirm.textContent = o.confirmText || "Confirm";
      dCancel.textContent = o.cancelText || "Cancel";
      dConfirm.className = "ak-dialog-btn ak-dialog-btn--confirm" + (o.danger ? " is-danger" : "");
      dlg.showModal(); dConfirm.focus();
    });
  }

  function alertDialog(opts) {
    ensureRefs();
    var o = typeof opts === "string" ? { message: opts } : (opts || {});
    return new Promise(function (resolve) {
      if (!dlg) { resolve(); return; }
      resolveFn = function () { resolve(); }; mode = "confirm";
      dTitle.textContent = o.title || "Heads up";
      dMsg.textContent = o.message || "";
      dMsg.style.display = o.message ? "" : "none";
      dInput.classList.add("is-hidden");
      dConfirm.classList.remove("is-hidden");
      dConfirm.textContent = o.confirmText || "OK";
      dCancel.classList.add("is-hidden");
      dConfirm.className = "ak-dialog-btn ak-dialog-btn--confirm";
      dlg.showModal(); dConfirm.focus();
      // restore cancel for next caller
      dlg.addEventListener("close", function once() { dCancel.classList.remove("is-hidden"); dlg.removeEventListener("close", once); });
    });
  }

  function promptDialog(opts) {
    ensureRefs();
    var o = opts || {};
    return new Promise(function (resolve) {
      if (!dlg) { resolve(null); return; }
      resolveFn = resolve; mode = "prompt";
      dTitle.textContent = o.title || "Enter a value";
      dMsg.textContent = o.message || "";
      dMsg.style.display = o.message ? "" : "none";
      dInput.classList.remove("is-hidden");
      dInput.value = o.defaultValue || "";
      dInput.placeholder = o.placeholder || "";
      dConfirm.classList.remove("is-hidden");
      dConfirm.textContent = o.confirmText || "OK";
      dCancel.textContent = o.cancelText || "Cancel";
      dConfirm.className = "ak-dialog-btn ak-dialog-btn--confirm";
      dlg.showModal(); dInput.focus(); dInput.select();
    });
  }

  function toast(message, kind) {
    ensureRefs();
    if (!toastEl) return;
    toastEl.textContent = String(message == null ? "" : message);
    toastEl.className = "ak-toast is-visible" + (kind ? " is-" + kind : "");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.className = "ak-toast" + (kind ? " is-" + kind : ""); }, 2600);
  }

  // ----- Custom dropdown (enhance a native <select>) -----------------------
  var openSelect = null;

  function closeSelect() {
    if (openSelect) { openSelect.removeAttribute("data-open"); openSelect = null; }
  }

  function syncTrigger(wrap) {
    var sel = wrap.__sel, label = wrap.querySelector(".ak-select-label");
    var opt = sel.options[sel.selectedIndex];
    if (label) label.textContent = opt ? opt.textContent : "";
    var panel = wrap.querySelector(".ak-select-panel");
    if (panel) {
      var btns = panel.querySelectorAll(".ak-option");
      for (var i = 0; i < btns.length; i++) {
        btns[i].setAttribute("aria-selected", String(i === sel.selectedIndex));
      }
    }
  }

  function buildPanel(wrap) {
    var sel = wrap.__sel;
    var panel = document.createElement("div");
    panel.className = "ak-select-panel";
    panel.setAttribute("role", "listbox");
    for (var i = 0; i < sel.options.length; i++) {
      var o = sel.options[i];
      var b = document.createElement("button");
      b.type = "button"; b.className = "ak-option"; b.setAttribute("role", "option");
      b.dataset.idx = String(i); b.textContent = o.textContent;
      panel.appendChild(b);
    }
    panel.addEventListener("click", function (e) {
      var b = e.target.closest(".ak-option");
      if (!b) return;
      sel.selectedIndex = parseInt(b.dataset.idx, 10);
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      syncTrigger(wrap);
      closeSelect();
    });
    return panel;
  }

  function enhanceSelect(sel) {
    if (sel.__akDone) return;
    sel.__akDone = true;
    var wrap = document.createElement("div");
    wrap.className = "ak-select";
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    sel.classList.add("ak-select-src");
    sel.setAttribute("tabindex", "-1");
    sel.setAttribute("aria-hidden", "true");
    wrap.__sel = sel;

    var trigger = document.createElement("button");
    trigger.type = "button"; trigger.className = "ak-select-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.innerHTML = '<span class="ak-select-label"></span>';
    wrap.appendChild(trigger);
    wrap.appendChild(buildPanel(wrap));
    syncTrigger(wrap);

    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      if (openSelect === wrap) { closeSelect(); return; }
      closeSelect();
      // flip up if not enough room below
      var r = trigger.getBoundingClientRect();
      wrap.classList.toggle("ak-select--up", (window.innerHeight - r.bottom) < 280 && r.top > 280);
      wrap.setAttribute("data-open", ""); openSelect = wrap;
    });
    // keyboard: reflect native select changes
    sel.addEventListener("change", function () { syncTrigger(wrap); });
  }

  // ----- Auto-grow textarea ------------------------------------------------
  function autogrow(t) {
    if (t.__akGrow) { fit(t); return; }
    t.__akGrow = true;
    t.classList.add("ak-textarea--grow");
    t.addEventListener("input", function () { fit(t); });
    fit(t);
    if (t.maxLength && t.maxLength > 0) attachCount(t);
  }
  function fit(t) { t.style.height = "auto"; t.style.height = Math.max(t.scrollHeight, 40) + "px"; }
  function attachCount(t) {
    var c = document.createElement("div"); c.className = "ak-charcount";
    t.insertAdjacentElement("afterend", c);
    function upd() { var n = t.value.length; c.textContent = n + " / " + t.maxLength; c.classList.toggle("is-over", n >= t.maxLength); }
    t.addEventListener("input", upd); upd();
  }

  // ----- Date/time popover (enhance <input type="datetime-local"|"date">) ---
  var DOW = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  function enhanceDateTime(input) {
    if (input.__akDone) return;
    input.__akDone = true;
    var withTime = input.type === "datetime-local";
    var wrap = document.createElement("div"); wrap.className = "ak-dt";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    input.style.position = "absolute"; input.style.width = "1px"; input.style.height = "1px";
    input.style.opacity = "0"; input.style.pointerEvents = "none"; input.setAttribute("tabindex", "-1");

    var trigger = document.createElement("button");
    trigger.type = "button"; trigger.className = "ak-dt-trigger";
    wrap.appendChild(trigger);

    var pop = document.createElement("div"); pop.className = "ak-dt-pop"; wrap.appendChild(pop);

    var view = new Date();
    var sel = parseVal(input.value);
    if (sel) view = new Date(sel.getFullYear(), sel.getMonth(), 1);

    function parseVal(v) {
      if (!v) return null;
      var d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    }
    function fmtTrigger() {
      if (!sel) { trigger.textContent = withTime ? "Pick date & time" : "Pick a date"; trigger.classList.add("is-empty"); return; }
      trigger.classList.remove("is-empty");
      var opts = { year: "numeric", month: "short", day: "numeric" };
      var s = sel.toLocaleDateString(undefined, opts);
      if (withTime) s += "  " + ((sel.getHours() % 12) || 12) + ":" + pad2(sel.getMinutes()) + " " + (sel.getHours() < 12 ? "AM" : "PM");
      trigger.textContent = s;
    }
    function writeBack() {
      if (!sel) { input.value = ""; }
      else if (withTime) {
        input.value = sel.getFullYear() + "-" + pad2(sel.getMonth() + 1) + "-" + pad2(sel.getDate()) + "T" + pad2(sel.getHours()) + ":" + pad2(sel.getMinutes());
      } else {
        input.value = sel.getFullYear() + "-" + pad2(sel.getMonth() + 1) + "-" + pad2(sel.getDate());
      }
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
    function renderCal() {
      var y = view.getFullYear(), m = view.getMonth();
      var first = new Date(y, m, 1).getDay();
      var days = new Date(y, m + 1, 0).getDate();
      var today = new Date();
      var monName = view.toLocaleDateString(undefined, { month: "long", year: "numeric" });
      var html = '<div class="ak-dt-head"><button type="button" data-nav="-1">\\u2039</button>'
        + '<span class="ak-dt-mon">' + esc(monName) + '</span>'
        + '<button type="button" data-nav="1">\\u203A</button></div><div class="ak-dt-grid">';
      for (var d = 0; d < 7; d++) html += '<div class="ak-dt-dow">' + DOW[d] + '</div>';
      for (var i = 0; i < first; i++) html += '<button class="ak-dt-day is-empty" disabled></button>';
      for (var day = 1; day <= days; day++) {
        var isSel = sel && sel.getFullYear() === y && sel.getMonth() === m && sel.getDate() === day;
        var isToday = today.getFullYear() === y && today.getMonth() === m && today.getDate() === day;
        html += '<button type="button" class="ak-dt-day' + (isSel ? " is-sel" : "") + (isToday ? " is-today" : "") + '" data-day="' + day + '">' + day + '</button>';
      }
      html += '</div>';
      if (withTime) {
        var hh = sel ? sel.getHours() : 12, mm = sel ? sel.getMinutes() : 0;
        html += '<div class="ak-dt-time"><select class="ak-select-src ak-dt-h">' + hourOpts(hh) + '</select>'
          + '<span>:</span><select class="ak-select-src ak-dt-m">' + minOpts(mm) + '</select></div>';
      }
      html += '<div class="ak-dt-foot"><button type="button" class="ak-dt-clear">Clear</button>'
        + '<button type="button" class="ak-dt-done">Done</button></div>';
      pop.innerHTML = html;
      // enhance the time selects with our dropdown
      var hSel = pop.querySelector(".ak-dt-h"), mSel = pop.querySelector(".ak-dt-m");
      if (hSel) { enhanceSelect(hSel); hSel.addEventListener("change", function () { ensureSel(); sel.setHours(parseInt(hSel.value, 10)); }); }
      if (mSel) { enhanceSelect(mSel); mSel.addEventListener("change", function () { ensureSel(); sel.setMinutes(parseInt(mSel.value, 10)); }); }
    }
    function ensureSel() { if (!sel) sel = new Date(view.getFullYear(), view.getMonth(), 1, 12, 0); }
    function hourOpts(cur) { var s = ""; for (var h = 0; h < 24; h++) { var lbl = ((h % 12) || 12) + " " + (h < 12 ? "AM" : "PM"); s += '<option value="' + h + '"' + (h === cur ? " selected" : "") + '>' + lbl + '</option>'; } return s; }
    function minOpts(cur) { var s = ""; for (var mi = 0; mi < 60; mi += 5) { s += '<option value="' + mi + '"' + (mi === cur ? " selected" : "") + '>' + pad2(mi) + '</option>'; } return s; }

    pop.addEventListener("click", function (e) {
      var nav = e.target.closest("[data-nav]");
      if (nav) { view.setMonth(view.getMonth() + parseInt(nav.dataset.nav, 10)); renderCal(); return; }
      var dayBtn = e.target.closest(".ak-dt-day:not(.is-empty)");
      if (dayBtn) { ensureSel(); sel = new Date(view.getFullYear(), view.getMonth(), parseInt(dayBtn.dataset.day, 10), sel.getHours(), sel.getMinutes()); renderCal(); return; }
      if (e.target.closest(".ak-dt-clear")) { sel = null; fmtTrigger(); writeBack(); close(); return; }
      if (e.target.closest(".ak-dt-done")) { fmtTrigger(); writeBack(); close(); return; }
    });
    function open() { renderCal(); wrap.setAttribute("data-open", ""); openDt = wrap; }
    function close() { wrap.removeAttribute("data-open"); if (openDt === wrap) openDt = null; }
    trigger.addEventListener("click", function (e) { e.stopPropagation(); if (openDt === wrap) { close(); } else { closeAllDt(); open(); } });
    fmtTrigger();
  }
  var openDt = null;
  function closeAllDt() { if (openDt) { openDt.removeAttribute("data-open"); openDt = null; } }

  // ----- Enhance / refresh dispatch ---------------------------------------
  function enhance(root) {
    root = root || document;
    var sels = root.querySelectorAll("select.ak-select-src:not(.ak-dt-h):not(.ak-dt-m)");
    for (var i = 0; i < sels.length; i++) {
      var sel = sels[i];
      if (!sel.closest(".ak-select")) {
        enhanceSelect(sel);
      } else if (sel.__akDone) {
        // Already enhanced but options may have changed (e.g. dynamic population
        // after DOMContentLoaded). Rebuild the dropdown panel from current options
        // and re-sync the trigger label so the UI reflects the new option set.
        var wrap = sel.closest(".ak-select");
        var old = wrap && wrap.querySelector(".ak-select-panel");
        if (old) old.replaceWith(buildPanel(wrap));
        syncTrigger(wrap);
      }
    }
    var grows = root.querySelectorAll("textarea.ak-autogrow");
    for (var j = 0; j < grows.length; j++) autogrow(grows[j]);
    var dts = root.querySelectorAll("input.ak-datetime");
    for (var k = 0; k < dts.length; k++) enhanceDateTime(dts[k]);
  }
  function refresh(root) {
    root = root || document;
    var wraps = root.querySelectorAll(".ak-select");
    for (var i = 0; i < wraps.length; i++) if (wraps[i].__sel) syncTrigger(wraps[i]);
    var grows = root.querySelectorAll("textarea.ak-autogrow");
    for (var j = 0; j < grows.length; j++) fit(grows[j]);
  }

  document.addEventListener("click", function () { closeSelect(); closeAllDt(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeSelect(); closeAllDt(); } });
  document.addEventListener("DOMContentLoaded", function () { ensureRefs(); enhance(document); });

  window.AdminKit = {
    confirm: confirmDialog, alert: alertDialog, prompt: promptDialog, toast: toast,
    enhance: enhance, refresh: refresh, enhanceSelect: enhanceSelect, autogrow: autogrow
  };
})();
