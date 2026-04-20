/* eslint-disable no-undef */
pref("enable", true);
pref("input", "This is input");

/* eslint-disable no-undef */
pref("__prefsPrefix__.pdfPreview.enabled", true); // 控制 PDFPreviewHandler
pref("__prefsPrefix__.pdfStateInit.enabled", true); // 控制 PDFStateInitializer
pref("__prefsPrefix__.pdfPrefs.scrollMode", 1); // 默认横向滚动
pref("__prefsPrefix__.pdfPrefs.scale", "page-fit"); // 默认“适应页面高度”（page-fit，与 Zotero Reader 菜单一致）

pref("__prefsPrefix__.pdfHandTool.enabled", false); // 控制 PDFHandTool
pref("__prefsPrefix__.pdfPrefs.spreadMode", 0); // 默认单页 (0=none, 1=odd, 2=even)
