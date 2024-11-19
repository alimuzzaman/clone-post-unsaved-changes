import { Button, PanelBody } from '@wordpress/components';
import { addFilter } from '@wordpress/hooks';

const SaveAsButton = () => {
  const handleSaveAs = async () => {
    try {
      const currentPost = wp.data.select('core/editor');
      const postContent = currentPost.getEditedPostContent();
      const postTitle = currentPost.getPostTitle();

      // Display a loading indicator (optional)
      // ...

      const response = await fetch(
        wpApiSettings.root + 'wp-json/wp/v2/posts',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': wpApiSettings.nonce,
          },
          body: JSON.stringify({
            title: postTitle,
            content: postContent,
            status: 'draft',
          }),
        }
      );

      const data = await response.json();
      window.location.href = `/wp-admin/post.php?post=${data.id}&action=edit`;

      // Display a success message (optional)
      // ...
    } catch (error) {
      console.error('Error saving draft:', error);
      // Display an error message to the user
      // ...
    }
  };

  return (
    <PanelBody title="Save As">
      <Button onClick={handleSaveAs}>Save As</Button>
    </PanelBody>
  );
};

addFilter(
  'editPostToolbar',
  'my-plugin/add-save-as-button',
  (defaultToolbar) => {
    defaultToolbar.push(SaveAsButton);
    return defaultToolbar;
  }
);