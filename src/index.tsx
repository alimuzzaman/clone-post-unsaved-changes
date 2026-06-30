/**
 * Entry point: register the Save As editor plugin.
 */
import { registerPlugin } from '@wordpress/plugins';
import { SaveAsPlugin } from './components/SaveAsPlugin';

registerPlugin( 'save-as-draft', { render: SaveAsPlugin } );
