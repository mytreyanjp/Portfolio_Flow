
// src/types/global.d.ts
declare namespace JSX {
  interface IntrinsicElements {
    'clooned-object': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      oid?: string;
      features?: string;
      // Add any other relevant attributes the clooned-object tag might take
    }, HTMLElement>;
  }
}
