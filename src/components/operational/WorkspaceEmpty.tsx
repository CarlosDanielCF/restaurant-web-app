import InboxOutlined from '@mui/icons-material/InboxOutlined';
export function WorkspaceEmpty({
  title,
  description
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className='workspace-empty' role='status'>
      <InboxOutlined aria-hidden='true' />
      <div>
        <strong>{title}</strong>
        {description && <p>{description}</p>}
      </div>
    </div>
  );
}
