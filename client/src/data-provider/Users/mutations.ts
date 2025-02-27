import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryKeys, dataService, MutationKeys } from 'librechat-data-provider';
import type { TUser } from 'librechat-data-provider';

export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.deleteUserById],
    async (userId: string) => {
      return await dataService.deleteUserById(userId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.users]);
      },
    },
  );
};

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.userUpdate],
    async ({ userId, data }: { userId: string; data: Partial<TUser> }) => {
      return await dataService.updateUser(userId, data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.users]);
      },
    },
  );
};