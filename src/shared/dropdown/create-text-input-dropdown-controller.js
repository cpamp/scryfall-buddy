import { createBrowserAutocompleteController } from "../autocomplete/create-browser-autocomplete-controller.js";
import { replaceInputToken } from "../text-input/replace-input-token.js";
import { createDropdownPopup } from "../ui/create-dropdown-popup.js";
import {
  registerDropdownTarget,
  triggerDropdown,
} from "./dropdown-target-registry.js";

export function createTextInputDropdownController({
  applySelection,
  dropdownKey,
  getReplacement,
  getInputs,
  getItemLabel,
  getItems,
  getPopupTitle,
  inputSelector,
  popupId,
  popupTitle,
  renderItemContent,
  resolveContext,
}) {
  const autocomplete = createBrowserAutocompleteController();
  const popup = createDropdownPopup({
    getItemLabel,
    id: popupId,
    onClose: hide,
    onHighlight: highlightItem,
    onSelect: selectItem,
    renderItemContent,
    title: popupTitle,
  });

  let activeInput = null;
  let matches = [];
  let mounted = false;
  let selectedIndex = 0;
  let suppressedRefreshInput = null;
  let unregisterDropdownTarget = null;

  function isTargetInput(node) {
    return Boolean(node?.matches?.(inputSelector));
  }

  function resetState() {
    matches = [];
    selectedIndex = 0;
  }

  function hide() {
    popup.hide();
    resetState();
    autocomplete.restoreAll(getInputs());
  }

  function suppressNextRefresh(input) {
    suppressedRefreshInput = input;
  }

  function shouldSkipRefresh(event) {
    if (!suppressedRefreshInput || event.target !== suppressedRefreshInput) {
      return false;
    }

    suppressedRefreshInput = null;
    return event.type === "keyup";
  }

  function render(context) {
    const titleText =
      typeof getPopupTitle === "function"
        ? getPopupTitle({ context, input: activeInput, matches })
        : popupTitle;

    popup.show({
      anchor: activeInput,
      items: matches,
      selectedIndex,
      titleText,
    });
    autocomplete.suppress(activeInput);
  }

  function refresh(nextInput = null) {
    const focusedInput = isTargetInput(nextInput)
      ? nextInput
      : isTargetInput(document.activeElement)
        ? document.activeElement
        : activeInput;

    if (!focusedInput) {
      hide();
      return;
    }

    activeInput = focusedInput;
    const context = resolveContext(activeInput);
    if (!context) {
      hide();
      return;
    }

    matches = getItems({ context, input: activeInput });
    if (matches.length === 0) {
      hide();
      return;
    }

    if (selectedIndex >= matches.length) {
      selectedIndex = 0;
    }

    render(context);
  }

  function selectItem(item, index, trigger = "click") {
    if (!activeInput) {
      return;
    }

    selectedIndex = index;
    const context = resolveContext(activeInput);
    if (!context) {
      hide();
      return;
    }

    const shouldSuppressKeyboardRefresh =
      (trigger === "enter" || trigger === "tab") &&
      context.end < activeInput.value.length;

    if (typeof getReplacement === "function") {
      const replacementResult = getReplacement({
        context,
        input: activeInput,
        item,
        trigger,
      });
      const replacement =
        typeof replacementResult === "string"
          ? {
              appendSpaceIfAtEnd: true,
              nextDropdownKey: null,
              shouldTriggerMatchingDropdown: false,
              value: replacementResult,
            }
          : replacementResult;

      if (typeof replacement?.value === "string") {
        replaceInputToken(activeInput, context, replacement.value, {
          appendSpaceIfAtEnd: replacement.appendSpaceIfAtEnd !== false,
        });
      }
      hide();
      if (shouldSuppressKeyboardRefresh) {
        suppressNextRefresh(activeInput);
      }
      activeInput.focus();

      if (replacement?.shouldTriggerMatchingDropdown === true) {
        triggerDropdown(activeInput, {
          dropdownKey: replacement.nextDropdownKey,
          exceptKey: replacement.nextDropdownKey ? null : dropdownKey,
        });
      }

      return;
    }

    if (typeof applySelection === "function") {
      applySelection({ context, input: activeInput, item, trigger });
    }

    hide();
    if (shouldSuppressKeyboardRefresh) {
      suppressNextRefresh(activeInput);
    }
    activeInput.focus();
  }

  function highlightItem(index) {
    selectedIndex = index;
    refresh();
  }

  function onInputFocus(event) {
    if (!isTargetInput(event.target)) {
      return;
    }

    shouldSkipRefresh(event);

    activeInput = event.target;
    refresh();
  }

  function onInputEvent(event) {
    if (!isTargetInput(event.target)) {
      return;
    }

    if (shouldSkipRefresh(event)) {
      return;
    }

    activeInput = event.target;
    refresh();
  }

  function onKeyDown(event) {
    if (!isTargetInput(event.target) || !popup.isVisible()) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      selectedIndex = (selectedIndex + 1) % matches.length;
      refresh();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      selectedIndex = (selectedIndex - 1 + matches.length) % matches.length;
      refresh();
      return;
    }

    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      selectItem(
        matches[selectedIndex],
        selectedIndex,
        event.key === "Tab" ? "tab" : "enter",
      );
      return;
    }

    if (event.key === "Escape") {
      hide();
    }
  }

  function onDocumentClick(event) {
    if (popup.contains(event.target)) {
      return;
    }

    if (isTargetInput(event.target)) {
      refresh();
      return;
    }

    hide();
  }

  function onWindowChange() {
    if (popup.isVisible() && activeInput) {
      popup.reposition(activeInput);
    }
  }
  return {
    cleanup() {
      if (mounted) {
        document.removeEventListener("focusin", onInputFocus);
        document.removeEventListener("input", onInputEvent, true);
        document.removeEventListener("click", onInputEvent, true);
        document.removeEventListener("keyup", onInputEvent, true);
        document.removeEventListener("keydown", onKeyDown, true);
        document.removeEventListener("click", onDocumentClick, true);
        window.removeEventListener("resize", onWindowChange);
        window.removeEventListener("scroll", onWindowChange, true);
      }

      hide();
      popup.destroy();
      activeInput = null;
      suppressedRefreshInput = null;
      unregisterDropdownTarget?.();
      unregisterDropdownTarget = null;
      mounted = false;
    },
    mount() {
      if (mounted) {
        return this;
      }

      document.addEventListener("focusin", onInputFocus);
      document.addEventListener("input", onInputEvent, true);
      document.addEventListener("click", onInputEvent, true);
      document.addEventListener("keyup", onInputEvent, true);
      document.addEventListener("keydown", onKeyDown, true);
      document.addEventListener("click", onDocumentClick, true);
      window.addEventListener("resize", onWindowChange);
      window.addEventListener("scroll", onWindowChange, true);

      unregisterDropdownTarget = registerDropdownTarget({
        hide,
        key: dropdownKey,
        refresh,
        resolveContext,
      });
      mounted = true;
      refresh();
      return this;
    },
    refresh,
  };
}
