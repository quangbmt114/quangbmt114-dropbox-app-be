import * as Buffer from 'buffer';

export function encodeBase64(input: string): string {
  const buffer = Buffer.Buffer.from(input, 'utf-8');
  return buffer.toString('base64');
}

export function decodeBase64(input: string | undefined): string {
  if (input == null || input === '') return '';
  const buffer = Buffer.Buffer.from(input, 'base64');
  return buffer.toString('utf-8');
}
