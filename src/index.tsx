/**
 * Entry point: register the Save As editor plugin.
 */
import { registerPlugin } from '@wordpress/plugins';
import { SaveAsPlugin } from './components/SaveAsPlugin';

registerPlugin( 'clone-post-unsaved-changes', { render: SaveAsPlugin } );
