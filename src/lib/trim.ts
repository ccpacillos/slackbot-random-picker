import trimw from 'trim-whitespace';
import trimn from 'trim-newlines';

export function trim(text: string): string {
  return trimw(trimn(text));
}
