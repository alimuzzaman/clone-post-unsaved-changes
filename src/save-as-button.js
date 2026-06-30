import { __ } from '@wordpress/i18n';
import { select, useSelect, dispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { useState } from '@wordpress/element';
import { registerPlugin } from '@wordpress/plugins';
import { PluginPostStatusInfo, PluginMoreMenuItem } from '@wordpress/editor';
import {
    Button,
    Modal,
    TextControl,
    CheckboxControl,
    Notice,
    Flex,
} from '@wordpress/components';
import { copy } from '@wordpress/icons';

const SKIP_MODAL_KEY = 'enhancedSaveSkipModal';

// --- "Don't ask again" preference (persisted in localStorage) -------------

const getSkipModalPref = () => {
    try {
        return window.localStorage.getItem(SKIP_MODAL_KEY) === '1';
    } catch (e) {
        return false;
    }
};

const setSkipModalPref = (skip) => {
    try {
        window.localStorage.setItem(SKIP_MODAL_KEY, skip ? '1' : '0');
    } catch (e) {
        // Ignore (private mode / storage disabled) — just don't persist.
    }
};

// --- Core: create a draft copy --------------------------------------------

// Builds the REST payload from the current (possibly unsaved) edits and
// creates a brand-new draft. Resolves to the new post on success; throws on
// failure so callers can decide how to surface the error.
const createDraftCopy = async (title) => {
    const { getEditedPostAttribute, getEditedPostContent } = select('core/editor');

    // Derive the REST route from the post type so this also works for pages
    // and custom post types, not just posts.
    const postType = getEditedPostAttribute('type') || 'post';
    const restBase =
        select('core').getPostType?.(postType)?.rest_base || `${postType}s`;

    const payload = {
        status: 'draft', // always create the copy as a new draft
        title,
        content: getEditedPostContent(),
        excerpt: getEditedPostAttribute('excerpt'),
        featured_media: getEditedPostAttribute('featured_media') || 0,
        comment_status: getEditedPostAttribute('comment_status'),
        ping_status: getEditedPostAttribute('ping_status'),
        format: getEditedPostAttribute('format'),
        template: getEditedPostAttribute('template') || '',
        categories: getEditedPostAttribute('categories'),
        tags: getEditedPostAttribute('tags'),
    };
    const meta = getEditedPostAttribute('meta');

    const create = (data) =>
        apiFetch({ path: `/wp/v2/${restBase}`, method: 'POST', data });

    let newPost;
    try {
        newPost = await create({ ...payload, meta });
    } catch (err) {
        // Meta keys not exposed to the REST API are rejected; retry once
        // without meta so the copy still succeeds.
        if (meta && Object.keys(meta).length) {
            newPost = await create(payload);
        } else {
            throw err;
        }
    }

    if (!newPost || !newPost.id) {
        throw new Error(__('No post was returned by the server.', 'enhanced-save'));
    }
    return newPost;
};

const redirectToEditor = (postId) => {
    window.location.href = `/wp-admin/post.php?post=${postId}&action=edit`;
};

const errorMessage = (err) =>
    err?.message || __('Unknown error', 'enhanced-save');

// Copy straight away (used when the user opted out of the dialog), surfacing
// any failure as an editor snackbar notice.
const quickCopy = (title) =>
    createDraftCopy(title)
        .then((newPost) => redirectToEditor(newPost.id))
        .catch((err) =>
            dispatch('core/notices').createErrorNotice(
                __('Save As failed: ', 'enhanced-save') + errorMessage(err),
                { type: 'snackbar' }
            )
        );

// --- The modal ------------------------------------------------------------

const SaveAsModal = ({ defaultTitle, onClose }) => {
    const [title, setTitle] = useState(defaultTitle);
    const [dontAsk, setDontAsk] = useState(getSkipModalPref());
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const submit = async () => {
        setBusy(true);
        setError('');
        setSkipModalPref(dontAsk);
        try {
            const newPost = await createDraftCopy(title.trim());
            redirectToEditor(newPost.id); // leaves the page on success
        } catch (err) {
            // Keep the modal open so the user can retry / adjust the title.
            setError(errorMessage(err));
            setBusy(false);
        }
    };

    return (
        <Modal
            title={__('Save as a new draft', 'enhanced-save')}
            onRequestClose={busy ? undefined : onClose}
        >
            {error && (
                <Notice status="error" isDismissible={false}>
                    {__('Could not create the copy: ', 'enhanced-save') + error}
                </Notice>
            )}
            <TextControl
                label={__('Title for the copy', 'enhanced-save')}
                value={title}
                onChange={setTitle}
                __next40pxDefaultSize
                __nextHasNoMarginBottom
            />
            <div style={{ marginTop: '16px' }}>
                <CheckboxControl
                    label={__("Don't ask next time", 'enhanced-save')}
                    help={__(
                        'You can reopen this dialog by Ctrl/⌘-clicking the “Save as new draft” button.',
                        'enhanced-save'
                    )}
                    checked={dontAsk}
                    onChange={setDontAsk}
                    __nextHasNoMarginBottom
                />
            </div>
            <Flex justify="flex-end" gap={3} style={{ marginTop: '24px' }}>
                <Button variant="tertiary" onClick={onClose} disabled={busy}>
                    {__('Cancel', 'enhanced-save')}
                </Button>
                <Button
                    variant="primary"
                    onClick={submit}
                    isBusy={busy}
                    disabled={busy || !title.trim()}
                    __next40pxDefaultSize
                >
                    {busy
                        ? __('Creating…', 'enhanced-save')
                        : __('Create draft', 'enhanced-save')}
                </Button>
            </Flex>
        </Modal>
    );
};

// --- The editor plugin ----------------------------------------------------

const EnhancedSavePlugin = () => {
    const [isOpen, setIsOpen] = useState(false);

    const { isNew, currentTitle } = useSelect((sel) => {
        const editor = sel('core/editor');
        return {
            isNew: editor.isEditedPostNew(),
            currentTitle: editor.getEditedPostAttribute('title') || '',
        };
    }, []);

    // Ctrl/⌘/Alt-click opens the dialog even when "don't ask" is set.
    const startSaveAs = (event) => {
        const force = !!(event && (event.ctrlKey || event.metaKey || event.altKey));
        if (getSkipModalPref() && !force) {
            quickCopy(currentTitle);
            return;
        }
        setIsOpen(true);
    };

    // Nothing to copy until the post has been saved at least once.
    if (isNew) {
        return null;
    }

    const label = __('Save as new draft', 'enhanced-save');

    return (
        <>
            <PluginPostStatusInfo>
                <Button
                    variant="secondary"
                    icon={copy}
                    onClick={startSaveAs}
                    __next40pxDefaultSize
                    style={{ width: '100%', justifyContent: 'center' }}
                >
                    {label}
                </Button>
            </PluginPostStatusInfo>

            <PluginMoreMenuItem icon={copy} onClick={startSaveAs}>
                {label}
            </PluginMoreMenuItem>

            {isOpen && (
                <SaveAsModal
                    defaultTitle={currentTitle}
                    onClose={() => setIsOpen(false)}
                />
            )}
        </>
    );
};

registerPlugin('enhanced-save', { render: EnhancedSavePlugin });
