import { customAlphabet } from 'nanoid';

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 24);

export async function generateUserId(): Promise<string> {
  return nanoid();
}
