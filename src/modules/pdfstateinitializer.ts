import { getPref } from "../utils/prefs";

export class PDFStateInitializer {
  private static initialized = false;

  static init() {
    // Always register the notifier; check the enabled pref at event time
    // so toggling the checkbox takes effect without a restart.
    if (this.initialized) return;
    this.initialized = true;

    ztoolkit.log("PDFStateInitializer initialized");

    Zotero.Notifier.registerObserver(
      {
        notify: (async (
          event: string,
          type: string,
          ids: string[],
          extraData: Record<string, any>,
        ) => {
          if (event !== "add" || type !== "item") return;
          if (!getPref("pdfStateInit.enabled")) return;

          for (const id of ids) {
            try {
              const itemID = parseInt(id + "", 10);
              const item = await Zotero.Items.getAsync(itemID);
              if (
                !item ||
                !item.isAttachment() ||
                !(item as any).isPDFAttachment?.()
              )
                continue;

              ztoolkit.log(
                "[PDFStateInitializer] 检测到 PDF 附件添加，准备设置默认阅读状态",
                itemID,
              );

              await this.writeDefaultState(item);
            } catch (e) {
              ztoolkit.log("[PDFStateInitializer] 写入 PDF 状态失败:", e);
            }
          }
        }) as unknown as _ZoteroTypes.Notifier.Notify,
      },
      ["item"],
    );
  }

  private static async writeDefaultState(item: Zotero.Item) {
    // Read prefs fresh on each write so pref changes take effect immediately.
    // Coerce numeric prefs to numbers — XUL menulist binding can store them
    // as strings, which would produce invalid state values.
    const toNum = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    // Legacy value `page-height` is not what Zotero Reader's menu means by
    // "Zoom to Page Height" — it uses `page-fit`. Translate on read.
    const rawScale = getPref("pdfPrefs.scale");
    let scale =
      typeof rawScale === "string" && rawScale ? rawScale : "page-fit";
    if (scale === "page-height") scale = "page-fit";
    const defaultState = {
      pageIndex: 0,
      scrollMode: toNum(getPref("pdfPrefs.scrollMode")),
      spreadMode: toNum(getPref("pdfPrefs.spreadMode")),
      scale: scale,
      zoom: scale,
      scrollLeft: 0,
      scrollTop: 0,
    };

    const storageDir = Zotero.Attachments.getStorageDirectory(item);
    if (!storageDir.exists()) {
      // 0x01 表示 DIRECTORY_TYPE
      storageDir.create(0x01, 0o755);
    }

    const stateFile = storageDir.clone();
    stateFile.append(".zotero-reader-state");

    ztoolkit.log("[PDFStateInitializer] 写入状态文件:", stateFile.path);

    await IOUtils.writeUTF8(
      stateFile.path,
      JSON.stringify(defaultState, null, 2),
    );

    // 可选：更新附件的页码状态
    item.setAttachmentLastPageIndex(0);
    await item.saveTx();
  }
}
