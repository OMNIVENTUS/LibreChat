// [OMNIVENTUS] breadcrumb for the user-administration dashboard (/d/users).
// Upstream v0.8.6 removed the prompts dashboard (and this file); the fork keeps
// a simplified version serving only the Users view.
import { useCallback } from 'react';
import { useSetRecoilState } from 'recoil';
import { ArrowLeft, Users } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@librechat/client';
import { useLocalize, useCustomLink } from '~/hooks';
import store from '~/store';

export default function DashBreadcrumb() {
  const localize = useLocalize();

  const setPromptsName = useSetRecoilState(store.promptsName);
  const setPromptsCategory = useSetRecoilState(store.promptsCategory);

  const clickCallback = useCallback(() => {
    setPromptsName('');
    setPromptsCategory('');
  }, [setPromptsName, setPromptsCategory]);

  const chatLinkHandler = useCustomLink('/c/new', clickCallback);
  const usersLinkHandler = useCustomLink('/d/users');

  return (
    <div className="mr-2 mt-2 flex h-10 items-center justify-between">
      <Breadcrumb className="mt-1 px-2 dark:text-gray-200">
        <BreadcrumbList>
          <BreadcrumbItem className="hover:dark:text-white">
            <BreadcrumbLink
              href="/"
              className="flex flex-row items-center gap-1"
              onClick={chatLinkHandler}
            >
              <ArrowLeft className="icon-xs" aria-hidden="true" />
              <span className="hidden md:flex">{localize('com_ui_back_to_chat')}</span>
              <span className="flex md:hidden">{localize('com_ui_chat')}</span>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="hover:dark:text-white">
            <BreadcrumbLink
              href="/d/users"
              className="flex flex-row items-center gap-1"
              onClick={usersLinkHandler}
            >
              <Users className="h-4 w-4 dark:text-gray-300" aria-hidden="true" />
              {localize('com_users_title')}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
