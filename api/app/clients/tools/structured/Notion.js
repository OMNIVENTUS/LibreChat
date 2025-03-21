const { z } = require('zod');
const { tool } = require('@langchain/core/tools');
const { getApiKey } = require('./credentials');
const { logger } = require('~/config');

// Define common schema objects that can be reused
const richTextTextSchema = z.object({
  type: z.literal('text'),
  text: z.object({
    content: z.string().describe('The text content'),
    link: z.object({
      url: z.string().describe('URL of the link'),
    }).nullable().optional().describe('Link information if the text is a link'),
  }),
  annotations: z.object({
    bold: z.boolean().default(false).describe('Whether the text is bold'),
    italic: z.boolean().default(false).describe('Whether the text is italic'),
    strikethrough: z.boolean().default(false).describe('Whether the text is strikethrough'),
    underline: z.boolean().default(false).describe('Whether the text is underlined'),
    code: z.boolean().default(false).describe('Whether the text is code format'),
    color: z.string().default('default').describe('Color of the text'),
  }).optional(),
  plain_text: z.string().optional().describe('Plain text content'),
  href: z.string().nullable().optional().describe('URL of a link if present'),
});

// You could add other rich text types like 'mention', 'equation', etc.
const richTextSchema = z.union([
  richTextTextSchema,
  // Add other rich text types here if needed
]);

const richTextArraySchema = z.array(richTextSchema).describe('Array of rich text objects');

// Schema for database filter
const filterSchema = z.object({}).catchall(z.any()).describe('Filter criteria for database queries');

// Schema for sort
const sortSchema = z.object({
  direction: z.enum(['ascending', 'descending']).optional().describe('Sort direction'),
  timestamp: z.enum(['created_time', 'last_edited_time']).optional().describe('Timestamp to sort by'),
  property: z.string().optional().describe('Property to sort by'),
}).describe('Sort criteria for queries');

// Icon schema
const iconSchema = z.object({
  type: z.enum(['emoji', 'external']).describe('Type of icon'),
  emoji: z.string().optional().describe('Emoji character (required if type is emoji)'),
  external: z.object({
    url: z.string().describe('URL of external icon'),
  }).optional().describe('External icon information (required if type is external)'),
}).describe('Icon object for pages or databases');

// Cover schema
const coverSchema = z.object({
  type: z.literal('external').describe('Type of cover (only external is supported)'),
  external: z.object({
    url: z.string().describe('URL of the external cover image'),
  }).describe('External cover image information'),
}).describe('Cover object for pages or databases');

// Block schema - More explicit definition of block types

// Common color property used by many block types
const colorSchema = z.enum([
  'default', 'gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red',
  'gray_background', 'brown_background', 'orange_background', 'yellow_background',
  'green_background', 'blue_background', 'purple_background', 'pink_background', 'red_background',
]).describe('Color of the block');

// Paragraph block
const paragraphBlockSchema = z.object({
  type: z.literal('paragraph'),
  paragraph: z.object({
    rich_text: richTextArraySchema,
    color: colorSchema.optional().default('default'),
  }),
});

// Heading blocks
const heading1BlockSchema = z.object({
  type: z.literal('heading_1'),
  heading_1: z.object({
    rich_text: richTextArraySchema,
    color: colorSchema.optional().default('default'),
    is_toggleable: z.boolean().optional().default(false),
  }),
});

const heading2BlockSchema = z.object({
  type: z.literal('heading_2'),
  heading_2: z.object({
    rich_text: richTextArraySchema,
    color: colorSchema.optional().default('default'),
    is_toggleable: z.boolean().optional().default(false),
  }),
});

const heading3BlockSchema = z.object({
  type: z.literal('heading_3'),
  heading_3: z.object({
    rich_text: richTextArraySchema,
    color: colorSchema.optional().default('default'),
    is_toggleable: z.boolean().optional().default(false),
  }),
});

// List items
const bulletedListItemSchema = z.object({
  type: z.literal('bulleted_list_item'),
  bulleted_list_item: z.object({
    rich_text: richTextArraySchema,
    color: colorSchema.optional().default('default'),
    children: z.lazy(() => blockArraySchema).optional(),
  }),
});

const numberedListItemSchema = z.object({
  type: z.literal('numbered_list_item'),
  numbered_list_item: z.object({
    rich_text: richTextArraySchema,
    color: colorSchema.optional().default('default'),
    children: z.lazy(() => blockArraySchema).optional(),
  }),
});

// To do block
const todoBlockSchema = z.object({
  type: z.literal('to_do'),
  to_do: z.object({
    rich_text: richTextArraySchema,
    checked: z.boolean().optional(),
    color: colorSchema.optional().default('default'),
    children: z.lazy(() => blockArraySchema).optional(),
  }),
});

// Toggle block
const toggleBlockSchema = z.object({
  type: z.literal('toggle'),
  toggle: z.object({
    rich_text: richTextArraySchema,
    color: colorSchema.optional().default('default'),
    children: z.lazy(() => blockArraySchema).optional(),
  }),
});

// Code block
const codeBlockSchema = z.object({
  type: z.literal('code'),
  code: z.object({
    rich_text: richTextArraySchema,
    caption: richTextArraySchema.optional(),
    language: z.enum([
      'abap', 'arduino', 'bash', 'basic', 'c', 'clojure', 'coffeescript', 'c++', 'c#', 'css',
      'dart', 'diff', 'docker', 'elixir', 'elm', 'erlang', 'flow', 'fortran', 'f#', 'gherkin',
      'glsl', 'go', 'graphql', 'groovy', 'haskell', 'html', 'java', 'javascript', 'json',
      'julia', 'kotlin', 'latex', 'less', 'lisp', 'livescript', 'lua', 'makefile', 'markdown',
      'markup', 'matlab', 'mermaid', 'nix', 'objective-c', 'ocaml', 'pascal', 'perl', 'php',
      'plain text', 'powershell', 'prolog', 'protobuf', 'python', 'r', 'reason', 'ruby', 'rust',
      'sass', 'scala', 'scheme', 'scss', 'shell', 'sql', 'swift', 'typescript', 'vb.net',
      'verilog', 'vhdl', 'visual basic', 'webassembly', 'xml', 'yaml', 'java/c/c++/c#',
    ]).optional(),
  }),
});

