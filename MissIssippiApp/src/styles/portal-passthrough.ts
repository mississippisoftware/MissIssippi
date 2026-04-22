/**
 * portal-passthrough.ts
 * PrimeReact Unstyled PassThrough configuration.
 *
 * Every PrimeReact component that this app uses gets mapped here.
 * Class names assigned here must match rules defined in portal-theme.css.
 *
 * Naming convention: pt-{component}__{element}[--{modifier}]
 */

import type { PrimeReactPTOptions } from "primereact/api";
import type { TabPanelPassThroughMethodOptions } from "primereact/tabview";

const pt: PrimeReactPTOptions = {
  // ── BUTTON ──────────────────────────────────────────────────────────────────
  // root removed: pt-btn has no CSS. All buttons carry explicit btn-* className props.
  button: {},

  // ── INPUT TEXT ──────────────────────────────────────────────────────────────
  inputtext: {
    root: { className: "pt-input" },
  },

  // ── INPUT NUMBER ────────────────────────────────────────────────────────────
  inputnumber: {
    root: { className: "pt-input-number" },
    input: { root: { className: "pt-input" } },
    incrementButton: { root: { className: "pt-input-number__btn" } },
    decrementButton: { root: { className: "pt-input-number__btn" } },
  },

  // ── DROPDOWN ────────────────────────────────────────────────────────────────
  dropdown: {
    root: { className: "pt-dropdown" },
    input: { className: "pt-dropdown__label" },
    trigger: { className: "pt-dropdown__trigger" },
    panel: { className: "pt-dropdown__panel" },
    list: { className: "pt-dropdown__list" },
    item: (options) => ({
      className: [
        "pt-dropdown__item",
        options?.context.selected && "pt-dropdown__item--selected",
        options?.context.focused && "pt-dropdown__item--focused",
        options?.context.disabled && "pt-dropdown__item--disabled",
      ]
        .filter(Boolean)
        .join(" "),
    }),
    emptyMessage: { className: "pt-dropdown__empty" },
    filterInput: { root: { className: "pt-input pt-dropdown__filter" } },
    clearIcon: { className: "pt-dropdown__clear-icon" },
  },

  // ── AUTOCOMPLETE ────────────────────────────────────────────────────────────
  autocomplete: {
    root: { className: "pt-autocomplete" },
    input: { root: { className: "pt-input" } },
    panel: { className: "pt-autocomplete__panel" },
    list: { className: "pt-autocomplete__list" },
    item: (options) => ({
      className: [
        "pt-autocomplete__item",
        options?.context.selected && "pt-autocomplete__item--selected",
        options?.context.disabled && "pt-autocomplete__item--disabled",
      ]
        .filter(Boolean)
        .join(" "),
    }),
    emptyMessage: { className: "pt-autocomplete__empty" },
  },

  // ── INPUT SWITCH ────────────────────────────────────────────────────────────
  inputswitch: {
    root: (options) => ({
      className: [
        "pt-switch",
        options?.props.checked && "pt-switch--checked",
        options?.props.disabled && "pt-switch--disabled",
      ]
        .filter(Boolean)
        .join(" "),
    }),
    slider: { className: "pt-switch__slider" },
  },

  // ── PANEL MENU (sidebar navigation) ────────────────────────────────────────
  panelmenu: {
    root: { className: "pt-panelmenu" },
    panel: (options: any) => ({
      className: [
        "pt-panelmenu__panel",
        options?.props?.model?.[options?.context?.index]?.className,
      ].filter(Boolean).join(" "),
    }),
    header: { className: "pt-panelmenu__header" },
    headerContent: { className: "pt-panelmenu__header-content" },
    headerAction: { className: "pt-panelmenu__header-link" },
    headerIcon: { className: "pt-panelmenu__header-icon" },
    expandIcon: { className: "pt-panelmenu__expand-icon" },
    collapseIcon: { className: "pt-panelmenu__collapse-icon" },
    headerSubmenuIcon: { className: "pt-panelmenu__submenu-icon" },
    headerLabel: { className: "pt-panelmenu__header-label" },
    toggleableContent: { className: "pt-panelmenu__toggleable-content" },
    menuContent: { className: "pt-panelmenu__menu-content" },
    menu: { className: "pt-panelmenu__menu" },
    menuitem: (options: any) => ({
      className: [
        "pt-panelmenu__item",
        options?.context?.item?.item?.className,
      ].filter(Boolean).join(" "),
    }),
    action: { className: "pt-panelmenu__item-link" },
    icon: { className: "pt-panelmenu__item-icon" },
    label: { className: "pt-panelmenu__item-label" },
  },

  // ── MENU (dropdown popup menus) ─────────────────────────────────────────────
  menu: {
    root: { className: "pt-menu" },
    menu: { className: "pt-menu__list" },
    menuitem: { className: "pt-menu__item" },
    content: { className: "pt-menu__item-content" },
    action: { className: "pt-menu__item-link" },
    icon: { className: "pt-menu__item-icon" },
    label: { className: "pt-menu__item-label" },
    separator: { className: "pt-menu__separator" },
    submenuHeader: { className: "pt-menu__submenu-header" },
  },

  // ── DATATABLE ───────────────────────────────────────────────────────────────
  datatable: {
    root: { className: "pt-datatable portal-table-card" },
    loadingOverlay: { className: "pt-datatable__loading-overlay" },
    wrapper: { className: "pt-datatable__wrapper" },
    table: { className: "pt-datatable__table" },
    thead: { className: "pt-datatable__thead" },
    headerRow: { className: "pt-datatable__header-row" },
    tbody: { className: "pt-datatable__tbody" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bodyRow: (options: any) => ({
      className: [
        "pt-datatable__body-row",
        options?.context?.selected && "pt-datatable__body-row--selected",
        options?.state?.editing && "pt-datatable__body-row--editing",
      ]
        .filter(Boolean)
        .join(" "),
    }),
    rowExpansion: { className: "pt-datatable__row-expansion" },
    emptyMessage: { className: "pt-datatable__empty-row" },
    footer: { className: "pt-datatable__footer" },
    // Column-level PT is set on each Column component individually
    column: {
      headerCell: { className: "pt-datatable__header-cell" },
      headerContent: { className: "pt-datatable__header-content" },
      headerTitle: { className: "pt-datatable__header-title" },
      sortIcon: { className: "pt-datatable__sort-icon" },
      bodyCell: { className: "pt-datatable__body-cell" },
      rowEditorInitButton: { className: "pt-datatable__row-editor-init" },
      rowEditorEditButton: { className: "pt-datatable__row-editor-init" },
      rowEditorSaveButton: { className: "pt-datatable__row-editor-save" },
      rowEditorCancelButton: { className: "pt-datatable__row-editor-cancel" },
    },
    // Paginator PT nested inside DataTable
    paginator: {
      root: { className: "pt-paginator" },
      firstPageButton: { className: "pt-paginator__btn pt-paginator__btn--first" },
      prevPageButton: { className: "pt-paginator__btn pt-paginator__btn--prev" },
      nextPageButton: { className: "pt-paginator__btn pt-paginator__btn--next" },
      lastPageButton: { className: "pt-paginator__btn pt-paginator__btn--last" },
      pages: { className: "pt-paginator__pages" },
      pageButton: (options) => ({
        className: [
          "pt-paginator__btn",
          options?.context.active && "pt-paginator__btn--active",
        ]
          .filter(Boolean)
          .join(" "),
      }),
      current: { className: "pt-paginator__current" },
    },
  },

  // ── PAGINATOR (standalone) ──────────────────────────────────────────────────
  paginator: {
    root: { className: "pt-paginator" },
    firstPageButton: { className: "pt-paginator__btn pt-paginator__btn--first" },
    prevPageButton: { className: "pt-paginator__btn pt-paginator__btn--prev" },
    nextPageButton: { className: "pt-paginator__btn pt-paginator__btn--next" },
    lastPageButton: { className: "pt-paginator__btn pt-paginator__btn--last" },
    pages: { className: "pt-paginator__pages" },
    pageButton: (options) => ({
      className: [
        "pt-paginator__btn",
        options?.context.active && "pt-paginator__btn--active",
      ]
        .filter(Boolean)
        .join(" "),
    }),
    current: { className: "pt-paginator__current" },
  },

  // ── TAB VIEW ────────────────────────────────────────────────────────────────
  tabview: {
    root: { className: "pt-tabview" },
    navContainer: { className: "pt-tabview__nav-container" },
    navContent: { className: "pt-tabview__nav-content" },
    nav: { className: "pt-tabview__nav" },
    inkbar: { className: "pt-tabview__inkbar" },
    prevButton: { className: "pt-tabview__nav-btn" },
    nextButton: { className: "pt-tabview__nav-btn" },
    panelContainer: { className: "pt-tabview__panels" },
    tab: {
      header: (options: TabPanelPassThroughMethodOptions | undefined) => ({
        className: [
          "pt-tabview__tab",
          options?.context?.selected && "pt-tabview__tab--active",
          options?.context?.disabled && "pt-tabview__tab--disabled",
        ]
          .filter(Boolean)
          .join(" "),
      }),
      headerAction: { className: "pt-tabview__tab-link" },
      headerTitle: { className: "pt-tabview__tab-title" },
      content: { className: "pt-tabview__panel" },
    },
  },

  // ── DIALOG ──────────────────────────────────────────────────────────────────
  dialog: {
    root: { className: "pt-dialog" },
    mask: { className: "pt-dialog__mask" },
    header: { className: "pt-dialog__header" },
    headerTitle: { className: "pt-dialog__title" },
    headerIcons: { className: "pt-dialog__header-icons" },
    closeButton: { className: "pt-dialog__close-btn" },
    closeButtonIcon: { className: "pt-dialog__close-icon" },
    content: { className: "pt-dialog__content" },
    footer: { className: "pt-dialog__footer" },
  },

  // ── TOAST ────────────────────────────────────────────────────────────────────
  toast: {
    root: { className: "pt-toast" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    message: (options: any) => ({
      className: [
        "pt-toast__message",
        options?.message?.severity === "success" && "pt-toast__message--success",
        options?.message?.severity === "error" && "pt-toast__message--error",
        options?.message?.severity === "warn" && "pt-toast__message--warn",
        options?.message?.severity === "info" && "pt-toast__message--info",
      ]
        .filter(Boolean)
        .join(" "),
    }),
    content: { className: "pt-toast__content" },
    icon: { className: "pt-toast__icon" },
    text: { className: "pt-toast__text" },
    summary: { className: "pt-toast__summary" },
    detail: { className: "pt-toast__detail" },
    closeButton: { className: "pt-toast__close-btn" },
    closeButtonIcon: { className: "pt-toast__close-icon" },
  },

  // ── PROGRESS SPINNER ────────────────────────────────────────────────────────
  progressspinner: {
    root: { className: "pt-spinner" },
    spinner: { className: "pt-spinner__svg" },
    circle: { className: "pt-spinner__circle" },
  },
};

export default pt;
