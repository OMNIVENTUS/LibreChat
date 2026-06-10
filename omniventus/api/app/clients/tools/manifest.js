const manifest = require('@librechat/main-api/app/clients/tools/manifest.json');

manifest.push({
  name: 'Notion',
  pluginKey: 'notion',
  toolkit: true,
  description:
    'Access and manage Notion databases, pages, and comments to organize and collaborate on your workspace.',
  icon: 'https://www.notion.so/images/favicon.ico',
  authConfig: [
    {
      authField: 'NOTION_API_KEY',
      label: 'Notion API Key',
      description:
        "Your Notion Integration Token. Create an integration at <a href='https://www.notion.so/my-integrations' target='_blank'>Notion Integrations</a>.",
    },
  ],
});

module.exports = manifest;
