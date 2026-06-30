/**
 * Shared types for the Save As Draft plugin.
 */

// A WordPress REST post object. Only `id` is relied on directly; the rest of
// the response is left open.
export interface RestPost {
    id: number;
    [ key: string ]: unknown;
}

// The payload POSTed to the REST API to create the draft copy. Most fields are
// passed straight through from the current post's edited attributes, so they
// are typed loosely.
export interface DraftPayload {
    status: 'draft';
    title: string;
    content: string;
    excerpt: string;
    featured_media: number;
    comment_status: string;
    ping_status: string;
    format: string;
    template: string;
    categories: number[];
    tags: number[];
}
