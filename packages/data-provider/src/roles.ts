import { z } from 'zod';

/**
 * Enum for System Defined Roles
 */
export enum SystemRoles {
  /**
   * The Admin role
   */
  ADMIN = 'ADMIN',
  /**
   * The Manager role - between Admin and User
   */
  MANAGER = 'MANAGER',
  /**
   * The default user role
   */
  USER = 'USER',
}

/**
 * Enum for Permission Types
 */
export enum PermissionTypes {
  /**
   * Type for Prompt Permissions
   */
  PROMPTS = 'PROMPTS',
  /**
   * Type for Bookmark Permissions
   */
  BOOKMARKS = 'BOOKMARKS',
  /**
   * Type for Agent Permissions
   */
  AGENTS = 'AGENTS',
  /**
   * Type for Multi-Conversation Permissions
   */
  MULTI_CONVO = 'MULTI_CONVO',
  /**
   * Type for Temporary Chat
   */
  TEMPORARY_CHAT = 'TEMPORARY_CHAT',
  /**
   * Type for using the "Run Code" LC Code Interpreter API feature
   */
  RUN_CODE = 'RUN_CODE',

  /**
   * Type for User Administration
   */
  USER_ADMIN = 'USER_ADMIN',
}

/**
 * Enum for Role-Based Access Control Constants
 */
export enum Permissions {
  SHARED_GLOBAL = 'SHARED_GLOBAL',
  USE = 'USE',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  READ = 'READ',
  READ_AUTHOR = 'READ_AUTHOR',
  SHARE = 'SHARE',
  DELETE = 'DELETE',
}

export const promptPermissionsSchema = z.object({
  [Permissions.SHARED_GLOBAL]: z.boolean().default(false),
  [Permissions.USE]: z.boolean().default(true),
  [Permissions.CREATE]: z.boolean().default(true),
  // [Permissions.SHARE]: z.boolean().default(false),
});

export const bookmarkPermissionsSchema = z.object({
  [Permissions.USE]: z.boolean().default(true),
});

export const agentPermissionsSchema = z.object({
  [Permissions.SHARED_GLOBAL]: z.boolean().default(false),
  [Permissions.USE]: z.boolean().default(true),
  [Permissions.CREATE]: z.boolean().default(true),
  // [Permissions.SHARE]: z.boolean().default(false),
});

export const multiConvoPermissionsSchema = z.object({
  [Permissions.USE]: z.boolean().default(true),
});

export const temporaryChatPermissionsSchema = z.object({
  [Permissions.USE]: z.boolean().default(true),
});

export const runCodePermissionsSchema = z.object({
  [Permissions.USE]: z.boolean().default(true),
});

export const userAdminPermissionsSchema = z.object({
  [Permissions.USE]: z.boolean().default(false),
  [Permissions.DELETE]: z.boolean().default(false),
});

export const roleSchema = z.object({
  name: z.string(),
  [PermissionTypes.PROMPTS]: promptPermissionsSchema,
  [PermissionTypes.BOOKMARKS]: bookmarkPermissionsSchema,
  [PermissionTypes.AGENTS]: agentPermissionsSchema,
  [PermissionTypes.MULTI_CONVO]: multiConvoPermissionsSchema,
  [PermissionTypes.TEMPORARY_CHAT]: temporaryChatPermissionsSchema,
  [PermissionTypes.RUN_CODE]: runCodePermissionsSchema,
  [PermissionTypes.USER_ADMIN]: userAdminPermissionsSchema,
});

export type TRole = z.infer<typeof roleSchema>;
export type TAgentPermissions = z.infer<typeof agentPermissionsSchema>;
export type TPromptPermissions = z.infer<typeof promptPermissionsSchema>;
export type TBookmarkPermissions = z.infer<typeof bookmarkPermissionsSchema>;
export type TMultiConvoPermissions = z.infer<typeof multiConvoPermissionsSchema>;
export type TTemporaryChatPermissions = z.infer<typeof temporaryChatPermissionsSchema>;
export type TRunCodePermissions = z.infer<typeof runCodePermissionsSchema>;
export type TUserAdminPermissions = z.infer<typeof userAdminPermissionsSchema>;

