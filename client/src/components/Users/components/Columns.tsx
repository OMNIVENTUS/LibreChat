import { ArrowUpDown, Trash2, UserCog } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { TUser } from 'librechat-data-provider';
import { Button } from '~/components/ui';
import { formatDate } from '~/utils';
import { useLocalize } from '~/hooks';

interface ColumnOptions {
  onDelete: (userId: string) => void;
  onUpdateAccessGroups: (user: TUser) => void;
}

export const columns = ({ onDelete, onUpdateAccessGroups }: ColumnOptions): ColumnDef<TUser>[] => {
  const localize = useLocalize();

  return [
    {
      accessorKey: 'avatar',
      header: () => localize('com_ui_avatar'),
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="hover:bg-surface-hover"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {localize('com_users_username')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="hover:bg-surface-hover"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {localize('com_users_email')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'role',
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="hover:bg-surface-hover"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {localize('com_users_role')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'file_access_groups',
      header: () => localize('com_users_access_groups'),
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="hover:bg-surface-hover"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {localize('com_users_created_at')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-xs">
          {formatDate(row.original.createdAt?.toString() ?? '')}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onUpdateAccessGroups(row.original)}
              className="h-8 w-8 p-0"
              aria-label={localize('com_users_edit_access')}
            >
              <UserCog className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (confirm(localize('com_users_confirm_delete'))) {
                  onDelete(row.original.id);
                }
              }}
              className="h-8 w-8 p-0"
              aria-label={localize('com_users_delete')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];
};