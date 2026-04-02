export function createBrowserAutocompleteController() {
  const inputState = new WeakMap();
  const formState = new WeakMap();

  function rememberState(input) {
    if (!inputState.has(input)) {
      inputState.set(input, {
        autocompleteAttr: input.getAttribute("autocomplete"),
        autocorrectAttr: input.getAttribute("autocorrect"),
        autocapitalizeAttr: input.getAttribute("autocapitalize"),
        spellcheck: input.spellcheck,
      });
    }

    if (input.form && !formState.has(input.form)) {
      formState.set(input.form, {
        autocompleteAttr: input.form.getAttribute("autocomplete"),
      });
    }
  }

  function suppress(input) {
    if (!input) {
      return;
    }

    rememberState(input);
    input.setAttribute("autocomplete", "new-password");
    input.setAttribute("autocorrect", "off");
    input.setAttribute("autocapitalize", "none");
    input.spellcheck = false;

    if (input.form) {
      input.form.setAttribute("autocomplete", "off");
    }
  }

  function restore(input) {
    if (!input) {
      return;
    }

    const savedInput = inputState.get(input);
    if (savedInput) {
      if (savedInput.autocompleteAttr === null) {
        input.removeAttribute("autocomplete");
      } else {
        input.setAttribute("autocomplete", savedInput.autocompleteAttr);
      }

      if (savedInput.autocorrectAttr === null) {
        input.removeAttribute("autocorrect");
      } else {
        input.setAttribute("autocorrect", savedInput.autocorrectAttr);
      }

      if (savedInput.autocapitalizeAttr === null) {
        input.removeAttribute("autocapitalize");
      } else {
        input.setAttribute("autocapitalize", savedInput.autocapitalizeAttr);
      }

      input.spellcheck = savedInput.spellcheck;
    }

    if (!input.form) {
      return;
    }

    const savedForm = formState.get(input.form);
    if (!savedForm) {
      return;
    }

    if (savedForm.autocompleteAttr === null) {
      input.form.removeAttribute("autocomplete");
    } else {
      input.form.setAttribute("autocomplete", savedForm.autocompleteAttr);
    }
  }

  function restoreAll(inputs = []) {
    inputs.forEach(restore);
  }

  return {
    restore,
    restoreAll,
    suppress,
  };
}
