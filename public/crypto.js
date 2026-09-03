/**
 * SecureVault Web Cryptography Module
 * Implements Zero-Knowledge Client-Side Cryptography using Web Crypto API.
 * 100% Binary-Compatible with SecureVault Java Desktop (AES-256/CBC + PBKDF2).
 */

const VaultCrypto = (() => {
  const PBKDF2_ITERATIONS = 65536;
  const KEY_LENGTH_BITS = 256;
  const SALT_LENGTH_BYTES = 16;
  const IV_LENGTH_BYTES = 16;

  // Utility: Convert ArrayBuffer to Base64 string
  function bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Utility: Convert Base64 string to Uint8Array
  function base64ToBuffer(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // Utility: Convert ArrayBuffer to hex string
  function bufferToHex(buffer) {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  return {
    /**
     * Compute SHA-256 hash of a string (returns lowercase hex string)
     * Compatible with Java HashService.sha256()
     */
    async sha256(text) {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return bufferToHex(hashBuffer);
    },

    /**
     * Generate a cryptographically secure random 16-byte salt
     * Returns Base64-encoded salt string
     */
    generateSalt() {
      const salt = new Uint8Array(SALT_LENGTH_BYTES);
      crypto.getRandomValues(salt);
      return bufferToBase64(salt);
    },

    /**
     * Derive AES-256 key from master password and Base64 salt
     * Using PBKDF2-HMAC-SHA256 with 65,536 iterations
     * Compatible with Java KeyDerivationService.deriveKey()
     */
    async deriveKey(password, base64Salt) {
      const encoder = new TextEncoder();
      const passwordBytes = encoder.encode(password);
      const saltBytes = base64ToBuffer(base64Salt);

      // Import master password as PBKDF2 base key
      const baseKey = await crypto.subtle.importKey(
        'raw',
        passwordBytes,
        'PBKDF2',
        false,
        ['deriveKey', 'deriveBits']
      );

      // Derive AES-CBC 256-bit encryption key
      const aesKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltBytes,
          iterations: PBKDF2_ITERATIONS,
          hash: 'SHA-256'
        },
        baseKey,
        {
          name: 'AES-CBC',
          length: KEY_LENGTH_BITS
        },
        false,
        ['encrypt', 'decrypt']
      );

      return aesKey;
    },

    /**
     * Encrypt plaintext string using AES-256-CBC with random 16-byte IV
     * Returns format: "Base64(IV):Base64(Ciphertext)"
     * Compatible with Java EncryptionService.encrypt()
     */
    async encrypt(plainText, key) {
      const encoder = new TextEncoder();
      const data = encoder.encode(plainText);

      // 16-byte random IV
      const iv = new Uint8Array(IV_LENGTH_BYTES);
      crypto.getRandomValues(iv);

      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-CBC',
          iv: iv
        },
        key,
        data
      );

      const ivBase64 = bufferToBase64(iv);
      const cipherBase64 = bufferToBase64(encryptedBuffer);

      return `${ivBase64}:${cipherBase64}`;
    },

    /**
     * Decrypt "Base64(IV):Base64(Ciphertext)" using AES-256-CBC
     * Returns plaintext string
     * Compatible with Java EncryptionService.decrypt()
     */
    async decrypt(encryptedFormattedText, key) {
      try {
        if (!encryptedFormattedText || !encryptedFormattedText.includes(':')) {
          throw new Error('Invalid encrypted format. Expected IV:Ciphertext');
        }

        const parts = encryptedFormattedText.split(':');
        const iv = base64ToBuffer(parts[0]);
        const ciphertext = base64ToBuffer(parts[1]);

        const decryptedBuffer = await crypto.subtle.decrypt(
          {
            name: 'AES-CBC',
            iv: iv
          },
          key,
          ciphertext
        );

        const decoder = new TextDecoder('utf-8');
        return decoder.decode(decryptedBuffer);
      } catch (err) {
        console.error('Decryption error:', err);
        throw new Error('Failed to decrypt password. Key may be invalid or data corrupted.');
      }
    },

    /**
     * Evaluate password strength according to SecureVault rules:
     * - Strong: Length >= 12 && has digit && has uppercase && has lowercase && has special char
     * - Medium: Length >= 8 && has digit && has lowercase
     * - Weak: anything else
     */
    checkPasswordStrength(password) {
      if (!password) {
        return {
          strength: '',
          score: 0,
          checks: { length: false, upper: false, lower: false, digit: false, special: false }
        };
      }

      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasDigit = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      const isLongEnough = password.length >= 8;
      const isStrongLength = password.length >= 12;

      let score = 0;
      if (password.length >= 8) score++;
      if (password.length >= 12) score++;
      if (hasUpper) score++;
      if (hasLower) score++;
      if (hasDigit) score++;
      if (hasSpecial) score++;

      let strength = 'Weak';
      if (isStrongLength && hasDigit && hasUpper && hasSpecial && hasLower) {
        strength = 'Strong';
      } else if (isLongEnough && hasDigit && hasLower) {
        strength = 'Medium';
      }

      return {
        strength,
        score,
        checks: {
          length: isLongEnough,
          strongLength: isStrongLength,
          upper: hasUpper,
          lower: hasLower,
          digit: hasDigit,
          special: hasSpecial
        }
      };
    },

    /**
     * Generate a cryptographically random password
     */
    generatePassword(options = {}) {
      const {
        length = 16,
        includeUpper = true,
        includeLower = true,
        includeDigits = true,
        includeSymbols = true,
        excludeAmbiguous = false
      } = options;

      let upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let lowerChars = 'abcdefghijklmnopqrstuvwxyz';
      let digitChars = '0123456789';
      let symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      if (excludeAmbiguous) {
        // Exclude 0, O, o, l, 1, I
        upperChars = upperChars.replace(/[OI]/g, '');
        lowerChars = lowerChars.replace(/[ol]/g, '');
        digitChars = digitChars.replace(/[01]/g, '');
      }

      let charset = '';
      const guaranteed = [];

      if (includeUpper) {
        charset += upperChars;
        guaranteed.push(upperChars[Math.floor(Math.random() * upperChars.length)]);
      }
      if (includeLower) {
        charset += lowerChars;
        guaranteed.push(lowerChars[Math.floor(Math.random() * lowerChars.length)]);
      }
      if (includeDigits) {
        charset += digitChars;
        guaranteed.push(digitChars[Math.floor(Math.random() * digitChars.length)]);
      }
      if (includeSymbols) {
        charset += symbolChars;
        guaranteed.push(symbolChars[Math.floor(Math.random() * symbolChars.length)]);
      }

      if (charset.length === 0) {
        charset = lowerChars + digitChars;
      }

      const randomBytes = new Uint32Array(length);
      crypto.getRandomValues(randomBytes);

      const passwordChars = [];
      for (let i = 0; i < length; i++) {
        passwordChars.push(charset[randomBytes[i] % charset.length]);
      }

      // Ensure guaranteed types are present
      for (let i = 0; i < guaranteed.length && i < passwordChars.length; i++) {
        passwordChars[i] = guaranteed[i];
      }

      // Shuffle using Fisher-Yates
      for (let i = passwordChars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
      }

      return passwordChars.join('');
    }
  };
})();
