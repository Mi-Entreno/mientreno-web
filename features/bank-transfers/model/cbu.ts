/**
 * CBU check digits.
 *
 * A deliberate duplicate of `payment/validation/CbuValidator.java`: the backend
 * validates too, and that is the one that counts. This copy exists because of
 * what a wrong CBU costs — a student transfers to an account that is not the
 * trainer's, and nothing in this product can undo it. Catching the typo in the
 * field, before it is ever published, is worth carrying the rule twice.
 *
 * The number is two blocks, each ending in its own check digit:
 *   - block 1 (8 digits): bank (3) + branch (4) + check (1), weights 7 1 3 9 7 1 3
 *   - block 2 (14 digits): account (13) + check (1), weights 3 9 7 1 3 9 7 1 3 9 7 1 3
 *
 * In both, the check digit is `(10 - (weighted sum mod 10)) mod 10`.
 *
 * It does not prove the account exists or belongs to anyone in particular —
 * only the bank knows that. It rules out an impossible number.
 */

const WEIGHTS_BLOCK_1 = [7, 1, 3, 9, 7, 1, 3]
const WEIGHTS_BLOCK_2 = [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3]

function hasValidCheckDigit(block: string, weights: number[]): boolean {
  const sum = weights.reduce((total, weight, index) => total + Number(block[index]) * weight, 0)
  const expected = (10 - (sum % 10)) % 10
  return expected === Number(block[block.length - 1])
}

export function isValidCbu(cbu: string): boolean {
  if (!/^\d{22}$/.test(cbu)) return false
  return (
    hasValidCheckDigit(cbu.slice(0, 8), WEIGHTS_BLOCK_1) &&
    hasValidCheckDigit(cbu.slice(8), WEIGHTS_BLOCK_2)
  )
}
