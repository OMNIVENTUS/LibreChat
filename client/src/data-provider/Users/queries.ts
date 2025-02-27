import { useRecoilValue } from 'recoil';
import { QueryKeys, dataService } from 'librechat-data-provider';
import { useQuery } from '@tanstack/react-query';
import type { QueryObserverResult } from '@tanstack/react-query';
import type { TUser } from 'librechat-data-provider';
//import { dataService } from './data-service';
import store from '~/store';

export const useGetUsers = (): QueryObserverResult<TUser[]> => {
  const queriesEnabled = useRecoilValue(store.queriesEnabled);
  return useQuery<TUser[]>([QueryKeys.users], () => dataService.getUsers(), {
    enabled: queriesEnabled,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};