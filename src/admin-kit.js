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

  // ----- Custom dropdown (enhance a native single <select>) ---------------
  // The native select remains the form value store. It is hidden only after a
  // successful enhancement, so blocked or failed JavaScript leaves a usable
  // native control instead of an empty field.
  var openSelect = null, selectId = 0;

  function nextSelectId(prefix) {
    selectId += 1;
    return prefix + "-" + selectId;
  }

  function closeSelect(returnFocus) {
    if (!openSelect) return;
    var wrap = openSelect, trigger = wrap.__trigger, search = wrap.__search;
    wrap.removeAttribute("data-open");
    trigger.setAttribute("aria-expanded", "false");
    trigger.removeAttribute("aria-activedescendant");
    if (search) search.removeAttribute("aria-activedescendant");
    openSelect = null;
    if (returnFocus) trigger.focus();
  }

  function optionButtons(wrap) {
    return wrap.__panel ? wrap.__panel.querySelectorAll(".ak-option") : [];
  }

  function isAvailable(button) {
    return !button.hidden && button.getAttribute("aria-disabled") !== "true";
  }

  function setActive(wrap, optionIndex, scroll) {
    var buttons = optionButtons(wrap), active = null;
    for (var i = 0; i < buttons.length; i++) {
      var isActive = parseInt(buttons[i].dataset.idx, 10) === optionIndex && isAvailable(buttons[i]);
      buttons[i].classList.toggle("is-active", isActive);
      if (isActive) active = buttons[i];
    }
    wrap.__activeIndex = active ? optionIndex : -1;
    var id = active ? active.id : "";
    var owner = wrap.__search && document.activeElement === wrap.__search ? wrap.__search : wrap.__trigger;
    wrap.__trigger.removeAttribute("aria-activedescendant");
    if (wrap.__search) wrap.__search.removeAttribute("aria-activedescendant");
    if (id) owner.setAttribute("aria-activedescendant", id);
    if (active && scroll && active.scrollIntoView) active.scrollIntoView({ block: "nearest" });
  }

  function availableIndices(wrap) {
    var buttons = optionButtons(wrap), indices = [];
    for (var i = 0; i < buttons.length; i++) {
      if (isAvailable(buttons[i])) indices.push(parseInt(buttons[i].dataset.idx, 10));
    }
    return indices;
  }

  function moveActive(wrap, delta) {
    var indices = availableIndices(wrap);
    if (!indices.length) return;
    var position = indices.indexOf(wrap.__activeIndex);
    if (position < 0) position = delta > 0 ? -1 : 0;
    position = Math.max(0, Math.min(indices.length - 1, position + delta));
    setActive(wrap, indices[position], true);
  }

  function edgeActive(wrap, last) {
    var indices = availableIndices(wrap);
    if (indices.length) setActive(wrap, indices[last ? indices.length - 1 : 0], true);
    else setActive(wrap, -1, false);
  }

  function syncTrigger(wrap) {
    var sel = wrap.__sel, trigger = wrap.__trigger;
    var label = trigger.querySelector(".ak-select-label");
    var opt = sel.options[sel.selectedIndex];
    if (label) label.textContent = opt ? opt.textContent : "";
    var buttons = optionButtons(wrap);
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute(
        "aria-selected",
        String(parseInt(buttons[i].dataset.idx, 10) === sel.selectedIndex)
      );
    }
    trigger.disabled = sel.disabled;
    trigger.setAttribute("aria-required", String(sel.required));
    wrap.classList.toggle("is-disabled", sel.disabled);
    if (sel.disabled && openSelect === wrap) closeSelect(false);
    if (wrap.__invalid && sel.validity.valid) wrap.__invalid = false;
    if (wrap.__invalid) trigger.setAttribute("aria-invalid", "true");
    else trigger.removeAttribute("aria-invalid");
  }

  function commitActive(wrap, returnFocus) {
    var index = wrap.__activeIndex, sel = wrap.__sel;
    if (sel.disabled) return false;
    var buttons = optionButtons(wrap), active = null;
    for (var i = 0; i < buttons.length; i++) {
      if (parseInt(buttons[i].dataset.idx, 10) === index) active = buttons[i];
    }
    if (index < 0 || !sel.options[index] || !active || !isAvailable(active)) return false;
    var changed = sel.selectedIndex !== index;
    sel.selectedIndex = index;
    wrap.__invalid = !sel.validity.valid;
    syncTrigger(wrap);
    closeSelect(returnFocus !== false);
    if (changed) {
      sel.dispatchEvent(new Event("input", { bubbles: true }));
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return true;
  }

  function updateGroups(panel) {
    var groups = panel.querySelectorAll(".ak-optgroup");
    for (var i = 0; i < groups.length; i++) {
      var any = false;
      var options = groups[i].querySelectorAll(".ak-option");
      for (var j = 0; j < options.length; j++) if (!options[j].hidden) any = true;
      groups[i].hidden = !any;
    }
  }

  function filterOptions(wrap) {
    if (!wrap.__search) return;
    var query = wrap.__search.value.trim().toLowerCase();
    var buttons = optionButtons(wrap), shown = 0;
    for (var i = 0; i < buttons.length; i++) {
      var hit = !query || buttons[i].textContent.toLowerCase().indexOf(query) !== -1;
      buttons[i].hidden = !hit;
      if (hit) shown += 1;
    }
    updateGroups(wrap.__panel);
    wrap.__empty.hidden = shown > 0;
    var current = buttons.length && buttons[0];
    for (var j = 0; j < buttons.length; j++) {
      if (parseInt(buttons[j].dataset.idx, 10) === wrap.__activeIndex) current = buttons[j];
    }
    if (!current || !isAvailable(current)) edgeActive(wrap, false);
    else setActive(wrap, wrap.__activeIndex, false);
  }

  function buildPanel(wrap) {
    var sel = wrap.__sel;
    var panel = document.createElement("div");
    panel.className = "ak-select-panel";
    panel.addEventListener("click", function (e) { e.stopPropagation(); });

    var searchPref = sel.getAttribute("data-ak-search");
    var wantSearch = searchPref === "on" || (searchPref !== "off" && sel.options.length > 12);
    if (wantSearch) {
      var searchBox = document.createElement("div");
      searchBox.className = "ak-select-search";
      var search = document.createElement("input");
      search.type = "search";
      search.autocomplete = "off";
      search.placeholder = "Search options";
      search.setAttribute("aria-label", "Search " + (wrap.__fieldLabel || "options"));
      search.setAttribute("aria-controls", wrap.__listId);
      searchBox.appendChild(search);
      panel.appendChild(searchBox);
      wrap.__search = search;
      search.addEventListener("input", function () { filterOptions(wrap); });
      search.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault(); moveActive(wrap, e.key === "ArrowDown" ? 1 : -1);
        } else if (e.key === "Enter") {
          e.preventDefault(); commitActive(wrap);
        } else if (e.key === "Escape") {
          if (openSelect === wrap) {
            e.preventDefault(); closeSelect(true);
          }
        } else if (e.key === "Tab") {
          if (openSelect === wrap && !commitActive(wrap, false)) closeSelect(false);
        }
      });
    } else {
      wrap.__search = null;
    }

    var list = document.createElement("div");
    list.className = "ak-select-options";
    list.id = wrap.__listId;
    list.setAttribute("role", "listbox");
    panel.appendChild(list);

    function appendOption(option, parent, groupDisabled) {
      var index = Array.prototype.indexOf.call(sel.options, option);
      var row = document.createElement("div");
      row.className = "ak-option";
      row.id = wrap.__listId + "-option-" + index;
      row.setAttribute("role", "option");
      row.setAttribute("aria-selected", String(index === sel.selectedIndex));
      row.setAttribute("aria-disabled", String(option.disabled || groupDisabled));
      row.dataset.idx = String(index);
      row.textContent = option.textContent;
      parent.appendChild(row);
    }

    for (var i = 0; i < sel.children.length; i++) {
      var node = sel.children[i];
      if (node.tagName === "OPTGROUP") {
        var group = document.createElement("div");
        group.className = "ak-optgroup";
        group.setAttribute("role", "group");
        group.setAttribute("aria-label", node.label || "Options");
        var heading = document.createElement("div");
        heading.className = "ak-optgroup-label";
        heading.setAttribute("aria-hidden", "true");
        heading.textContent = node.label || "";
        group.appendChild(heading);
        for (var j = 0; j < node.children.length; j++) appendOption(node.children[j], group, node.disabled);
        list.appendChild(group);
      } else if (node.tagName === "OPTION") {
        appendOption(node, list, false);
      }
    }

    var empty = document.createElement("div");
    empty.className = "ak-select-empty";
    empty.textContent = "No matching options";
    empty.hidden = true;
    empty.setAttribute("role", "status");
    panel.appendChild(empty);
    wrap.__empty = empty;

    panel.addEventListener("click", function (e) {
      var row = e.target.closest(".ak-option");
      if (!row || row.getAttribute("aria-disabled") === "true") return;
      setActive(wrap, parseInt(row.dataset.idx, 10), false);
      commitActive(wrap);
    });
    return panel;
  }

  function openSelectWidget(wrap, focusSearch) {
    if (wrap.__sel.disabled) return;
    if (openSelect && openSelect !== wrap) closeSelect(false);
    var r = wrap.__trigger.getBoundingClientRect();
    wrap.classList.toggle("ak-select--up", (window.innerHeight - r.bottom) < 320 && r.top > 320);
    wrap.setAttribute("data-open", "");
    wrap.__trigger.setAttribute("aria-expanded", "true");
    openSelect = wrap;
    if (wrap.__search) {
      wrap.__search.value = "";
      filterOptions(wrap);
    }
    setActive(wrap, wrap.__sel.selectedIndex, true);
    if (focusSearch && wrap.__search) {
      wrap.__search.focus();
      setActive(wrap, wrap.__activeIndex, false);
    }
  }

  function enhanceSelect(sel) {
    var declaredSize = parseInt(sel.getAttribute("size") || "0", 10);
    if (sel.__akDone || sel.multiple || declaredSize > 1) return false;
    var parent = sel.parentNode;
    if (!parent) return false;
    var wrap = document.createElement("div");
    var trigger = document.createElement("button");
    var labels = sel.labels ? Array.prototype.slice.call(sel.labels) : [];
    var originalTabIndex = sel.getAttribute("tabindex");
    var originalAriaHidden = sel.getAttribute("aria-hidden");
    for (var l = 0; l < labels.length; l++) {
      // A generated button inside an implicit <label> creates nested
      // interactive content. Leave that source native until its consumer uses
      // an explicit for/id relationship.
      if (labels[l].contains(sel)) return false;
    }
    try {
      wrap.className = "ak-select";
      wrap.__sel = sel;
      wrap.__activeIndex = sel.selectedIndex;
      wrap.__invalid = false;
      wrap.__listId = nextSelectId("ak-listbox");
      wrap.__fieldLabel = sel.getAttribute("aria-label") ||
        (labels.length ? labels[0].textContent.trim() : "options");
      parent.insertBefore(wrap, sel);
      wrap.appendChild(sel);

      trigger.type = "button";
      trigger.className = "ak-select-trigger";
      trigger.id = nextSelectId("ak-select-trigger");
      trigger.setAttribute("role", "combobox");
      trigger.setAttribute("aria-haspopup", "listbox");
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-controls", wrap.__listId);
      trigger.setAttribute("aria-autocomplete", "none");
      trigger.innerHTML = '<span class="ak-select-label"></span>';
      if (sel.hasAttribute("aria-label")) trigger.setAttribute("aria-label", sel.getAttribute("aria-label"));
      if (sel.hasAttribute("aria-labelledby")) trigger.setAttribute("aria-labelledby", sel.getAttribute("aria-labelledby"));
      if (sel.hasAttribute("aria-describedby")) trigger.setAttribute("aria-describedby", sel.getAttribute("aria-describedby"));
      if (sel.hasAttribute("aria-errormessage")) trigger.setAttribute("aria-errormessage", sel.getAttribute("aria-errormessage"));
      for (var i = 0; i < labels.length; i++) {
        if (labels[i].htmlFor === sel.id) labels[i].htmlFor = trigger.id;
      }
      wrap.__trigger = trigger;
      wrap.appendChild(trigger);
      wrap.__panel = buildPanel(wrap);
      wrap.appendChild(wrap.__panel);

      // Hide from sight and the accessibility tree only after every generated
      // control exists. The native select continues to serialize the form.
      sel.classList.add("ak-select-src");
      sel.setAttribute("tabindex", "-1");
      sel.setAttribute("aria-hidden", "true");
      sel.__akDone = true;
      syncTrigger(wrap);

      trigger.addEventListener("click", function (e) {
        e.stopPropagation();
        if (openSelect === wrap) closeSelect(false);
        else openSelectWidget(wrap, true);
      });
      trigger.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          if (openSelect !== wrap) openSelectWidget(wrap, false);
          else moveActive(wrap, e.key === "ArrowDown" ? 1 : -1);
        } else if (e.key === "Home" || e.key === "End") {
          e.preventDefault();
          if (openSelect !== wrap) openSelectWidget(wrap, false);
          edgeActive(wrap, e.key === "End");
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (openSelect !== wrap) openSelectWidget(wrap, true);
          else commitActive(wrap);
        } else if (e.key === "Escape") {
          if (openSelect === wrap) {
            e.preventDefault(); closeSelect(true);
          }
        } else if (e.key === "Tab") {
          if (openSelect === wrap && !commitActive(wrap, false)) closeSelect(false);
        } else if (e.key.length === 1 && !e.altKey && !e.ctrlKey && !e.metaKey) {
          if (wrap.__search) {
            e.preventDefault();
            if (openSelect !== wrap) openSelectWidget(wrap, true);
            wrap.__search.value += e.key;
            filterOptions(wrap);
          } else {
            var now = Date.now();
            wrap.__typeahead = now - (wrap.__typeaheadAt || 0) < 700 ? (wrap.__typeahead || "") + e.key.toLowerCase() : e.key.toLowerCase();
            wrap.__typeaheadAt = now;
            if (openSelect !== wrap) openSelectWidget(wrap, false);
            var indices = availableIndices(wrap);
            for (var t = 0; t < indices.length; t++) {
              if (sel.options[indices[t]].textContent.trim().toLowerCase().indexOf(wrap.__typeahead) === 0) {
                setActive(wrap, indices[t], true); break;
              }
            }
          }
        }
      });
      sel.addEventListener("focus", function () {
        if (document.activeElement === sel) trigger.focus();
      });
      sel.addEventListener("change", function () {
        wrap.__invalid = wrap.__invalid && !sel.validity.valid;
        syncTrigger(wrap);
      });
      sel.addEventListener("invalid", function () {
        wrap.__invalid = true;
        syncTrigger(wrap);
        // checkValidity() also emits invalid and must not steal focus. During
        // actual native form validation, redirect only if the browser moved
        // focus onto the visually clipped source.
        setTimeout(function () {
          if (document.activeElement === sel) trigger.focus();
        }, 0);
      });
      if (sel.form) sel.form.addEventListener("reset", function () {
        if (openSelect === wrap) closeSelect(false);
        setTimeout(function () { wrap.__invalid = false; syncTrigger(wrap); }, 0);
      });
      return true;
    } catch (error) {
      if (wrap.parentNode) {
        wrap.parentNode.insertBefore(sel, wrap);
        wrap.remove();
      }
      sel.classList.remove("ak-select-src");
      if (originalTabIndex === null) sel.removeAttribute("tabindex");
      else sel.setAttribute("tabindex", originalTabIndex);
      if (originalAriaHidden === null) sel.removeAttribute("aria-hidden");
      else sel.setAttribute("aria-hidden", originalAriaHidden);
      sel.__akDone = false;
      for (var j = 0; j < labels.length; j++) {
        if (labels[j].htmlFor === trigger.id) labels[j].htmlFor = sel.id;
      }
      return false;
    }
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
      var html = '<div class="ak-dt-head"><button type="button" data-nav="-1">‹</button>'
        + '<span class="ak-dt-mon">' + esc(monName) + '</span>'
        + '<button type="button" data-nav="1">›</button></div><div class="ak-dt-grid">';
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
    var sels = root.querySelectorAll("select[data-ak-select], select.ak-select-src:not(.ak-dt-h):not(.ak-dt-m)");
    for (var i = 0; i < sels.length; i++) {
      var sel = sels[i];
      var declaredSize = parseInt(sel.getAttribute("size") || "0", 10);
      if (sel.multiple || declaredSize > 1) continue;
      if (!sel.closest(".ak-select")) {
        enhanceSelect(sel);
      } else if (sel.__akDone) {
        // Already enhanced but options may have changed (e.g. dynamic population
        // after DOMContentLoaded). Rebuild the dropdown panel from current options
        // and re-sync the trigger label so the UI reflects the new option set.
        var wrap = sel.closest(".ak-select");
        var old = wrap && wrap.querySelector(".ak-select-panel");
        if (old) {
          if (openSelect === wrap) closeSelect(false);
          wrap.__panel = buildPanel(wrap);
          old.replaceWith(wrap.__panel);
        }
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
