import { ArrowUpDown, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { TUser } from 'librechat-data-provider';
import { Button } from '~/components/ui';
import { formatDate } from '~/utils';
import { useLocalize } from '~/hooks';

export const columns: ColumnDef<TUser>[] = [
  {
    accessorKey: 'avatar',
    header: () => {
      const localize = useLocalize();
      return localize('com_ui_avatar');
    },
    cell: ({ row }) => (
      <div className="flex items-center">
        {row.original.avatar ? (
          <img
            src={row.original.avatar}
            alt={row.original.username}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-medium">
            {row.original.username?.[0]?.toUpperCase() || row.original.email[0].toUpperCase()}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'username',
    header: ({ column }) => {
      const localize = useLocalize();
      return (
        <Button
          variant="ghost"
          className="hover:bg-surface-hover"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {localize('com_users_username')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => {
      const localize = useLocalize();
      return (
        <Button
          variant="ghost"
          className="hover:bg-surface-hover"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {localize('com_users_email')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: 'role',
    header: ({ column }) => {
      const localize = useLocalize();
      return (
        <Button
          variant="ghost"
          className="hover:bg-surface-hover"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {localize('com_users_role')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: 'file_access_groups',
    header: () => {
      const localize = useLocalize();
      return localize('com_users_access_groups');
    },
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.file_access_groups?.map((group: string) => (
          <span
            key={group}
            className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium"
          >
            {group}
          </span>
        ))}
      </div>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      const localize = useLocalize();
      return (
        <Button
          variant="ghost"
          className="hover:bg-surface-hover"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {localize('com_users_created_at')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <span className="text-xs">
        {formatDate(row.original.createdAt?.toString() ?? '')}
      </span>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const localize = useLocalize();
      const user = row.original;

      return (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // Handle delete user
              if (confirm(localize('com_users_confirm_delete'))) {
                // Call delete mutation
              }
            }}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">{localize('com_users_delete')}</span>
          </Button>
        </div>
      );
    },
  },
];
