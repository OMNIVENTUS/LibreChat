import { useState } from 'react';
import { useGetUsers } from '~/data-provider/Users/queries';
import { useDeleteUserMutation, useUpdateUserMutation } from '~/data-provider/Users/mutations';
import { useGetStartupConfig } from '~/data-provider';
import { useToastContext } from '~/Providers';
import { useLocalize } from '~/hooks';
import {
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  MultiSelectDropDown,
} from '~/components/ui';
import { NotificationSeverity } from '~/common';
import { PlusCircle, Settings2, UserCog } from 'lucide-react';
import { DataTable } from './components/DataTable';
import { columns } from './components/Columns';

export default function UserPanel() {
  const localize = useLocalize();
  const { data: users = [] } = useGetUsers();
  const { data: startupConfig } = useGetStartupConfig();
  const deleteUser = useDeleteUserMutation();
  const updateUser = useUpdateUserMutation();
  const { showToast } = useToastContext();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isAccessGroupDialogOpen, setIsAccessGroupDialogOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser.mutateAsync(userId);
      showToast({
        message: localize('com_users_delete_success'),
        severity: NotificationSeverity.SUCCESS,
      });
    } catch (error) {
      showToast({
        message: localize('com_users_delete_error'),
        severity: NotificationSeverity.ERROR,
      });
    }
  };

  const handleUpdateAccessGroups = async () => {
    try {
      await updateUser.mutateAsync({
        userId: selectedUser.id || selectedUser._id,
        data: { file_access_groups: selectedGroups },
      });
      showToast({
        message: localize('com_users_update_success'),
        severity: NotificationSeverity.SUCCESS,
      });
      setIsAccessGroupDialogOpen(false);
    } catch (error) {
      showToast({
        message: localize('com_users_update_error'),
        severity: NotificationSeverity.ERROR,
      });
    }
  };

  const openAccessGroupDialog = (user: any) => {
    setSelectedUser(user);
    setSelectedGroups(user.file_access_groups || []);
    setIsAccessGroupDialogOpen(true);
  };

  const handleGroupSelection = (value: string) => {
    setSelectedGroups(current =>
      current.includes(value)
        ? current.filter(g => g !== value)
        : [...current, value]
    );
  };

  const isGroupSelected = (value: string) => {
    return selectedGroups.includes(value);
  };

  return (
    <div className="flex h-full flex-col space-y-4 p-2 sm:p-4 md:p-8">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{localize('com_users_title')}</h2>
          <p className="text-sm text-muted-foreground sm:text-base">{localize('com_users_subtitle')}</p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
          <Button className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{localize('com_users_add_new')}</span>
            <span className="sm:hidden">{localize('com_ui_add')}</span>
          </Button>
          <Button variant="outline" className="w-full sm:w-auto">
            <Settings2 className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{localize('com_users_settings')}</span>
            <span className="sm:hidden">{localize('com_users_settings')}</span>
          </Button>
        </div>
      </div>

      <div className="rounded-lg bg-card">
        <DataTable columns={columns({
          onDelete: handleDeleteUser,
          onUpdateAccessGroups: openAccessGroupDialog,
        })} data={users} />
      </div>

      <Dialog open={isAccessGroupDialogOpen} onOpenChange={setIsAccessGroupDialogOpen}>
        <DialogContent className="sm:max-w-[425px] text-text-primary p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <UserCog className="mr-2 h-5 w-5" />
              {localize('com_users_update_access_groups')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium break-all">{selectedUser?.username || selectedUser?.email}</h4>
              <p className="text-sm text-muted-foreground break-words">
                {localize('com_users_current_groups')}:{' '}
                {selectedGroups.join(', ') || localize('com_users_no_groups')}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{localize('com_users_select_groups')}</label>
              <MultiSelectDropDown
                title={localize('com_users_select_groups')}
                value={selectedGroups.map(group => ({ name: group }))}
                availableValues={(startupConfig?.fileAccessGroups || []).map(group => ({
                  name: group,
                  description: group,
                  pluginKey: group,
                  value: group,
                }))}
                setSelected={handleGroupSelection}
                isSelected={isGroupSelected}
                showAbove={true}
                searchPlaceholder={localize('com_users_select_placeholder')}
                optionValueKey="value"
              />
            </div>
          </div>
          <DialogFooter className="flex-col space-y-2 sm:flex-row sm:justify-end sm:space-x-2 sm:space-y-0">
            <Button
              variant="outline"
              onClick={() => setIsAccessGroupDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              {localize('com_ui_cancel')}
            </Button>
            <Button
              onClick={handleUpdateAccessGroups}
              className="w-full sm:w-auto"
              disabled={updateUser.isLoading}
            >
              {localize('com_ui_save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}