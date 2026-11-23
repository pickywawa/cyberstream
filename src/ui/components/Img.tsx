import { memo, useMemo } from 'react';
import { artwork_html } from '../../rust/generated/cyberstream';

interface Props {
  srcs: (string | undefined | null)[]; alt?: string; label?: string; className?: string; contain?: boolean; eager?: boolean;
}
export const Img = memo(function Img({ className, ...props }: Props) {
  const raw = JSON.stringify({ ...props, class: className });
  const html = useMemo(() => ({ __html: artwork_html(raw) }), [raw]);
  return <span style={{ display: 'contents' }} dangerouslySetInnerHTML={html} />;
});
