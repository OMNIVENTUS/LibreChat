this file will contain history and notes on files / paths / sections / methods that have been modified.

### 2026-06-11 — Phase 2 recovery: upstream v0.8.6 merged (tag `fork-v0.8.6`)

Merged tag `v0.8.6` on branch `merge/upstream-v0.8.6` from `fork-v0.8.1-rc2`; all 39 conflicts
resolved with upstream as base + `[OMNIVENTUS]` re-insertions. Modernizations (see recovery/PHASE-2-GOAL.md):
note — v0.8.6 still builds with rollup + turbo (the tsdown migration is in a later upstream release).
Current divergence ledger (replaces the Phase 1 list):

[UPDATE] packages/data-provider/src/permissions.ts — USER_ADMIN type (+interface-field map entry), DELETE permission, userAdminPermissionsSchema
[UPDATE] packages/data-provider/src/roles.ts — MANAGER role on the v0.8.6 expanded permission system (MCP_SERVERS/REMOTE_AGENTS/SKILLS); USER_ADMIN in ADMIN/MANAGER/USER defaults
[UPDATE] packages/data-provider/src/api-endpoints.ts — adminUsers()/deleteUserById() point at the native /api/admin/users API; users()/updateUser() kept (custom PUT)
[UPDATE] packages/data-provider/src/data-service.ts — getUsers() paginates the native admin API; deleteUserById() uses it; updateUser() unchanged
[UPDATE] packages/data-provider/src/config.ts — fileAccessGroups in TStartupConfig
[UPDATE] packages/data-provider/src/types.ts — TUser emailVerified + file_access_groups
[UPDATE] packages/data-schemas/src/schema/{file,user,role,message}.ts — scope/access_control, file_access_groups, USER_ADMIN sub-schema, contextualActions
[UPDATE] packages/data-schemas/src/types/{file,user,admin}.ts — matching type fields; AdminUserListItem.file_access_groups
[UPDATE] packages/data-schemas/src/methods/role.ts — MANAGER seeded by initializeRoles
[UPDATE] packages/data-schemas/src/methods/systemGrant.ts — MANAGER granted access:admin/read:users/manage:users
[UPDATE] packages/api/src/admin/users.ts — file_access_groups in list projection/mapping
[UPDATE] api/server/routes/admin/users.js — DELETE /:id route enabled (upstream handler, MANAGE_USERS guard)
[UPDATE] api/server/routes/users.js + controllers/UsersController.js — retired GET/DELETE (native admin API); only PUT /api/users/:userId remains (role + file_access_groups)
[UPDATE] api/server/index.js — initBusinessActions() + runAsSystem(preloadFiles) after updateInterfacePermissions; /api/users mount
[UPDATE] api/server/middleware/roles/index.js — checkStrictAdmin export (checkAccess no longer re-exported; import from @librechat/api)
[UPDATE] api/server/routes/config.js — fileAccessGroups in startup config payload
[UPDATE] api/server/routes/files/files.js — scope-based visibility on GET /files; admin delete exemption
[UPDATE] api/server/services/AuthService.js — default file_access_groups on registration
[UPDATE] api/server/controllers/agents/request.js — business actions attached to the response message (SSE + persisted)
[UPDATE] api/server/services/{BusinessActionsService,initBusinessActions,Files/VectorDB/preload}.js + controllers/UsersController.js — logger from @librechat/data-schemas
[UPDATE] api/server/routes/__tests__/roles.spec.js — custom-role fixture renamed (MANAGER is reserved)
[REMOVED] api/models/{File,Message}.js — deleted upstream (moved to @librechat/data-schemas); preload.js rewired to ~/models
[REMOVED] api/app/clients/tools/structured/Notion.js (+manifest.json entry, omniventus copies) — replaced by the official `@notionhq/notion-mcp-server` registered as `notion` in librechat.yaml (env: NOTION_TOKEN ← NOTION_API_KEY); Makefile notion-* targets kept (direct REST tests)
[REMOVED] client/src/components/Prompts/AdminSettings.tsx — deleted upstream (AdminSettingsDialog replaces it)
[UPDATE] client/src/routes/Dashboard.tsx — /d/users route kept alongside upstream PromptsRedirect
[UPDATE] client/src/routes/Layouts/DashBreadcrumb.tsx — simplified to users-only (upstream deleted the prompts dashboard)
[UPDATE] client/src/hooks/Nav/useSideNavLinks.ts — USER_ADMIN-gated Users panel link
[UPDATE] client/src/hooks/SSE/useSSE.ts — business_actions listener
[UPDATE] client/src/hooks/index.ts — useSharedPrompts export
[UPDATE] client/src/components/Chat/Messages/ui/MessageRender.tsx + Messages/ContentRender.tsx — BusinessActionsCard above AI responses
[UPDATE] client/src/components/Chat/Input/SharedPromptList.tsx — VariableDialog import moved to ~/components/Prompts
[UPDATE] client/src/components/Chat/Input/Files/Table/Columns.tsx — preload/shared context map entries
[UPDATE] client/src/components/SidePanel/Files/PanelFileCell.tsx — shared/public badge
[UPDATE] client/src/locales/en/translation.json — 108 fork keys merged onto upstream
[RESOLVED] client/src/components/ui/index.ts restored to pristine upstream content (zero merge surface):
  fork importers migrated to @librechat/client (Button/Input/Dialog*/Table*/SelectDropDown in
  UserPanel, Users/components/{Columns,DataTable}, SidePanel/Users/{PanelColumns,PanelTable});
  fork-local components imported directly (Chip in SharedPromptList, MultiSelectDropDown in UserPanel).
  Chip.tsx and MultiSelectDropDown.tsx remain as fork-only files in client/src/components/ui/.

