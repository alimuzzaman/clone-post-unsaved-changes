<?php
/*
Plugin Name: Enhanced Save Functionality
Plugin URI: https://alim.dev/
Description: Adds a "Save As" button to WordPress editor, allowing users to create a new draft based on the current post or page.
Version: 1.0
Author: Your Name
Author URI: https://alim.dev/
License: GPLv2 or later
Text Domain: enhanced-save
Domain Path: /languages/
*/


add_action('enqueue_block_editor_assets', 'my_plugin_enqueue_scripts');
function my_plugin_enqueue_scripts() {
  wp_enqueue_script(
    'my-plugin-save-as-script',
    plugins_url('src/save-as-button.js', __FILE__),
    [ 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-editor' ]
  );
}

add_filter('editPostToolbar', 'my_plugin_add_save_as_button');
function my_plugin_add_save_as_button($defaultToolbar) {
  $defaultToolbar[] = 'my-plugin/save-as-button';
  return $defaultToolbar;
}