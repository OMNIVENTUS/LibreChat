import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from 'librechat-data-provider';
import type { BatchFile, TFile } from 'librechat-data-provider';
import { useDeleteFilesMutation } from '~/data-provider';
import useFileDeletion from './useFileDeletion';
import { useToastContext } from '~/Providers';
import { useLocalize } from '~/hooks';

export default function useDeleteFilesFromTable(callback?: () => void) {
  const queryClient = useQueryClient();
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const deletionMutation = useDeleteFilesMutation({
    onMutate: async (variables) => {
      const { files } = variables;
      if (!files.length) {
        return new Map<string, BatchFile>();
      }

      const filesToDeleteMap = files.reduce((map, file) => {
        map.set(file.file_id, file);
        return map;
      }, new Map<string, BatchFile>());

      return { filesToDeleteMap };
    },
    onSuccess: (data, variables, context) => {

      const { filesToDeleteMap } = context as { filesToDeleteMap: Map<string, BatchFile> };
      showToast({
        message: localize('com_files_delete_success'),
        status: 'success',
      });
      queryClient.setQueryData([QueryKeys.files], (oldFiles: TFile[] | undefined) => {
        const { files } = variables;
        return files.length
          ? oldFiles?.filter((file) => !filesToDeleteMap.has(file.file_id))
          : oldFiles;
      });
      callback?.();
    },
    onError: (error) => {
      //improve error message based on error status code
      if(error?.status === 403) {
        showToast({
          //message: 'Error deleting files',
          message: localize('com_files_unauthorized_delete_error'),
          status: 'error',
        });
      } else {
        showToast({
          message: localize('com_files_delete_error'),
          //description: error.message,
          status: 'error',
        });
      }
      callback?.();
    },
  });

  return useFileDeletion({ mutateAsync: deletionMutation.mutateAsync });
}