// Quote block
const quoteBlockSchema = z.object({
  type: z.literal('quote'),
  quote: z.object({
    rich_text: richTextArraySchema,
    color: colorSchema.optional().default('default'),
    children: z.lazy(() => blockArraySchema).optional(),
  }),
});

// Callout block
const calloutBlockSchema = z.object({
  type: z.literal('callout'),
  callout: z.object({
    rich_text: richTextArraySchema,
    icon: z.union([
      z.object({
        type: z.literal('emoji'),
        emoji: z.string(),
      }),
      z.object({
        type: z.literal('external'),
        external: z.object({
          url: z.string(),
        }),
      }),
    ]),
    color: colorSchema.optional().default('default'),
    children: z.lazy(() => blockArraySchema).optional(),
  }),
});

// Divider block
const dividerBlockSchema = z.object({
  type: z.literal('divider'),
  divider: z.object({}),
});

// Table block
const tableBlockSchema = z.object({
  type: z.literal('table'),
  table: z.object({
    table_width: z.number(),
    has_column_header: z.boolean().optional().default(false),
    has_row_header: z.boolean().optional().default(false),
    children: z.array(z.object({
      type: z.literal('table_row'),
      table_row: z.object({
        cells: z.array(richTextArraySchema),
      }),
    })).optional(),
  }),
});

// Image block
const fileObjectSchema = z.union([
  z.object({
    type: z.literal('external'),
    external: z.object({
      url: z.string(),
    }),
  }),
  z.object({
    type: z.literal('file'),
    file: z.object({
      url: z.string(),
      expiry_time: z.string().optional(),
    }),
  }),
]);

const imageBlockSchema = z.object({
  type: z.literal('image'),
  image: fileObjectSchema,
});

// Video block
const videoBlockSchema = z.object({
  type: z.literal('video'),
  video: fileObjectSchema,
});

// File block
const fileBlockSchema = z.object({
  type: z.literal('file'),
  file: fileObjectSchema,
});

// Combine all block schemas into a union
const blockSchema = z.union([
  paragraphBlockSchema,
  heading1BlockSchema,
  heading2BlockSchema,
  heading3BlockSchema,
  bulletedListItemSchema,
  numberedListItemSchema,
  todoBlockSchema,
  toggleBlockSchema,
  codeBlockSchema,
  quoteBlockSchema,
  calloutBlockSchema,
  dividerBlockSchema,
  tableBlockSchema,
  imageBlockSchema,
  videoBlockSchema,
  fileBlockSchema,
  // For other block types that we haven't explicitly defined
  z.object({
    type: z.string().describe('Block type (e.g., bookmark, embed, etc.)'),
  }).catchall(z.any()).describe('Other block types'),
]).describe('A block object representing content in Notion');

const blockArraySchema = z.array(blockSchema).describe('Array of block objects');

/**
 * Make a request to the Notion API
 * @param {string} endpoint - The endpoint to call
 * @param {object} options - The request options
 * @param {string} apiKey - The Notion API key
 * @returns {Promise<object>} - The API response
 */