const defaultRolesSchema = z.object({
  [SystemRoles.ADMIN]: roleSchema.extend({
    name: z.literal(SystemRoles.ADMIN),
    [PermissionTypes.PROMPTS]: promptPermissionsSchema.extend({
      [Permissions.SHARED_GLOBAL]: z.boolean().default(true),
      [Permissions.USE]: z.boolean().default(true),
      [Permissions.CREATE]: z.boolean().default(true),
      // [Permissions.SHARE]: z.boolean().default(true),
    }),
    [PermissionTypes.BOOKMARKS]: bookmarkPermissionsSchema.extend({
      [Permissions.USE]: z.boolean().default(true),
    }),
    [PermissionTypes.AGENTS]: agentPermissionsSchema.extend({
      [Permissions.SHARED_GLOBAL]: z.boolean().default(true),
      [Permissions.USE]: z.boolean().default(true),
      [Permissions.CREATE]: z.boolean().default(true),
      // [Permissions.SHARE]: z.boolean().default(true),
    }),
    [PermissionTypes.MULTI_CONVO]: multiConvoPermissionsSchema.extend({
      [Permissions.USE]: z.boolean().default(true),
    }),
    [PermissionTypes.TEMPORARY_CHAT]: temporaryChatPermissionsSchema.extend({
      [Permissions.USE]: z.boolean().default(true),
    }),
    [PermissionTypes.RUN_CODE]: runCodePermissionsSchema.extend({
      [Permissions.USE]: z.boolean().default(true),
    }),
    [PermissionTypes.USER_ADMIN]: userAdminPermissionsSchema.extend({
      [Permissions.USE]: z.boolean().default(true),
      [Permissions.DELETE]: z.boolean().default(true),
    }),
  }),
  [SystemRoles.MANAGER]: roleSchema.extend({
    name: z.literal(SystemRoles.MANAGER),
    [PermissionTypes.PROMPTS]: promptPermissionsSchema.extend({
      [Permissions.SHARED_GLOBAL]: z.boolean().default(true),
      [Permissions.USE]: z.boolean().default(true),
      [Permissions.CREATE]: z.boolean().default(true),
      // [Permissions.SHARE]: z.boolean().default(true),
    }),
    [PermissionTypes.BOOKMARKS]: bookmarkPermissionsSchema.extend({
      [Permissions.USE]: z.boolean().default(true),
    }),
    [PermissionTypes.AGENTS]: agentPermissionsSchema.extend({
      [Permissions.SHARED_GLOBAL]: z.boolean().default(true),
      [Permissions.USE]: z.boolean().default(true),
      [Permissions.CREATE]: z.boolean().default(true),
      // [Permissions.SHARE]: z.boolean().default(true),
    }),
    [PermissionTypes.MULTI_CONVO]: multiConvoPermissionsSchema.extend({
      [Permissions.USE]: z.boolean().default(true),
    }),
    [PermissionTypes.TEMPORARY_CHAT]: temporaryChatPermissionsSchema.extend({
      [Permissions.USE]: z.boolean().default(true),
    }),
    [PermissionTypes.RUN_CODE]: runCodePermissionsSchema.extend({
      [Permissions.USE]: z.boolean().default(true),
    }),
    [PermissionTypes.USER_ADMIN]: userAdminPermissionsSchema.extend({
      [Permissions.USE]: z.boolean().default(true),
      [Permissions.DELETE]: z.boolean().default(true),
    }),
  }),
  [SystemRoles.USER]: roleSchema.extend({
    name: z.literal(SystemRoles.USER),
    [PermissionTypes.PROMPTS]: promptPermissionsSchema,
    [PermissionTypes.BOOKMARKS]: bookmarkPermissionsSchema,
    [PermissionTypes.AGENTS]: agentPermissionsSchema,
    [PermissionTypes.MULTI_CONVO]: multiConvoPermissionsSchema,
    [PermissionTypes.TEMPORARY_CHAT]: temporaryChatPermissionsSchema,
    [PermissionTypes.RUN_CODE]: runCodePermissionsSchema,
    [PermissionTypes.USER_ADMIN]: userAdminPermissionsSchema,
  }),
});

export const roleDefaults = defaultRolesSchema.parse({
  [SystemRoles.ADMIN]: {
    name: SystemRoles.ADMIN,
    [PermissionTypes.PROMPTS]: {},
    [PermissionTypes.BOOKMARKS]: {},
    [PermissionTypes.AGENTS]: {},
    [PermissionTypes.MULTI_CONVO]: {},
    [PermissionTypes.TEMPORARY_CHAT]: {},
    [PermissionTypes.RUN_CODE]: {},
    [PermissionTypes.USER_ADMIN]: {},
  },
  [SystemRoles.MANAGER]: {
    name: SystemRoles.MANAGER,
    [PermissionTypes.PROMPTS]: {},
    [PermissionTypes.BOOKMARKS]: {},
    [PermissionTypes.AGENTS]: {},
    [PermissionTypes.MULTI_CONVO]: {},
    [PermissionTypes.TEMPORARY_CHAT]: {},
    [PermissionTypes.RUN_CODE]: {},
    [PermissionTypes.USER_ADMIN]: {},
  },
  [SystemRoles.USER]: {
    name: SystemRoles.USER,
    [PermissionTypes.PROMPTS]: {},
    [PermissionTypes.BOOKMARKS]: {},
    [PermissionTypes.AGENTS]: {},
    [PermissionTypes.MULTI_CONVO]: {},
    [PermissionTypes.TEMPORARY_CHAT]: {},
    [PermissionTypes.RUN_CODE]: {},
    [PermissionTypes.USER_ADMIN]: {},
  },
});
