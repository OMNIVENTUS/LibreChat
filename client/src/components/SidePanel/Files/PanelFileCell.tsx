import type { Row } from '@tanstack/react-table';
import type { TFile } from 'librechat-data-provider';
import { Share2 } from 'lucide-react';
import ImagePreview from '~/components/Chat/Input/Files/ImagePreview';
import FilePreview from '~/components/Chat/Input/Files/FilePreview';
import { getFileType } from '~/utils';

export default function PanelFileCell({ row }: { row: Row<TFile | undefined> }) {
  const file = row.original;

  return (
    <div className="flex w-full items-center gap-2 relative">
      {(file?.scope === 'shared' || file?.scope === 'public') && (
        <Share2 fill="blue" className="absolute -right-1 -top-1 h-4 w-4 text-blue-500" />
      )}
      <div className="relative">
        {file?.type.startsWith('image') === true ? (
          <ImagePreview
            url={file.filepath}
            className="h-10 w-10 flex-shrink-0"
            source={file.source}
            alt={file.filename}
          />
        ) : (
          <FilePreview fileType={getFileType(file?.type)} file={file} />
        )}
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <span className="block w-full overflow-hidden truncate text-ellipsis whitespace-nowrap text-xs">
          {file?.filename}
        </span>
      </div>
    </div>
  );
}