async function notionRequest(endpoint, options, apiKey) {
  try {
    const response = await fetch(`https://api.notion.com${endpoint}`, {
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Provide more detailed error messages for common validation errors
      if (response.status === 400 && errorData.message && errorData.message.includes('validation_error')) {
        // For rich_text related errors, provide more context
        if (errorData.message.includes('rich_text')) {
          logger.error(`Notion API validation error: ${errorData.message}`);
          logger.error('IMPORTANT: Make sure all blocks have a "rich_text" property, not "text"');

          // If we have body data, try to identify the problematic blocks
          if (options.body && options.body.children) {
            const problematicBlocks = options.body.children
              .map((block, index) => {
                const blockType = block.type;
                if (blockType && block[blockType]) {
                  if (!block[blockType].rich_text && block[blockType].text) {
                    return `Block #${index} (${blockType}) has "text" instead of required "rich_text"`;
                  }
                  if (!block[blockType].rich_text) {
                    return `Block #${index} (${blockType}) is missing required "rich_text" property`;
                  }
                }
                return null;
              })
              .filter(Boolean);

            if (problematicBlocks.length > 0) {
              logger.error(`Found problematic blocks: ${problematicBlocks.join('; ')}`);
            }
          }
        }
      }

      throw new Error(`Notion API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    logger.error(`Error in Notion API request to ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Create Notion structured tools
 * @param {object} fields - Configuration fields
 * @returns {Array} - Array of Notion tools
 */
function createNotionTools(fields = {}) {
  const envVar = 'NOTION_API_KEY';
  const override = fields.override ?? false;
  const apiKey = fields.apiKey ?? fields[envVar] ?? getApiKey(envVar, override);

  // Get database information
  const getDatabaseTool = tool(
    async ({ database_id }) => {
      const result = await notionRequest(`/v1/databases/${database_id}`, { method: 'GET' }, apiKey);
      return JSON.stringify(result, null, 2);
    },
    {
      name: 'notion_get_database',
      description: `Retrieve detailed information about a Notion database.
- Required: database_id (the ID of the database to retrieve)
- Returns: Database object with title, description, properties schema, and metadata
- Use for: Exploring database structure, understanding available properties
Example: database_id="8a3c7085-4e5e-4b89-9848-8eeac6e9a53d"`,
      schema: z.object({
        database_id: z.string().describe('The ID of the Notion database to retrieve'),
      }),
    },
  );

  // Database properties schema
  const databasePropertySchema = z.object({}).catchall(z.any()).describe('Database property schema definition');
  const databasePropertiesSchema = z.record(databasePropertySchema).describe('Map of database property schemas');

  // Page properties schema
  const pagePropertySchema = z.object({}).catchall(z.any()).describe('Page property value');
  const pagePropertiesSchema = z.record(pagePropertySchema).describe('Map of page property values');

  // Query a database
  const queryDatabaseTool = tool(
    async ({ database_id, filter, sorts, page_size, start_cursor }) => {
      const body = {};

      if (filter) {
        try {
          body.filter = typeof filter === 'string' ? JSON.parse(filter) : filter;
        } catch (error) {
          throw new Error(`Invalid filter JSON: ${error.message}`);
        }
      }

      if (sorts) {
        try {
          body.sorts = typeof sorts === 'string' ? JSON.parse(sorts) : sorts;
        } catch (error) {
          throw new Error(`Invalid sorts JSON: ${error.message}`);
        }
      }

      if (page_size) {
        body.page_size = page_size;
      }

      if (start_cursor) {
        body.start_cursor = start_cursor;
      }

      const result = await notionRequest(
        `/v1/databases/${database_id}/query`,
        {
          method: 'POST',
          body,
        },
        apiKey,
      );

      return JSON.stringify(result, null, 2);
    },
    {
      name: 'notion_query_database',
      description: `Query a Notion database with filters and sorting.
- Required: database_id (the ID of the database to query)
- Optional: filter (JSON object for filtering results)
- Optional: sorts (JSON array defining sort order)
- Optional: page_size (number of results per page, max 100)
- Optional: start_cursor (pagination cursor)
- Returns: Matching database items
- Use for: Retrieving filtered database entries
Example: database_id="abc123" filter={"property":"Status","select":{"equals":"Active"}}`,
      schema: z.object({
        database_id: z.string().describe('The ID of the Notion database to query'),
        filter: z.union([
          z.string().describe('Filter criteria as a JSON string that will be parsed'),
          filterSchema,
        ]).optional().describe('Filter criteria as a JSON object or string'),
        sorts: z.union([
          z.string().describe('Sort criteria as a JSON string that will be parsed'),
          z.array(sortSchema),
        ]).optional().describe('Sort criteria as a JSON array or string'),
        page_size: z.number().min(1).max(100).optional().describe('Number of results per page'),
        start_cursor: z.string().optional().describe('Pagination cursor'),
      }),
    },
  );

  // Update a database
  const updateDatabaseTool = tool(
    async ({ database_id, title, properties, description }) => {
      const body = {};

      if (title) {
        body.title = Array.isArray(title) ? title : [
          {
            type: 'text',
            text: { content: title },
          },
        ];
      }

      if (properties) {
        try {
          body.properties = typeof properties === 'string' ? JSON.parse(properties) : properties;
        } catch (error) {
          throw new Error(`Invalid properties JSON: ${error.message}`);
        }
      }

      if (description) {
        body.description = Array.isArray(description) ? description : [
          {
            type: 'text',
            text: { content: description },
          },
        ];
      }

      const result = await notionRequest(
        `/v1/databases/${database_id}`,
        {
          method: 'PATCH',
          body,
        },
        apiKey,
      );

      return JSON.stringify(result, null, 2);
    },
    {
      name: 'notion_update_database',
      description: `Update a Notion database's properties or schema.
- Required: database_id (the ID of the database to update)
- Optional: title (new database title)
- Optional: properties (JSON object with property schemas to update)
- Optional: description (new database description)
- Returns: Updated database object
- Use for: Renaming databases, updating property schemas
Example: database_id="abc123" properties={"Status":{"name":"New Status Name"}}`,
      schema: z.object({
        database_id: z.string().describe('The ID of the Notion database to update'),
        title: z.string().optional().describe('New title for the database'),
        properties: z.union([
          z.string().describe('Properties schema as a JSON string that will be parsed'),
          databasePropertiesSchema,
        ]).optional().describe('Properties schema as a JSON object or string'),
        description: z.string().optional().describe('New description for the database'),
      }),
    },
  );

  // Create a database
  const createDatabaseTool = tool(
    async ({ parent_id, title, properties, parent_type }) => {
      if (!parent_id || !title || !properties) {
        throw new Error('Missing required parameters: parent_id, title, and properties are required');
      }

      let parsedProperties;
      try {
        parsedProperties = typeof properties === 'string' ? JSON.parse(properties) : properties;
      } catch (error) {
        throw new Error(`Invalid properties JSON: ${error.message}`);
      }

      const parentType = parent_type || 'page_id';
      const body = {
        parent: {
          type: parentType,
          [parentType]: parent_id,
        },
        title: [
          {
            type: 'text',
            text: { content: title },
          },
        ],
        properties: parsedProperties,
      };

      const result = await notionRequest(
        '/v1/databases',
        {
          method: 'POST',
          body,
        },
        apiKey,
      );

      return JSON.stringify(result, null, 2);
    },
    {
      name: 'notion_create_database',
      description: `Create a new Notion database with specified schema.
- Required: parent_id (ID of parent page/workspace)
- Required: title (database title)
- Required: properties (JSON object defining database schema)
- Optional: parent_type (either "page_id" or "workspace", default: "page_id")
- Returns: Created database object
- Use for: Creating new databases with custom schemas
Example: parent_id="abc123" title="Tasks" properties={"Name":{"title":{}},"Status":{"select":{"options":[{"name":"To Do"},{"name":"In Progress"},{"name":"Done"}]}}}`,
      schema: z.object({
        parent_id: z.string().describe('ID of parent page or workspace'),
        title: z.string().describe('Title of the new database'),
        properties: z.union([
          z.string().describe('Database schema as a JSON string that will be parsed'),
          databasePropertiesSchema,
        ]).describe('Database schema as a JSON object or string'),
        parent_type: z.enum(['page_id', 'workspace']).optional().describe('Type of parent (page_id or workspace)'),
      }),
    },
  );

  // Get page information
  const getPageTool = tool(
    async ({ page_id }) => {
      const result = await notionRequest(`/v1/pages/${page_id}`, { method: 'GET' }, apiKey);
      return JSON.stringify(result, null, 2);
    },
    {
      name: 'notion_get_page',
      description: `Retrieve detailed information about a Notion page.
- Required: page_id (the ID of the page to retrieve)
- Returns: Page object with properties and metadata
- Use for: Getting page details, checking page properties
Example: page_id="c4d39556-6364-46a1-8a61-ebbb668f7445"`,
      schema: z.object({
        page_id: z.string().describe('The ID of the Notion page to retrieve'),
      }),
    },
  );

  /**
   * Fetch parent information (database or page) to validate properties
   * @param {string} parentId - The ID of the parent
   * @param {string} parentType - The type of parent ('database_id' or 'page_id')
   * @returns {Promise<object>} - Parent information
   */
  async function fetchParentInfo(parentId, parentType) {
    if (parentType === 'database_id') {
      return await notionRequest(`/v1/databases/${parentId}`, { method: 'GET' }, apiKey);
    } else if (parentType === 'page_id') {
      return await notionRequest(`/v1/pages/${parentId}`, { method: 'GET' }, apiKey);
    }
    throw new Error(`Invalid parent_type: ${parentType}. Must be 'database_id' or 'page_id'.`);
  }

  /**
   * Validate block object structure
   * @param {object} block - The block object to validate
   * @returns {boolean} - Whether the block is valid
   */
  function isValidBlockObject(block) {
    try {
      // Use our block schema to validate the block
      const validationResult = blockSchema.safeParse(block);

      if (!validationResult.success) {
        const errors = validationResult.error.format();
        logger.debug('Block validation failed', {
          blockType: block?.type,
          errors: JSON.stringify(errors, null, 2),
        });

        // Check for common errors that might not be caught by the schema
        if (block && block.type) {
          const contentKey = block.type;
          const contentObj = block[contentKey];

          // Explicitly check for rich_text since this is a common issue
          if (contentObj && contentObj.text && !contentObj.rich_text) {
            logger.debug(`Block validation error: ${contentKey}.rich_text is missing, but ${contentKey}.text is present. Notion requires rich_text.`);
            return false;
          }

          // For heading blocks, explicitly verify rich_text exists
          if (['heading_1', 'heading_2', 'heading_3', 'paragraph', 'bulleted_list_item', 'numbered_list_item'].includes(contentKey)) {
            if (!contentObj || !contentObj.rich_text || !Array.isArray(contentObj.rich_text)) {
              logger.debug(`Block validation error: ${contentKey}.rich_text must be an array`);
              return false;
            }

            // Verify rich_text items have proper structure
            for (const [idx, item] of contentObj.rich_text.entries()) {
              if (!item.type || !item.text || typeof item.text.content !== 'string') {
                logger.debug(`Block validation error: ${contentKey}.rich_text[${idx}] is missing required fields (type, text.content)`);
                return false;
              }
            }
          }
        }

        return false;
      }

      return true;
    } catch (error) {
      logger.debug('Block validation exception', { error: error.message, block: JSON.stringify(block).substring(0, 200) });

      // Fallback to basic validation if schema validation fails
      if (!block || typeof block !== 'object') {return false;}
      if (!block.type || typeof block.type !== 'string') {return false;}
      if (!block[block.type]) {return false;}

      // Additional basic checks
      const blockType = block.type;
      const content = block[blockType];

      // Check for text vs rich_text confusion
      if (content && content.text && !content.rich_text) {
        logger.debug(`Fallback validation error: ${blockType}.rich_text is required, but only ${blockType}.text was provided`);
        return false;
      }

      return false;
    }
  }

  // Create a page
  const createPageTool = tool(
    async ({ parent_id, parent_type, properties, children, icon, cover }) => {
      if (!parent_id || !properties) {
        throw new Error('Missing required parameters: parent_id and properties are required');
      }

      const parentType = parent_type || 'page_id';

      // Validate parent_type
      if (parentType !== 'page_id' && parentType !== 'database_id') {
        throw new Error('parent_type must be either "page_id" or "database_id"');
      }

      // Fetch parent information to validate properties
      let parentInfo;
      try {
        parentInfo = await fetchParentInfo(parent_id, parentType);
      } catch (error) {
        throw new Error(`Failed to fetch parent information: ${error.message}. Please verify the parent_id and parent_type are correct.`);
      }

      // Parse properties
      let parsedProperties;
      try {
        parsedProperties = typeof properties === 'string' ? JSON.parse(properties) : properties;
      } catch (error) {
        throw new Error(`Invalid properties JSON: ${error.message}`);
      }

      // Validate properties based on parent type
      if (parentType === 'database_id') {
        // Check if properties match database schema
        const dbProperties = parentInfo.properties || {};
        const dbPropertyNames = Object.keys(dbProperties);
        const providedPropertyNames = Object.keys(parsedProperties);

        // Check for required properties (especially 'title' property if database has one)
        let titlePropertyName = null;
        for (const [propName, propConfig] of Object.entries(dbProperties)) {
          if (propConfig.type === 'title') {
            titlePropertyName = propName;
            if (!providedPropertyNames.includes(propName)) {
              throw new Error(`Missing required title property '${propName}' for this database. The database requires these properties: ${dbPropertyNames.join(', ')}`);
            }
            break;
          }
        }

        // Check for unknown properties
        const unknownProps = providedPropertyNames.filter(prop => !dbPropertyNames.includes(prop));
        if (unknownProps.length > 0) {
          throw new Error(`Unknown properties: ${unknownProps.join(', ')}. This database accepts these properties: ${dbPropertyNames.join(', ')}`);
        }
      } else if (parentType === 'page_id') {
        // For pages, only title is allowed as a property
        const propKeys = Object.keys(parsedProperties);
        if (propKeys.length > 1 || (propKeys.length === 1 && propKeys[0] !== 'title')) {
          throw new Error('When parent is a page, the only valid property is "title"');
        }
      }

      // Create the request body
      const body = {
        parent: {
          type: parentType === 'page_id' ? 'page_id' : 'database_id',
          [parentType]: parent_id,
        },
        properties: parsedProperties,
      };

      // Validate and add children if provided
      if (children) {
        let parsedChildren;
        try {
          parsedChildren = typeof children === 'string' ? JSON.parse(children) : children;
        } catch (error) {
          throw new Error(`Invalid children JSON: ${error.message}`);
        }

        // Validate children array
        if (!Array.isArray(parsedChildren)) {
          throw new Error('children must be an array of block objects');
        }
        console.log('parsedChildren', parsedChildren);
        // Validate each block in the children array
        for (const [index, block] of parsedChildren.entries()) {
          if (!isValidBlockObject(block)) {
            throw new Error(`Invalid block object at index ${index}. Each block must be an object with a 'type' property and a corresponding property of the same name.`);
          }
        }

        body.children = parsedChildren;
      }

      // Add icon if provided
      if (icon) {
        try {
          body.icon = typeof icon === 'string' ? JSON.parse(icon) : icon;

          // Validate icon format
          if (!body.icon.type || (body.icon.type !== 'emoji' && body.icon.type !== 'external')) {
            throw new Error('Icon must have a type of either "emoji" or "external"');
          }

          if (body.icon.type === 'emoji' && typeof body.icon.emoji !== 'string') {
            throw new Error('Emoji icon must have an "emoji" string property');
          }

          if (body.icon.type === 'external' && (!body.icon.external || !body.icon.external.url)) {
            throw new Error('External icon must have an "external" object with a "url" property');
          }
        } catch (error) {
          throw new Error(`Invalid icon: ${error.message}`);
        }
      }

      // Add cover if provided
      if (cover) {
        try {
          body.cover = typeof cover === 'string' ? JSON.parse(cover) : cover;

          // Validate cover format
          if (!body.cover.type || body.cover.type !== 'external') {
            throw new Error('Cover must have a type of "external"');
          }

          if (!body.cover.external || !body.cover.external.url) {
            throw new Error('Cover must have an "external" object with a "url" property');
          }
        } catch (error) {
          throw new Error(`Invalid cover: ${error.message}`);
        }
      }

      // Make the API request to create the page
      try {
        const result = await notionRequest(
          '/v1/pages',
          {
            method: 'POST',
            body,
          },
          apiKey,
        );

        return JSON.stringify(result, null, 2);
      } catch (error) {
        if (error.message.includes('Notion API error')) {
          // Extract more information about the error if possible
          try {
            const errorDetail = JSON.parse(error.message.split(' - ')[1]);
            if (errorDetail.message) {
              throw new Error(`Failed to create page: ${errorDetail.message}`);
            }
          } catch (e) {
            // If we can't parse the error detail, just throw the original error
          }
        }
        throw error;
      }
    },
    {
      name: 'notion_create_page',
      description: 'Create a Notion page with properties and content under a parent page or database.',
      description_for_model: `// Create a new Notion page with properties and content
// Required: parent_id (ID of parent page/database)
// Required: properties (JSON object with page properties)
// Optional: parent_type (either "page_id" or "database_id", default: "page_id")
// Optional: children (JSON array of block objects for page content)
// Optional: icon (JSON object for page icon)
// Optional: cover (JSON object for page cover)
// 
// IMPORTANT: If parent is a database, properties must match the database schema
// IMPORTANT: If parent is a page, only 'title' is allowed as a property
// IMPORTANT: Block objects that mainly contain text in 'children' MUST have a 'rich_text' property (NOT 'text')
// 
// Example 1 (Page in database): 
// parent_id="abc123" parent_type="database_id" properties={"Name":{"title":[{"text":{"content":"New Task"}}]}}
// 
// Example 2 (Page as subpage): 
// parent_id="abc123" parent_type="page_id" properties={"title":[{"text":{"content":"New Page"}}]}
// 
// Example 3 (Page with content blocks): 
// parent_id="abc123" parent_type="page_id" properties={"title":[{"text":{"content":"Meeting Notes"}}]} children=[
//   {
//     "type": "heading_1",
//     "heading_1": {
//       "rich_text": [  // IMPORTANT: Use 'rich_text', not 'text'
//         {
//           "type": "text",
//           "text": {
//             "content": "Team Meeting"
//           }
//         }
//       ]
//     }
//   },
//   {
//     "type": "paragraph",
//     "paragraph": {
//       "rich_text": [  // IMPORTANT: Use 'rich_text', not 'text'
//         {
//           "type": "text",
//           "text": {
//             "content": "We discussed the following points:"
//           }
//         }
//       ]
//     }
//   },
//   {
//     "type": "bulleted_list_item",
//     "bulleted_list_item": {
//       "rich_text": [  // IMPORTANT: Use 'rich_text', not 'text'
//         {
//           "type": "text",
//           "text": {
//             "content": "Project timeline"
//           }
//         }
//       ]
//     }
//   }
// ]`,
      schema: z.object({
        parent_id: z.string().describe('ID of parent page or database'),
        properties: z.union([
          z.string().describe('Page properties as a JSON string that will be parsed'),
          z.record(z.any()).describe('Page properties as a JSON object'),
        ]).describe('Page properties as a JSON object or string. For database parents, must match database schema. For page parents, only "title" is allowed.'),
        parent_type: z.enum(['page_id', 'database_id']).optional().describe('Type of parent (page_id or database_id)'),
        children: z.union([
          z.string().describe('Page content blocks as a JSON string that will be parsed'),
          z.array(z.record(z.any())).describe('Array of content blocks'),
        ]).optional().describe('Page content blocks as a JSON array. Each block must have a "type" property and a corresponding property of the same name.'),
        icon: z.union([
          z.string().describe('Icon as a JSON string that will be parsed'),
          z.record(z.any()).describe('Icon object'),
        ]).optional().describe('Page icon as a JSON object with type "emoji" or "external"'),
        cover: z.union([
          z.string().describe('Cover as a JSON string that will be parsed'),
          z.record(z.any()).describe('Cover object'),
        ]).optional().describe('Page cover as a JSON object with type "external"'),
      }),
    },
  );

  // Update a page
  const updatePagePropertiesTool = tool(
    async ({ page_id, properties, archived, icon, cover }) => {
      const body = {};

      if (properties) {
        try {
          body.properties = typeof properties === 'string' ? JSON.parse(properties) : properties;
        } catch (error) {
          throw new Error(`Invalid properties JSON: ${error.message}`);
        }
      }

      if (archived !== undefined) {
        body.archived = archived;
      }

      if (icon) {
        try {
          body.icon = typeof icon === 'string' ? JSON.parse(icon) : icon;

          // Validate icon format
          if (!body.icon.type || (body.icon.type !== 'emoji' && body.icon.type !== 'external')) {
            throw new Error('Icon must have a type of either "emoji" or "external"');
          }

          if (body.icon.type === 'emoji' && typeof body.icon.emoji !== 'string') {
            throw new Error('Emoji icon must have an "emoji" string property');
          }

          if (body.icon.type === 'external' && (!body.icon.external || !body.icon.external.url)) {
            throw new Error('External icon must have an "external" object with a "url" property');
          }
        } catch (error) {
          throw new Error(`Invalid icon: ${error.message}`);
        }
      }

      if (cover) {
        try {
          body.cover = typeof cover === 'string' ? JSON.parse(cover) : cover;

          // Validate cover format
          if (!body.cover.type || body.cover.type !== 'external') {
            throw new Error('Cover must have a type of "external"');
          }

          if (!body.cover.external || !body.cover.external.url) {
            throw new Error('Cover must have an "external" object with a "url" property');
          }
        } catch (error) {
          throw new Error(`Invalid cover: ${error.message}`);
        }
      }

      // Make the API request to update the page
      try {
        const result = await notionRequest(
          `/v1/pages/${page_id}`,
          {
            method: 'PATCH',
            body,
          },
          apiKey,
        );

        return JSON.stringify(result, null, 2);
      } catch (error) {
        if (error.message.includes('Notion API error')) {
          // Extract more information about the error if possible
          try {
            const errorDetail = JSON.parse(error.message.split(' - ')[1]);
            if (errorDetail.message) {
              throw new Error(`Failed to update page properties: ${errorDetail.message}`);
            }
          } catch (e) {
            // If we can't parse the error detail, just throw the original error
          }
        }
        throw error;
      }
    },
    {
      name: 'notion_update_page_properties',
      description: `Update a Notion page's properties, archive status, icon, or cover.
- Required: page_id (the ID of the page to update)
- Optional: properties (JSON object with properties to update)
- Optional: archived (boolean, set to true to archive the page)
- Optional: icon (JSON object for page icon)
- Optional: cover (JSON object for page cover)
- Returns: Updated page object
- NOTE: This tool only updates page PROPERTIES, not page CONTENT. To add content, use notion_append_block_children.
- Use for: Updating page properties, archiving pages, changing icons or covers
Example: page_id="abc123" properties={"Status":{"select":{"name":"Completed"}}} archived=false`,
      schema: z.object({
        page_id: z.string().describe('The ID of the Notion page to update'),
        properties: z.union([
          z.string().describe('Properties to update as a JSON string that will be parsed'),
          pagePropertiesSchema,
        ]).optional().describe('Properties to update as a JSON object or string'),
        archived: z.boolean().optional().describe('Whether the page should be archived'),
        icon: z.union([
          z.string().describe('Icon as a JSON string that will be parsed'),
          iconSchema,
        ]).optional().describe('Page icon as a JSON object with type "emoji" or "external"'),
        cover: z.union([
          z.string().describe('Cover as a JSON string that will be parsed'),
          coverSchema,
        ]).optional().describe('Page cover as a JSON object with type "external"'),
      }),
    },
  );

  // Append block children
  const appendBlockChildrenTool = tool(
    async ({ block_id, children, after }) => {
      if (!block_id || !children) {
        throw new Error('Missing required parameters: block_id and children are required');
      }

      // Validate and parse children
      let parsedChildren;
      try {
        parsedChildren = typeof children === 'string' ? JSON.parse(children) : children;
      } catch (error) {
        throw new Error(`Invalid children JSON: ${error.message}`);
      }

      // Validate children array
      if (!Array.isArray(parsedChildren)) {
        throw new Error('children must be an array of block objects');
      }

      if (parsedChildren.length > 100) {
        throw new Error('Cannot append more than 100 block children in a single request');
      }

      // Validate each block in the children array
      for (const [index, block] of parsedChildren.entries()) {
        if (!isValidBlockObject(block)) {
          throw new Error(`Invalid block object at index ${index}. Each block must be an object with a 'type' property and a corresponding property of the same name.`);
        }

        // Check if the block has nested children and validate those too
        if (block.children && Array.isArray(block.children)) {
          for (const [childIndex, childBlock] of block.children.entries()) {
            if (!isValidBlockObject(childBlock)) {
              throw new Error(`Invalid nested block object at parent index ${index}, child index ${childIndex}. Each block must have a 'type' property and a corresponding property of the same name.`);
            }

            // Notion API allows a maximum of 2 levels of nesting
            if (childBlock.children && Array.isArray(childBlock.children) && childBlock.children.length > 0) {
              throw new Error(`Nested blocks cannot have their own children (at parent index ${index}, child index ${childIndex}). The Notion API only allows 2 levels of nesting.`);
            }
          }
        }
      }

      const body = {
        children: parsedChildren,
      };

      if (after) {
        body.after = after;
      }

      // Make the API request to append block children
      try {
        const result = await notionRequest(
          `/v1/blocks/${block_id}/children`,
          {
            method: 'PATCH',
            body,
          },
          apiKey,
        );

        return JSON.stringify(result, null, 2);
      } catch (error) {
        if (error.message.includes('Notion API error')) {
          // Extract more information about the error if possible
          try {
            const errorDetail = JSON.parse(error.message.split(' - ')[1]);
            if (errorDetail.message) {
              throw new Error(`Failed to append block children: ${errorDetail.message}`);
            }
          } catch (e) {
            // If we can't parse the error detail, just throw the original error
          }
        }
        throw error;
      }
    },
    {
      name: 'notion_append_block_children',
      description: 'Add content blocks to a Notion page or existing block.',
      description_for_model: `// Append content blocks to a Notion page or block
// Required: block_id (ID of the block or page to append children to)
// Required: children (JSON array of block objects to append)
// Optional: after (ID of the block to insert the new blocks after)
// 
// IMPORTANT: Limited to 100 blocks per request
// IMPORTANT: Maximum of 2 levels of nesting allowed
// IMPORTANT: Blocks MUST have a 'rich_text' property (NOT 'text')
// NOTE: For adding content to pages, use the page_id as the block_id
// 
// Example 1 (Adding paragraph): 
// block_id="abc123" children=[
//   {
//     "type": "paragraph",
//     "paragraph": {
//       "rich_text": [  // IMPORTANT: Use 'rich_text', not 'text'
//         {
//           "type": "text",
//           "text": {
//             "content": "New content"
//           }
//         }
//       ],
//       "color": "default"
//     }
//   }
// ]
//
// Example 2 (Adding multiple blocks):
// block_id="abc123" children=[
//   {
//     "type": "heading_2",
//     "heading_2": {
//       "rich_text": [  // IMPORTANT: Use 'rich_text', not 'text'
//         {
//           "type": "text",
//           "text": {
//             "content": "Section Title"
//           }
//         }
//       ]
//     }
//   },
//   {
//     "type": "bulleted_list_item",
//     "bulleted_list_item": {
//       "rich_text": [  // IMPORTANT: Use 'rich_text', not 'text'
//         {
//           "type": "text",
//           "text": {
//             "content": "List item"
//           }
//         }
//       ]
//     }
//   }
// ]`,
      schema: z.object({
        block_id: z.string().describe('ID of the block or page to append children to'),
        children: z.union([
          z.string().describe('JSON string of block objects that will be parsed'),
          z.array(z.record(z.any())).describe('Array of content blocks'),
        ]).describe('Content blocks as a JSON array or string. Each block must have a "type" property and a corresponding property of the same name.'),
        after: z.string().optional().describe('ID of the block to insert the new blocks after'),
      }),
    },
  );

  // Search
  const searchTool = tool(
    async ({ query, filter, sort, start_cursor, page_size }) => {
      const body = {};

      if (query) {
        body.query = query;
      }

      if (filter) {
        try {
          body.filter = typeof filter === 'string' ? JSON.parse(filter) : filter;
        } catch (error) {
          throw new Error(`Invalid filter JSON: ${error.message}`);
        }
      }

      if (sort) {
        try {
          body.sort = typeof sort === 'string' ? JSON.parse(sort) : sort;
        } catch (error) {
          throw new Error(`Invalid sort JSON: ${error.message}`);
        }
      }

      if (start_cursor) {
        body.start_cursor = start_cursor;
      }

      if (page_size) {
        body.page_size = page_size;
      }

      const result = await notionRequest(
        '/v1/search',
        {
          method: 'POST',
          body,
        },
        apiKey,
      );

      return JSON.stringify(result, null, 2);
    },
    {
      name: 'notion_search',
      description: 'Search for pages and databases in a Notion workspace.',
      description_for_model: `// Search for pages and databases in a Notion workspace
// Optional: query (search term to find in titles and content)
// Optional: filter (JSON object to filter results by type)
// Optional: sort (JSON object for sorting results)
// Optional: start_cursor (pagination cursor)
// Optional: page_size (number of results per page, default 100, max 100)
// 
// Returns: Search results with page/database objects and pagination details
// Use for: Finding content across your workspace, filtered searches
// 
// Example 1 (Basic search): 
// query="project notes"
// 
// Example 2 (Filtered search): 
// query="meeting" filter={"property":"object","value":"page"}
// 
// Example 3 (Sorted search): 
// query="task" sort={"direction":"ascending","timestamp":"last_edited_time"}`,
      schema: z.object({
        query: z.string().optional().describe('Text to search for in titles and content'),
        filter: z.union([
          z.string().describe('Filter criteria as a JSON string that will be parsed'),
          z.record(z.any()).describe('Filter object'),
        ]).optional().describe('Filter to apply to the search results'),
        sort: z.union([
          z.string().describe('Sort criteria as a JSON string that will be parsed'),
          z.record(z.any()).describe('Sort object'),
        ]).optional().describe('Sort order for search results'),
        start_cursor: z.string().optional().describe('Pagination cursor from a previous response'),
        page_size: z.number().min(1).max(100).optional().describe('Number of results per page'),
      }),
    },
  );

  // Get comments
  const getCommentsTool = tool(
    async ({ block_id, page_id, start_cursor, page_size }) => {
      if (!block_id && !page_id) {
        throw new Error('Either block_id or page_id must be provided');
      }

      const queryParams = new URLSearchParams();

      if (block_id) {
        queryParams.append('block_id', block_id);
      } else if (page_id) {
        queryParams.append('page_id', page_id);
      }

      if (start_cursor) {
        queryParams.append('start_cursor', start_cursor);
      }

      if (page_size) {
        queryParams.append('page_size', page_size.toString());
      }

      const result = await notionRequest(
        `/v1/comments?${queryParams.toString()}`,
        { method: 'GET' },
        apiKey,
      );

      return JSON.stringify(result, null, 2);
    },
    {
      name: 'notion_get_comments',
      description: 'Retrieve comments for a Notion page or block.',
      description_for_model: `// Retrieve comments for a Notion page or block
// Required: Either block_id or page_id must be provided
// Optional: start_cursor (pagination cursor)
// Optional: page_size (number of comments per page, max 100)
// 
// Returns: List of comments with authors and content
// Use for: Viewing discussions, analyzing feedback
// 
// Example 1 (Get comments on a page): 
// page_id="abc123" page_size=50
// 
// Example 2 (Get comments on a block): 
// block_id="def456"`,
      schema: z.object({
        block_id: z.string().optional().describe('ID of the block to get comments for'),
        page_id: z.string().optional().describe('ID of the page to get comments for'),
        start_cursor: z.string().optional().describe('Pagination cursor from a previous response'),
        page_size: z.number().min(1).max(100).optional().describe('Number of comments per page'),
      }),
    },
  );

  // Create a comment
  const createCommentTool = tool(
    async ({ parent_id, parent_type, discussion_id, rich_text }) => {
      if (!rich_text) {
        throw new Error('rich_text is required');
      }

      if (!discussion_id && (!parent_id || !parent_type)) {
        throw new Error('Either discussion_id or both parent_id and parent_type must be provided');
      }

      const body = {};

      if (!discussion_id) {
        body.parent = {
          [parent_type]: parent_id,
        };
      } else {
        body.discussion_id = discussion_id;
      }

      if (typeof rich_text === 'string') {
        // Convert simple text to the required rich text format
        body.rich_text = [
          {
            type: 'text',
            text: {
              content: rich_text,
            },
          },
        ];
      } else {
        body.rich_text = rich_text;
      }

      const result = await notionRequest(
        '/v1/comments',
        {
          method: 'POST',
          body,
        },
        apiKey,
      );

      return JSON.stringify(result, null, 2);
    },
    {
      name: 'notion_create_comment',
      description: 'Create a new comment on a Notion page, block, or existing discussion thread.',
      description_for_model: `// Create a new comment on a Notion page or block
// Required: rich_text (text content for the comment)
// Conditional: Either discussion_id OR both parent_id and parent_type are required
// Optional: parent_id (ID of page or block to comment on) when not using discussion_id
// Optional: parent_type (either "page_id" or "block_id") when not using discussion_id
// Optional: discussion_id (ID of existing discussion thread)
// 
// Use for: Adding comments, starting discussions
// 
// Example 1 (New comment on a page): 
// parent_id="abc123" parent_type="page_id" rich_text="Great work on this page!"
// 
// Example 2 (Reply in an existing thread): 
// discussion_id="def456" rich_text="I agree with this point."
// 
// Example 3 (Formatted comment): 
// parent_id="abc123" parent_type="page_id" rich_text=[{"type":"text","text":{"content":"This is "}},{"type":"text","text":{"content":"important"},"annotations":{"bold":true}}]`,
      schema: z.object({
        parent_id: z.string().optional().describe('ID of the page or block to comment on'),
        parent_type: z.enum(['page_id', 'block_id']).optional().describe('Type of parent (page_id or block_id)'),
        discussion_id: z.string().optional().describe('ID of existing discussion thread'),
        rich_text: z.union([
          z.string().describe('Simple text content that will be converted to rich text format'),
          z.array(z.record(z.any())).describe('Rich text array for formatted text'),
        ]).describe('Comment text content as either a simple string or rich text array'),
      }),
    },
  );

  // Get block children
  const getBlockChildrenTool = tool(
    async ({ block_id, page_size, start_cursor }) => {
      if (!block_id) {
        throw new Error('block_id is required');
      }

      const queryParams = new URLSearchParams();

      if (block_id) {
        queryParams.append('block_id', block_id);
      }

      if (page_size) {
        queryParams.append('page_size', page_size.toString());
      }

      if (start_cursor) {
        queryParams.append('start_cursor', start_cursor);
      }

      const result = await notionRequest(
        `/v1/blocks/${block_id}/children?${queryParams.toString()}`,
        { method: 'GET' },
        apiKey,
      );

      return JSON.stringify(result, null, 2);
    },
    {
      name: 'notion_get_block_children',
      description: 'Retrieve child blocks of a Notion page or block.',
      description_for_model: `// Retrieve child blocks of a Notion page or block
// Required: block_id (ID of the parent block or page)
// Optional: page_size (number of items to return, default 100, max 100)
// Optional: start_cursor (pagination cursor for retrieving additional results)
// 
// Returns: An object containing an array of child blocks and pagination details
// Use for: Retrieving block content, getting nested content, paginating through large content
// 
// Example: block_id="abc123" page_size=50`,
      schema: z.object({
        block_id: z.string().describe('ID of the parent block or page to retrieve children from'),
        page_size: z.number().optional().describe('Number of items to return (default: 100, max: 100)'),
        start_cursor: z.string().optional().describe('Pagination cursor from a previous response'),
      }),
    },
  );

  return [
    getDatabaseTool,
    queryDatabaseTool,
    updateDatabaseTool,
    createDatabaseTool,
    getPageTool,
    createPageTool,
    updatePagePropertiesTool,
    appendBlockChildrenTool,
    searchTool,
    getCommentsTool,
    createCommentTool,
    getBlockChildrenTool,
  ];
}

module.exports = createNotionTools;