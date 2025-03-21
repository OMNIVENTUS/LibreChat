import { useMemo, useEffect } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { PermissionTypes, Permissions } from 'librechat-data-provider';
import DashBreadcrumb from '~/routes/Layouts/DashBreadcrumb';
import { usePromptGroupsNav, useHasAccess } from '~/hooks';
import { cn } from '~/utils';

export default function PromptsView() {
  const params = useParams();
  const navigate = useNavigate();
  //const groupsNav = usePromptGroupsNav();
  const isDetailView = useMemo(() => !!(params.userId || params['*'] === 'new'), [params]);

  const hasAccess = useHasAccess({
    permissionType: PermissionTypes.USER_ADMIN,
    permission: Permissions.USE,
  });

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (!hasAccess) {
      timeoutId = setTimeout(() => {
        navigate('/c/new');
      }, 1000);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [hasAccess, navigate]);

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="flex h-screen w-full flex-col bg-surface-primary p-0 lg:p-2">
      <DashBreadcrumb />
      <div className="flex w-full flex-grow flex-row divide-x overflow-hidden dark:text-gray-200 dark:divide-gray-600">

        <div
          className={cn(
            'scrollbar-gutter-stable w-full overflow-y-auto',
            // isDetailView ? 'block' : 'hidden md:block',
          )}
        >
          <Outlet/>
        </div>
      </div>
    </div>
  );
}
