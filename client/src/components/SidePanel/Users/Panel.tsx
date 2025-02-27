import { useGetUsers } from '~/data-provider/Users/queries';
import { useDeleteUserMutation } from '~/data-provider/Users/mutations';
import { useToastContext } from '~/Providers';
import { useLocalize } from '~/hooks';

import { columns } from './PanelColumns';
import DataTable from './PanelTable';
import { NotificationSeverity } from '~/common';

export default function UsersPanel() {
  const localize = useLocalize();
  const { data: users = [] } = useGetUsers();
  const deleteUser = useDeleteUserMutation();
  const { showToast } = useToastContext();

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

  return (
    <div className="h-auto max-w-full overflow-x-hidden">
      <DataTable columns={columns} data={users} />
    </div>
  );
}