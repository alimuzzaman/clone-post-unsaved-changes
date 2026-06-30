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
    $asset_file = include plugin_dir_path(__FILE__) . 'build/my-plugin-script.asset.php';

    wp_enqueue_script(
      'enhanced_save_script',
      plugins_url('build/my-plugin-script.js', __FILE__),
      $asset_file['dependencies'],
      $asset_file['version'],
      true
    );

    // Make the @wordpress/i18n strings (__/sprintf) in the bundle translatable.
    wp_set_script_translations(
      'enhanced_save_script',
      'enhanced-save',
      plugin_dir_path(__FILE__) . 'languages'
    );
  }
