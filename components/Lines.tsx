import { Fragment } from 'react';

/** Paragraph text where "\n" marks a line break (short-line stanzas). */
export default function Lines({ text }: { text: string }) {
  return text.split('\n').map((line, i, all) => (
    <Fragment key={i}>
      {line}
      {i < all.length - 1 && <br />}
    </Fragment>
  ));
}
