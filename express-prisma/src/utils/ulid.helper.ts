import { ulid } from 'ulid';

export enum EntityPrefix {
  USER = 'usr',
  PRODUCT = 'prd',
  CATEGORY = 'cat',
  CART = 'crt',
  CART_ITEM = 'cit',
}

export interface UlidComponents {
  prefix: string;
  ulid: string;
  fullId: string;
}

export class UlidHelper {
  static generate(prefix: EntityPrefix): string {
    return `${prefix}_${ulid()}`;
  }

  static parse(id: string): UlidComponents | null {
    if (!id || !id.includes('_')) {
      return null;
    }

    const [prefix, ulidPart] = id.split('_', 2);
    
    if (!prefix || !ulidPart || ulidPart.length !== 26) {
      return null;
    }

    return {
      prefix,
      ulid: ulidPart,
      fullId: id,
    };
  }

  static isValid(id: string): boolean {
    const parsed = this.parse(id);
    if (!parsed) return false;

    try {
      const validPrefixes = Object.values(EntityPrefix);
      if (!validPrefixes.includes(parsed.prefix as EntityPrefix)) {
        return false;
      }

      const ulidRegex = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/;
      return ulidRegex.test(parsed.ulid);
    } catch {
      return false;
    }
  }

  static validatePrefix(id: string, expectedPrefix: EntityPrefix): boolean {
    const parsed = this.parse(id);
    return parsed !== null && parsed.prefix === expectedPrefix;
  }

  static extractUlid(id: string): string | null {
    const parsed = this.parse(id);
    return parsed?.ulid || null;
  }

  static extractPrefix(id: string): string | null {
    const parsed = this.parse(id);
    return parsed?.prefix || null;
  }

  static getTimestamp(id: string): number | null {
    const parsed = this.parse(id);
    if (!parsed) return null;

    try {
      const timestamp = parseInt(parsed.ulid.slice(0, 10), 32);
      return timestamp;
    } catch {
      return null;
    }
  }

  static generateMultiple(prefix: EntityPrefix, count: number): string[] {
    return Array.from({ length: count }, () => this.generate(prefix));
  }
}
