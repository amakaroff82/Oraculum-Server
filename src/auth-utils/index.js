import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const HASHING_ALGORITHM = 'sha512';  /** Hashing algorithm sha512 */
const SALT_LENGTH = 16;  /** Hashing algorithm sha512 */
const EXPIRES_IN = 60 * 60 * 24 * 30;  /** expires in 30 days */
const SECRET = 'ajcnHsds4sla0akG';  /** secret code */

/**
 * generates random string of characters i.e salt
 * @function
 * @param {number} length - Length of the random string.
 */
export function genRandomString(length){
  return crypto.randomBytes(Math.ceil(length/2))
    .toString('hex') /** convert to hexadecimal format */
    .slice(0,length);   /** return required number of characters */
}

/**
 * hash password
 * @function
 * @param {string} password - List of required fields.
 * @param {string} salt - Data to be validated.
 */
export function hashPassword(password, salt) {
  const hash = crypto.createHmac(HASHING_ALGORITHM, salt);
  hash.update(password);

  return hash.digest('hex');
}

export function saltHashPassword(password) {
  var salt = genRandomString(SALT_LENGTH);
  var passwordHash = hashPassword(password, salt);

  return {
    salt: salt,
    passwordHash: passwordHash
  }
}

export function isPasswordValid(password, salt, passwordHash) {
  return passwordHash === hashPassword(password, salt);
}

export function generateToken(userId) {
  const token = jwt.sign({ id: userId }, SECRET, {
    expiresIn: EXPIRES_IN
  });

  return token;
}




