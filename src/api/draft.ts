/**
 * Core logic: build a draft copy of the current post and create it via REST.
 */
import { __, sprintf } from '@wordpress/i18n';
import { select, dispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import type { RestPost } from '../types';

// Builds the REST payload from the current (possibly unsaved) edits and creates
// a brand-new draft. Resolves to the new post on success; throws on failure so
// callers can decide how to surface the error.
export const createDraftCopy = async ( title: string ): Promise< RestPost > => {
    const editor = select( 'core/editor' ) as any;
    const { getEditedPostAttribute, getEditedPostContent } = editor;

    // Derive the REST route from the post type so this also works for pages and
    // custom post types, not just posts.
    const postType: string = getEditedPostAttribute( 'type' ) || 'post';
    const restBase: string =
        ( select( 'core' ) as any ).getPostType?.( postType )?.rest_base ||
        `${ postType }s`;

    const payload = {
        status: 'draft', // always create the copy as a new draft
        title,
        content: getEditedPostContent(),
        excerpt: getEditedPostAttribute( 'excerpt' ),
        featured_media: getEditedPostAttribute( 'featured_media' ) || 0,
        comment_status: getEditedPostAttribute( 'comment_status' ),
        ping_status: getEditedPostAttribute( 'ping_status' ),
        format: getEditedPostAttribute( 'format' ),
        template: getEditedPostAttribute( 'template' ) || '',
        categories: getEditedPostAttribute( 'categories' ),
        tags: getEditedPostAttribute( 'tags' ),
    };
    const meta = getEditedPostAttribute( 'meta' );

    const create = ( data: Record< string, unknown > ): Promise< RestPost > =>
        apiFetch( { path: `/wp/v2/${ restBase }`, method: 'POST', data } );

    let newPost: RestPost;
    try {
        newPost = await create( { ...payload, meta } );
    } catch ( err ) {
        // Meta keys not exposed to the REST API are rejected; retry once without
        // meta so the copy still succeeds.
        if ( meta && Object.keys( meta ).length ) {
            newPost = await create( payload );
        } else {
            throw err;
        }
    }

    if ( ! newPost || ! newPost.id ) {
        throw new Error(
            __( 'No post was returned by the server.', 'clone-post-unsaved-changes' )
        );
    }
    return newPost;
};

export const redirectToEditor = ( postId: number ): void => {
    window.location.href = `/wp-admin/post.php?post=${ postId }&action=edit`;
};

export const errorMessage = ( err: unknown ): string => {
    if ( err && typeof err === 'object' && 'message' in err ) {
        const { message } = err as { message?: unknown };
        if ( typeof message === 'string' && message ) {
            return message;
        }
    }
    return __( 'Unknown error', 'clone-post-unsaved-changes' );
};

// Copy straight away (used when the user opted out of the dialog), surfacing any
// failure as an editor snackbar notice.
export const quickCopy = ( title: string ): Promise< void > =>
    createDraftCopy( title )
        .then( ( newPost ) => redirectToEditor( newPost.id ) )
        .catch( ( err ) => {
            ( dispatch( 'core/notices' ) as any ).createErrorNotice(
                sprintf(
                    // translators: %s: the error message returned by the server.
                    __( 'Save As failed: %s', 'clone-post-unsaved-changes' ),
                    errorMessage( err )
                ),
                { type: 'snackbar' }
            );
        } );
