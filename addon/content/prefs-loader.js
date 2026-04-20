// Runs in the preferences window sandbox before the pane markup is inserted.
// 1. Registers the FTL file so document.l10n.translateFragment() finds all strings.
// 2. Fires the onPrefsEvent('load') callback that parseXULToFragment() skips.
(function () {
  try {
    MozXULElement.insertFTLIfNeeded("__addonRef__-preferences.ftl");
  } catch (e) {}

  // Zotero dispatches a synthetic 'load' Event to pane children after translation,
  // but parseXULToFragment() doesn't wire up onload attributes as real listeners.
  // We attach the listener here on the container so it fires regardless.
  document.addEventListener(
    "load",
    function onPaneLoad(event) {
      const vbox = document.getElementById("zotero-prefpane-__addonRef__");
      if (!vbox || event.target !== vbox) return;
      document.removeEventListener("load", onPaneLoad, true);
      try {
        Zotero.__addonInstance__.hooks.onPrefsEvent("load", { window });
      } catch (e) {}
    },
    true
  );
})();
