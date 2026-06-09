type AnchorTagProps = Omit<React.ComponentProps<'a'>, 'href' | 'rel' | 'target'>;

type ExternalLinkWithRefProps = AnchorTagProps & {
  children: React.ReactNode;
  externalUrl: string;
};

export default function ExternalLinkWithParams({
  children,
  externalUrl,
  ...props
}: ExternalLinkWithRefProps) {
  const appName = 'myapp';

  const url = new URL(externalUrl);
  url.searchParams.append('ref', appName);

  return (
    <a href={url.toString()} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}
