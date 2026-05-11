import * as crypto from 'crypto';

/**
 * Character set containing uppercase letters (excluding ambiguous characters like 'O').
 */
const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Character set containing lowercase letters (excluding ambiguous characters like 'l').
 */
const LOWERCASE = 'abcdefghjkmnpqrstuvwxyz';

/**
 * Character set containing digits (excluding ambiguous characters like '0' and '1').
 */
const DIGITS = '23456789';

/**
 * Character set containing allowed special symbols.
 */
const SYMBOLS = '@#$%&*!';

/**
 * Generates a secure random temporary password.
 *
 * This function ensures that the generated password:
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one digit
 * - Contains at least one symbol
 * - Uses cryptographically secure randomness via Node.js `crypto` module
 * - Is shuffled to avoid predictable patterns
 *
 * @param {number} [length=12] - The desired length of the password.
 * @returns {string} A randomly generated secure password.
 *
 * @example
 * const password = randomPasswordGenerator();
 * console.log(password); // e.g. "G7@kP3!xZ2Qa"
 *
 * @example
 * const password = randomPasswordGenerator(16);
 * console.log(password); // e.g. "x@P9K!m2Zq7T#L8a"
 *
 * @security
 * - This function is suitable for generating temporary passwords.
 */
export default function randomPasswordGenerator(length: number = 12): string {
  let password = '';

  // Ensure at least one character from each required category
  password += UPPERCASE[crypto.randomInt(UPPERCASE.length)];
  password += LOWERCASE[crypto.randomInt(LOWERCASE.length)];
  password += DIGITS[crypto.randomInt(DIGITS.length)];
  password += SYMBOLS[crypto.randomInt(SYMBOLS.length)];

  // Combine all character sets
  const allChars = UPPERCASE + LOWERCASE + DIGITS + SYMBOLS;

  // Fill remaining characters randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }

  // Shuffle password using Fisher-Yates algorithm
  const arr = password.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr.join('');
}
