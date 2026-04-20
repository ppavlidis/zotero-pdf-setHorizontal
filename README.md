# Set PDF View (fork)

[![zotero target version](https://img.shields.io/badge/Zotero-7%2F8%2F9-green?style=flat-square&logo=zotero&logoColor=CC2936)](https://www.zotero.org)
[![fork of qiwei-ma/zotero-pdf-setHorizontal](https://img.shields.io/badge/fork%20of-qiwei--ma%2Fzotero--pdf--setHorizontal-orange?style=flat-square&logo=github)](https://github.com/qiwei-ma/zotero-pdf-setHorizontal)
[![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-square&logo=github)](https://github.com/windingwind/zotero-plugin-template)

This is a plugin for [Zotero](https://www.zotero.org/).

> **Fork note.** This is a maintained fork of [qiwei-ma/zotero-pdf-setHorizontal](https://github.com/qiwei-ma/zotero-pdf-setHorizontal). Changes on this branch:
> - **Zotero 9 compatibility** (`strict_max_version` bumped to `9.*`).
> - **Page Layout** option (single page / two pages — first page alone / two pages — cover paired), mapping to PDF.js SpreadMode.
> - Preference values are now read at event time instead of module load, so changing a dropdown takes effect immediately without restarting Zotero.
> - Preferences pane itself renders reliably (the upstream version showed a blank pane because the FTL loaded asynchronously after the fragment was translated, and `parseXULToFragment` never wired up `onload`).
> - Stable preference-pane id, so repeat registrations don't create duplicate sidebar entries.
> - Assorted English copy fixes.

[English](README.md) | [简体中文](README-zhCN.md)

> [!tip]
> 👁 Add Wrapped Scrolling and Automaticlly Resize.

## Features

- ⭐ [New!] Auto Enable Hand Tool
- Automatically set the View when adding items (Recommended method).

## Examples

### Preference Pane Examples

![1745154524765](image/README/pref.png)

### Example of Auto Set View When Item First added

![1745157143167](image/README/1745157143167.gif)

### Example of Auto Set View When Open Tab

![1745157192657](image/README/1745157192657.gif)

## Disclaimer

Use this code under AGPL. No warranties are provided. Keep the laws of your locality in mind!