### 2026-06-11 — Phase 1 recovery: fork checkpointed on upstream v0.8.1-rc2 (tag `fork-v0.8.1-rc2`)

The v0.8.1-rc2 merge was committed, fixed forward, and verified green (builds, tests, boot).
Customizations are now **in-place** in upstream files, fenced with `// [OMNIVENTUS]` comments.
The `@omniventus/*` alias wiring was reverted (broken; reproducible from this folder) — see
`DIAGNOSIS-2026-06-10.md` §4 and `recovery/STATE.md`. Current divergence ledger:

[UPDATE] api/models/Message.js — contextualActions kept alongside upstream feedback
[UPDATE] api/server/routes/config.js — fileAccessGroups in startup config payload
[UPDATE] api/server/routes/files/files.js — admin exemption on delete (upstream flow kept)
[UPDATE] api/server/index.js — initBusinessActions() + preloadFiles() at startup; /api/users mount
[UPDATE] api/server/middleware/roles/index.js — checkStrictAdmin; checkAccess/generateCheckAccess re-exported from @librechat/api
[UPDATE] api/server/controllers/UsersController.js — User model now from ~/db/models
[UPDATE] api/server/services/Files/VectorDB/preload.js — imports fixed for v0.8.1 layout
[UPDATE] packages/data-provider/src/permissions.ts — USER_ADMIN type, DELETE permission, userAdminPermissionsSchema (in-place, no longer an override)
[UPDATE] packages/data-provider/src/roles.ts — MANAGER role re-expressed on upstream nested permissions structure (in-place, no longer an override)
[UPDATE] packages/data-provider/src/api-endpoints.ts — users/updateUser/deleteUserById endpoints
[UPDATE] packages/data-provider/src/actions.ts — defaultHeaders kept alongside upstream parameterLocations
[UPDATE] packages/data-schemas/src/schema/file.ts — scope + access_control fields
[UPDATE] packages/data-schemas/src/schema/user.ts — file_access_groups field
[UPDATE] packages/data-schemas/src/schema/role.ts — USER_ADMIN permission sub-schema
[UPDATE] packages/data-schemas/src/types/file.ts, types/user.ts — matching type fields
[UPDATE] client/src/components/Chat/Input/ChatForm.tsx — SharedPromptList grafted into upstream v0.8.1 layout
[UPDATE] client/src/components/Chat/Input/Files/Table/Columns.tsx — access_control column
[OVERRIDE] client/src/components/ui/index.ts — compatibility barrel re-exporting @librechat/client + fork components (upstream deleted this folder)
[UPDATE] client/src/components/ui/MultiSelectDropDown.tsx — restored from v0.7.7 (deleted upstream), deps from @librechat/client
[UPDATE] client/src/{components/SidePanel/Users/Panel.tsx, components/Users/UserPanel.tsx, hooks/Files/useDeleteFilesFromTable.tsx} — useToastContext from @librechat/client
[TO_REMOVE] omniventus/packages/* alias wiring docs below (kept as reference for Phase 2+; do not re-wire as-is)

### feat: Integrate Notion API Tools and Enhance Makefile (RETIRED in Phase 2 — Notion is now an MCP server in librechat.yaml)

[UPDATE] api/app/clients/tools/index.js
[TO_REMOVE] api/app/clients/tools/structured/Notion.js
[UPDATE] api/app/clients/tools/util/handleTools.js
[UPDATE] api/models/File.js

[UPDATE] packages/data-provider/package.json
[UPDATE] package.json
[OVERRIDE] packages/data-provider/src/permissions.ts
[OVERRIDE] packages/data-provider/src/roles.ts
[UPDATE] packages/data-provider/src/index.ts

[UPDATE] api/app/clients/tools/manifest.js
[UPDATE] api/app/clients/prompts/createContextHandlers.js

[UPDATE] api/models/schema/fileSchema.js
[UPDATE] api/models/schema/userSchema.js
[UPDATE] packages/data-schemas/src/schema/file.ts

[TODO] monkey patch and merge in the manifest.json

### new changes from 9 months ago

new memoryPermissionsSchema, temporaryChatPermissionsSchema, webSearchPermissionsSchema, peoplePickerPermissionsSchema, marketplacePermissionsSchema, fileSearchPermissionsSchema, fileCitationsPermissionsSchema added to permissions

## features added

- Add role Manager
- Add PermissionType USER_ADMIN the User admin is a feature and the USER_ADMIN permissionType allow access to it
- Add DELETE Permission to allow or not user to delete

- 💼 **Business Actions**:

  - Contextual action buttons displayed above AI responses
  - Integration with external services based on conversation context
  - Built-in support for movie recommendations via TMDB
  - Extensible provider system for custom actions

- 🤖 **AI Model Selection**:
- 🔧 **[Code Interpreter API](https://www.librechat.ai/docs/features/code_interpreter)**:
- 🔦 **Agents & Tools Integration**:
- No-Code Custom Assistants: Build specialized, AI-driven helpers without coding
- 🪄 **Generative UI with Code Artifacts**:
- 💾 **Presets & Context Management**:

  - Create, Save, & Share Custom Presets

<h2>
  OMNIVENTUS CHANGES
</h2>
# Business Actions Setup

Business Actions enable LibreChat to display contextual action buttons above AI responses. These actions provide users with quick ways to interact with external systems based on the context of their conversation.

## Configuring Business Actions

Business Actions are powered by specialized providers that can be configured in LibreChat. Currently, the following providers are available:

1. **Search Actions Provider** - General search-related actions
2. **Movie Actions Provider** - Movie-related actions using The Movie Database API

### Movie Actions Provider Setup

The Movie Actions Provider requires an API key from The Movie Database (TMDB). Follow these steps to set up:

1. Create a TMDB account at [https://www.themoviedb.org/signup](https://www.themoviedb.org/signup)
2. Go to your account settings and navigate to the API section
3. Create a new API key by following their process (typically requires providing basic application information)
4. Once you have the API key, add it to your `.env` file:

```
# TMDB API key for movie-related business actions
TMDB_API_KEY=your_api_key_here
```

5. Restart your LibreChat instance for the changes to take effect

## Testing Business Actions

### Movie Actions

To test the Movie Actions provider, try asking the AI questions that contain movie-related terms, such as:

- "Recommend a movie about space"
- "What are some good action movies?"
- "Find films with Tom Hanks"
- "Suggest a movie to watch tonight"

You should see contextual actions appear above the AI's response with links to relevant movies on TMDB.

## Creating Custom Providers

You can create your own business actions providers by:

1. Creating a new file in `api/server/services/actions/` following the pattern of existing providers
2. Implementing the required `getActions` method
3. Registering your provider in `api/server/services/initBusinessActions.js`

See the `MovieActionsProvider.js` file for a comprehensive example of implementing a provider.

## Troubleshooting

If business actions are not appearing:

1. Check your server logs for any errors related to business actions providers
2. Verify that your API keys are correctly set in the `.env` file
3. Make sure your query contains terms that would trigger the relevant provider
4. Confirm that the provider is properly registered in `initBusinessActions.js`

to see live changes on the front go to http://localhost:3090/

<p>
  - you can go on [RAG_API_HOST]:8000/docs to see the docs of the RAG API
  - add posibility to see file scope in the my files page of librechat
  - remove possibility to remove files that are not created by the user
  - change color of shared files
  - add simple user administration interface for users of type admin
  - add for admin, an interface to add shared files to the file library

todo:

display file scope in the file manager

improvements:

- put users in recoil state (not priority)
- supprimer l'option pour ajouter des utilisateurs
- add a button to force the update of the preloaded files
- show token usage for each user in the admin interface but also in the main view (user/:id page)
- bien gerer la suppression d'un utilisateur par rapport à ses fichiers

there is an error when i submit request: failed to fetch models from Mistral API , the server responded with status 401 but i am using ollama.

add new en var FILE_ACCESS_GROUPS

- limit prompt creation to admin only
- display prompt in chip format above the chat
- visualy increase user balance limit
- add granularity to some interfaces features (prompt, preset, bookmark, agent)
  be able to deactive some features only for some roles (admin, manager, user)
  endpointsMenu: true
  modelSelect: true
  parameters: true
  sidePanel: true
  presets: true
  prompts: true
  bookmarks: true
  multiConvo: true
  agents: true

  - revalidate the prompts to get shared promps above the chat when a new prompt is created.

  - use authentication from another source (sql external database)
  - add ability to have files in the prompt

generate a diagram of the project structure
mmdc -i archi.md -o output.pdf

read the MessageRender.tsx file and it's related component to understand the behavior and flow of the message rendering in the librechat project.
the goal is to find a way to display in the returned message section of a conversation a list of clickable elements (action button, links ) all displayed in a consistant simple card maner.

we want to be able for some queries of the user, to display above the streamed response of the AI, some links, buttons that can redirect the user to business related location. the data in that section will come from another call to the backend that will be directly handled by non AI processes. let's call that additionnal data "contextual business actions data"

think , review analyse the project structure and suggest the best way to save the contextual business actions data , and the best way to display it .
break it down step by step (think about how to orchestrate the simulatneous fetch, how to save the data , both front end and backend , and how to do the display

hubspot , sap , brevo or external api integration for business actions data.

create a template email for a campaign to send to a list of contacts.
create a gif demo of the usage of a key recurent feature

## understand the streaming flow.

The Complete Streaming Flow
AskController calls client.sendMessage() with an onProgress callback
The client connects to the AI API with streaming enabled
As each token arrives from the AI:
The client calls the onProgress callback with the token
onProgress (created by createOnProgress) calls the utility sendMessage function
The utility sendMessage formats and writes an SSE event to the response
The frontend receives these events in real-time and updates the UI
When the AI finishes generating:
The client's sendMessage returns the complete response
AskController sends a final SSE event with sendMessage(res, {..., final: true})
AskController calls res.end() to close the connection
This architecture allows LibreChat to stream tokens as they're generated, providing a real-time experience to users.

## Agent Ideas and Use Cases

### Sales Inquiry Agent

Use Case: This agent can handle sales inquiries by providing information on products, checking stock availability, and engaging potential customers. It can also collect customer information for follow-up.

### Marketing Content Generator

Use Case: This agent can generate marketing copies, social media posts, and email newsletters based on user inputs, saving time for marketers.

### Code Review Agent

Use Case: It can help developers automatically review code snippets for best practices and common issues, provide explanations, and suggest improvements.

### Document Assistant Agent

Use Case: This agent can search for documents based on user queries and summarize or extract key points, aiding in project management or research.

### Tech Support Agent

Use Case: This agent can respond to tech support requests, troubleshoot common issues, and guide users through setup processes.

### Data Dashboard Agent

Use Case: This agent can generate visual reports and dashboards based on ongoing project data and KPIs, assisting in decision-making processes.

### Social Media Monitoring Agent

Monitors social media platforms for mentions
Helps draft responses to comments/mentions

### Customer Support Agent

Handles customer inquiries and complaints
Provides solutions to common issues

when creating actions, make sure to add the domain to the allowed domains in the librechat.yaml file.

notion json api:

## improvements

- sort prompt by category so that user can find them easily
- create more categories for prompts
