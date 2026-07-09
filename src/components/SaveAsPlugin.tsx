/**
 * The editor plugin: renders the Save As affordances (header toolbar button,
 * sidebar button, and the always-available ⋮ menu item) and owns the dialog +
 * visibility state.
 */
import type { ComponentType, ReactNode } from 'react';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useState, createPortal } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { PluginPostStatusInfo, PluginMoreMenuItem } from '@wordpress/editor';
import { copy } from '@wordpress/icons';
import { getPref, setPref, PREF_KEYS } from '../preferences';
import { quickCopy } from '../api/draft';
import { useToolbarSlot } from '../hooks/useToolbarSlot';
import { SaveAsModal } from './SaveAsModal';

type ClickEvent = Pick< MouseEvent, 'ctrlKey' | 'metaKey' | 'altKey' >;

// WordPress's generated types for these editor slot components are incomplete
// (children typed as a DOM `Element`, or omitted entirely), so re-type them
// locally to accept React children.
const PostStatusInfo = PluginPostStatusInfo as unknown as ComponentType< {
    children?: ReactNode;
} >;
const MoreMenuItem = PluginMoreMenuItem as unknown as ComponentType< {
    icon?: unknown;
    onClick?: () => void;
    children?: ReactNode;
} >;

export const SaveAsPlugin = () => {
    const [ isOpen, setIsOpen ] = useState( false );
    const [ hideToolbar, setHideToolbar ] = useState(
        getPref( PREF_KEYS.hideToolbar )
    );
    // The sidebar button is hidden by default (the toolbar button and ⋮ menu
    // item remain); users can opt back in from the dialog's visibility settings.
    const [ hideSidebar, setHideSidebar ] = useState(
        getPref( PREF_KEYS.hideSidebar, true )
    );

    const toggleHideToolbar = ( hide: boolean ) => {
        setPref( PREF_KEYS.hideToolbar, hide );
        setHideToolbar( hide );
    };
    const toggleHideSidebar = ( hide: boolean ) => {
        setPref( PREF_KEYS.hideSidebar, hide );
        setHideSidebar( hide );
    };

    const { isNew, currentTitle } = useSelect( ( sel: ( store: string ) => any ) => {
        const editor = sel( 'core/editor' );
        return {
            isNew: editor.isEditedPostNew(),
            currentTitle: editor.getEditedPostAttribute( 'title' ) || '',
        };
    }, [] );

    // Only inject the toolbar button on an existing, visible-toolbar post.
    const toolbarSlot = useToolbarSlot( ! isNew && ! hideToolbar );

    // Ctrl/⌘/Alt-click opens the dialog even when "don't ask" is set.
    const startSaveAs = ( event?: ClickEvent ) => {
        const force = !! (
            event && ( event.ctrlKey || event.metaKey || event.altKey )
        );
        if ( getPref( PREF_KEYS.skipModal ) && ! force ) {
            quickCopy( currentTitle );
            return;
        }
        setIsOpen( true );
    };

    // Nothing to copy until the post has been saved at least once.
    if ( isNew ) {
        return null;
    }

    const label = __( 'Save As', 'clone-post-unsaved-changes' );

    return (
        <>
            { toolbarSlot &&
                createPortal(
                    // Match the adjacent native "Save draft" button: link-style
                    // (tertiary), no border, no icon.
                    <Button
                        variant="tertiary"
                        onClick={ startSaveAs }
                        __next40pxDefaultSize
                    >
                        { label }
                    </Button>,
                    toolbarSlot
                ) }

            { ! hideSidebar && (
                <PostStatusInfo>
                    <Button
                        variant="secondary"
                        icon={ copy }
                        onClick={ startSaveAs }
                        __next40pxDefaultSize
                        style={ { width: '100%', justifyContent: 'center', marginBottom: '12px' } }
                    >
                        { label }
                    </Button>
                </PostStatusInfo>
            ) }

            { /* Always available — the escape hatch back to this dialog and its
                 visibility settings, even when both buttons are hidden. */ }
            <MoreMenuItem icon={ copy } onClick={ () => setIsOpen( true ) }>
                { label }
            </MoreMenuItem>

            { isOpen && (
                <SaveAsModal
                    defaultTitle={ currentTitle }
                    onClose={ () => setIsOpen( false ) }
                    hideToolbar={ hideToolbar }
                    hideSidebar={ hideSidebar }
                    onToggleToolbar={ toggleHideToolbar }
                    onToggleSidebar={ toggleHideSidebar }
                />
            ) }
        </>
    );
};
