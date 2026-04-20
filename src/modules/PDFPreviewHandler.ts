import { getPref } from "../utils/prefs";

// PDF.js ScrollMode / SpreadMode are numeric enums. The prefs are declared as
// ints in prefs.js, but XUL <menulist native="true"> with a preference= attribute
// routes through Zotero.Prefs.set, which calls setStringPref for string
// elem.value. That can leave the pref stored as a string like "1", at which
// point PDF.js's setter throws because Object.values(ScrollMode).includes("1")
// is false. So every read here is coerced.
const toNumber = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const toScaleString = (v: unknown): string => {
  // PDF.js accepts numeric strings like "1.5" or keywords: "auto",
  // "page-actual", "page-fit", "page-width", "page-height".
  // Zotero Reader's "Zoom to Page Height" menu item uses `page-fit`
  // (see zotero/reader pdf-view.js `zoomPageHeight`), so translate the
  // legacy `page-height` value we used to ship with.
  let s: string;
  if (typeof v === "string") s = v;
  else if (typeof v === "number" && Number.isFinite(v)) s = String(v);
  else s = "page-fit";
  if (s === "page-height") s = "page-fit";
  return s;
};

export class PDFPreviewHandler {
  private static initialized = false;
  private static notifierID?: string;

  static init() {
    // Always register; check the enabled pref at event time so toggling
    // the checkbox takes effect without a Zotero restart.
    if (this.initialized) return;
    this.initialized = true;
    ztoolkit.log("[SetPDFView] PDFPreviewHandler initialized");

    this.notifierID = Zotero.Notifier.registerObserver(
      {
        notify: (async (
          event: string,
          type: string,
          ids: string[],
          extraData: { [key: string]: any },
        ) => {
          if (event !== "add" || type !== "tab") return;
          if (!getPref("pdfPreview.enabled")) return;
          const tabID = ids[0];
          const tabInfo = extraData[tabID];
          if (
            tabInfo?.type === "reader" &&
            typeof tabInfo.itemID === "number"
          ) {
            await this.handlePDFOpen(tabInfo.itemID, tabID);
          }
        }) as unknown as _ZoteroTypes.Notifier.Notify,
      },
      ["tab"],
    );
  }

  private static async handlePDFOpen(itemID: number, tabID: string) {
    try {
      const item = await Zotero.Items.getAsync(itemID);
      if (!item?.isAttachment() || !(item as any).isPDFAttachment?.()) {
        return;
      }

      const reader = Zotero.Reader.getByTabID(tabID);
      if (!reader) {
        ztoolkit.log("[SetPDFView] reader not found for tab", tabID);
        return;
      }

      const pdfApp = await this.waitForPDFViewer(reader);
      if (!pdfApp?.pdfViewer || !pdfApp.eventBus) {
        ztoolkit.log("[SetPDFView] PDFViewerApplication not ready");
        return;
      }

      const apply = () => this.applyPreferences(pdfApp);

      // Apply once immediately after pages initialize, then again after a
      // short delay — Zotero Reader's own _setState runs inside
      // _handleDocumentInit (before pagesinit), but it also writes state via
      // _handleViewAreaUpdate which can reset values if our first apply
      // races with its initial fire. The second apply covers that.
      if (pdfApp.pdfViewer._pagesInitialized) {
        apply();
        setTimeout(apply, 400);
      } else {
        pdfApp.eventBus.on("pagesinit", () => {
          apply();
          setTimeout(apply, 400);
        });
      }
    } catch (e) {
      ztoolkit.log("[SetPDFView] handlePDFOpen error", e);
    }
  }

  private static applyPreferences(pdfApp: any) {
    const scrollMode = toNumber(getPref("pdfPrefs.scrollMode"));
    const spreadMode = toNumber(getPref("pdfPrefs.spreadMode"));
    const scale = toScaleString(getPref("pdfPrefs.scale"));

    ztoolkit.log(
      `[SetPDFView] applying scrollMode=${scrollMode} spreadMode=${spreadMode} scale=${scale}`,
    );

    // Prefer the PDF.js event bus so Zotero Reader's state-tracking side
    // effects (view-menu checkmarks, _handleViewAreaUpdate -> state save)
    // run. Fall back to direct property assignment if the bus is missing.
    try {
      if (pdfApp.eventBus?.dispatch) {
        pdfApp.eventBus.dispatch("switchscrollmode", {
          source: pdfApp,
          mode: scrollMode,
        });
        pdfApp.eventBus.dispatch("switchspreadmode", {
          source: pdfApp,
          mode: spreadMode,
        });
      } else {
        pdfApp.pdfViewer.scrollMode = scrollMode;
        pdfApp.pdfViewer.spreadMode = spreadMode;
      }
    } catch (e) {
      ztoolkit.log("[SetPDFView] scroll/spread dispatch failed", e);
      try {
        pdfApp.pdfViewer.scrollMode = scrollMode;
        pdfApp.pdfViewer.spreadMode = spreadMode;
      } catch (e2) {
        ztoolkit.log("[SetPDFView] fallback scroll/spread set failed", e2);
      }
    }

    // Scale: currentScaleValue is a string setter that triggers scalechanging.
    try {
      pdfApp.pdfViewer.currentScaleValue = scale;
    } catch (e) {
      ztoolkit.log("[SetPDFView] scale set failed", e);
    }
  }

  private static waitForPDFViewer(
    reader: _ZoteroTypes.ReaderInstance,
    timeout = 10000,
  ): Promise<any> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const check = () => {
        const pdfApp =
          reader._iframeWindow?.wrappedJSObject?.PDFViewerApplication;
        if (pdfApp?.initialized) {
          resolve(pdfApp);
        } else if (Date.now() - startTime < timeout) {
          setTimeout(check, 100);
        } else {
          ztoolkit.log("[SetPDFView] timeout waiting for PDFViewer");
          resolve(null);
        }
      };
      check();
    });
  }
}
