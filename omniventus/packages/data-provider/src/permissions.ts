// omniventus/packages/data-provider/src/extend-permissions-schema.ts

import { z } from 'zod';
// 1. Import all exports from the original file using a namespace import
// Note: You might need to adjust the path depending on your workspace setup.
// Assuming the original is at packages/data-provider/src/permissions.ts in the LibreChat root.
// For a sibling override, use a relative path if needed, or rely on your build system's module resolution.
// For this example, we'll assume the original package is accessible by name, 
// or by adjusting the path to the original file:
// import * as Original from '../permissions'; // If the original were in the same folder as a backup file

// *** Since we are overriding the file in the build path, the cleanest way is a complete replacement. ***

// We will redefine the original constants and schemas here, adding our new value.
// This is necessary because we need to update not just the enum, but also the final 'permissionsSchema'
// which depends on the extended enum.

// =========================================================================================
// 1. EXTENDED ENUM
// =========================================================================================

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
     * Type for Memory Permissions
     */
    MEMORIES = 'MEMORIES',
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
     * Type for using the "Web Search" feature
     */
    WEB_SEARCH = 'WEB_SEARCH',
    /**
     * Type for People Picker Permissions
     */
    PEOPLE_PICKER = 'PEOPLE_PICKER',
    /**
     * Type for Marketplace Permissions
     */
    MARKETPLACE = 'MARKETPLACE',
    /**
     * Type for using the "File Search" feature
     */
    FILE_SEARCH = 'FILE_SEARCH',
    /**
     * Type for using the "File Citations" feature in agents
     */
    FILE_CITATIONS = 'FILE_CITATIONS',
    // *** OMNIVENTUS ADDITION ***
    /**
     * Type for User Admin Permissions
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
    /** Can disable if desired */
    OPT_OUT = 'OPT_OUT',
    VIEW_USERS = 'VIEW_USERS',
    VIEW_GROUPS = 'VIEW_GROUPS',
    VIEW_ROLES = 'VIEW_ROLES',
    // *** OMNIVENTUS Permission ADDITION ***
    DELETE = 'DELETE',
  }
  
// =========================================================================================
// 3. RE-EXPORT/REDEFINE ORIGINAL SCHEMAS AND TYPES
// =========================================================================================

  export const promptPermissionsSchema = z.object({
    [Permissions.SHARED_GLOBAL]: z.boolean().default(false),
    [Permissions.USE]: z.boolean().default(true),
    [Permissions.CREATE]: z.boolean().default(true),
    // [Permissions.SHARE]: z.boolean().default(false),
  });
  export type TPromptPermissions = z.infer<typeof promptPermissionsSchema>;
  
  export const bookmarkPermissionsSchema = z.object({
    [Permissions.USE]: z.boolean().default(true),
  });
  export type TBookmarkPermissions = z.infer<typeof bookmarkPermissionsSchema>;
  
  export const memoryPermissionsSchema = z.object({
    [Permissions.USE]: z.boolean().default(true),
    [Permissions.CREATE]: z.boolean().default(true),
    [Permissions.UPDATE]: z.boolean().default(true),
    [Permissions.READ]: z.boolean().default(true),
    [Permissions.OPT_OUT]: z.boolean().default(true),
  });
  export type TMemoryPermissions = z.infer<typeof memoryPermissionsSchema>;
  
  export const agentPermissionsSchema = z.object({
    [Permissions.SHARED_GLOBAL]: z.boolean().default(false),
    [Permissions.USE]: z.boolean().default(true),
    [Permissions.CREATE]: z.boolean().default(true),
    // [Permissions.SHARE]: z.boolean().default(false),
  });
  export type TAgentPermissions = z.infer<typeof agentPermissionsSchema>;
  
  export const multiConvoPermissionsSchema = z.object({
    [Permissions.USE]: z.boolean().default(true),
  });
  export type TMultiConvoPermissions = z.infer<typeof multiConvoPermissionsSchema>;
  
  export const temporaryChatPermissionsSchema = z.object({
    [Permissions.USE]: z.boolean().default(true),
  });
  export type TTemporaryChatPermissions = z.infer<typeof temporaryChatPermissionsSchema>;
  
  export const runCodePermissionsSchema = z.object({
    [Permissions.USE]: z.boolean().default(true),
  });
  export type TRunCodePermissions = z.infer<typeof runCodePermissionsSchema>;
  
  export const webSearchPermissionsSchema = z.object({
    [Permissions.USE]: z.boolean().default(true),
  });
  export type TWebSearchPermissions = z.infer<typeof webSearchPermissionsSchema>;
  
  export const peoplePickerPermissionsSchema = z.object({
    [Permissions.VIEW_USERS]: z.boolean().default(true),
    [Permissions.VIEW_GROUPS]: z.boolean().default(true),
    [Permissions.VIEW_ROLES]: z.boolean().default(true),
  });
  export type TPeoplePickerPermissions = z.infer<typeof peoplePickerPermissionsSchema>;
  
  export const marketplacePermissionsSchema = z.object({
    [Permissions.USE]: z.boolean().default(false),
  });
  export type TMarketplacePermissions = z.infer<typeof marketplacePermissionsSchema>;
  
  export const fileSearchPermissionsSchema = z.object({
    [Permissions.USE]: z.boolean().default(true),
  });
  export type TFileSearchPermissions = z.infer<typeof fileSearchPermissionsSchema>;
  
  export const fileCitationsPermissionsSchema = z.object({
    [Permissions.USE]: z.boolean().default(true),
  });
export type TFileCitationsPermissions = z.infer<typeof fileCitationsPermissionsSchema>;
  

// =========================================================================================
// 4. OMNIVENTUS SCHEMA ADDITION
// =========================================================================================
// Define the schema for the new USER_ADMIN permission type
export const userAdminPermissionsSchema = z.object({
    // Assuming a simple 'USE' permission is sufficient for an admin permission type
    [Permissions.USE]: z.boolean().default(false), 
    [Permissions.DELETE]: z.boolean().default(false),
});
export type TUserAdminPermissions = z.infer<typeof userAdminPermissionsSchema>;
  
  // Define a single permissions schema that holds all permission types.
  export const permissionsSchema = z.object({
    [PermissionTypes.PROMPTS]: promptPermissionsSchema,
    [PermissionTypes.BOOKMARKS]: bookmarkPermissionsSchema,
    [PermissionTypes.MEMORIES]: memoryPermissionsSchema,
    [PermissionTypes.AGENTS]: agentPermissionsSchema,
    [PermissionTypes.MULTI_CONVO]: multiConvoPermissionsSchema,
    [PermissionTypes.TEMPORARY_CHAT]: temporaryChatPermissionsSchema,
    [PermissionTypes.RUN_CODE]: runCodePermissionsSchema,
    [PermissionTypes.WEB_SEARCH]: webSearchPermissionsSchema,
    [PermissionTypes.PEOPLE_PICKER]: peoplePickerPermissionsSchema,
    [PermissionTypes.MARKETPLACE]: marketplacePermissionsSchema,
    [PermissionTypes.FILE_SEARCH]: fileSearchPermissionsSchema,
    [PermissionTypes.FILE_CITATIONS]: fileCitationsPermissionsSchema,
    // *** OMNIVENTUS ADDITION ***
    [PermissionTypes.USER_ADMIN]: userAdminPermissionsSchema,
  });
  