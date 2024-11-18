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

// Add the "Save As" button to the editor toolbar
add_filter('mce_buttons', 'add_enhanced_save_button');
function add_enhanced_save_button($buttons) {
    array_push($buttons, 'enhanced_save');
    return $buttons;
}

// Add the script for the "Save As" button functionality
add_action('admin_enqueue_scripts', 'enhanced_save_script');
function enhanced_save_script() {
    wp_enqueue_script('enhanced-save-script', plugins_url('js/enhanced-save.js', __FILE__), array('jquery'));
}

// Create a new draft based on the current post or page
function create_new_draft() {
    global $post;

    $new_post = array(
        'post_title'   => $post->post_title . ' (Copy)',
        'post_content' => $post->post_content,
        'post_status'  => 'draft',
        'post_type'    => $post->post_type,
        'post_parent'  => $post->post_parent,
        'menu_order'   => $post->menu_order,
    );

    $new_post_id = wp_insert_post($new_post);

    if ( ! is_wp_error($new_post_id) ) {
        wp_redirect(admin_url("post.php?post=$new_post_id&action=edit"));
        exit;
    }
}

// Add the AJAX action to handle the "Save As" button click
add_action('wp_ajax_enhanced_save', 'create_new_draft');