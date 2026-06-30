/**
 * User preferences, persisted per-browser in localStorage.
 *
 * These are intentionally lightweight (no server round-trip): they only control
 * which Save As affordances are shown and whether the dialog is skipped.
 */

export const PREF_KEYS = {
    skipModal: 'saveAsDraftSkipModal',
    hideToolbar: 'saveAsDraftHideToolbar',
    hideSidebar: 'saveAsDraftHideSidebar',
} as const;

export type PrefKey = ( typeof PREF_KEYS )[ keyof typeof PREF_KEYS ];

export const getPref = ( key: PrefKey ): boolean => {
    try {
        return window.localStorage.getItem( key ) === '1';
    } catch ( e ) {
        return false;
    }
};

export const setPref = ( key: PrefKey, value: boolean ): void => {
    try {
        window.localStorage.setItem( key, value ? '1' : '0' );
    } catch ( e ) {
        // Ignore (private mode / storage disabled) — just don't persist.
    }
};
