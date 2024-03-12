import { config as loadEnv } from 'dotenv';
import D4HRequest from './d4h/lib/src/d4hRequest';

['.env', '.env.local'].forEach(p => loadEnv({ path: p }));

export const OPERATIONAL_UNITS = (process.env.UNITS ?? '').split(',').reduce((a, c) => {
  const parts = c.split('=');
  return ({ ...a, [parts[0]]: parts.slice(-1)[0] });
}, {} as Record<string, string>);

export function d4h<T>(url: string) {
  return new D4HRequest(process.env.D4H_TOKEN!, 250)
    .getManyAsync<T>(new URL(`https://api.d4h.org/v2/${url}`));
}


export function isSubset(left: any, right: any) {
  const log = 0
  log > 1 && console.log('-------');
  if (typeof left !== typeof right) {
    log > 0 && console.log('different types', typeof left, typeof right, left, right);
    return false;
  }
  if (typeof left == 'object') {
    const leftKeys = Object.keys(left)
    const rightKeys = Object.keys(right).reduce((a,c) => ({ ...a, [c]: 1 }), {} as Record<string,number>);
    for (const key of leftKeys) {
      if (!isSame(left[key], right[key])) {
        log > 0 && console.log('children differ', key);
        return false;
      } else {
        log > 1 &&console.log('ok', key);
      }
      delete rightKeys[key];
    }
    return true
  }

  log > 1 && console.log(typeof left, left, right);
  return left === right;
}

export function isSame(left: any, right: any) {
  const log = 0
  log > 1 && console.log('-------');
  if (typeof left !== typeof right) {
    log > 0 && console.log('different types', typeof left, typeof right, left, right);
    return false;
  }
  if (typeof left == 'object') {
    const leftKeys = Object.keys(left)
    const rightKeys = Object.keys(right).reduce((a,c) => ({ ...a, [c]: 1 }), {} as Record<string,number>);
    for (const key of leftKeys) {
      if (!isSame(left[key], right[key])) {
        log > 0 && console.log('children differ', key);
        return false;
      } else {
        log > 1 &&console.log('ok', key);
      }
      delete rightKeys[key];
    }
    if (Object.keys(rightKeys).length > 0) {
      log > 0 && console.log('right has more keys than left', Object.keys(rightKeys));
      return false;
    }
    return true
  }

  log > 1 && console.log(typeof left, left, right);
  return left === right;
}

export function shallowClone<T extends { [key: string]: any}>(left: T, omit: string[]): Partial<T> {
  const result: any = {};
  for (const key of Object.keys(left).filter(f => !omit.includes(f))) {
    result[key] = left[key];
  }
  return result;
}