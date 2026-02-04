export type Alternate<A, B> =
  | [A]
  | [A, B, A]
  | [A, B, A, B, A, ...Array<A | B>];
