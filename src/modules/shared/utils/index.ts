import pickBy from 'lodash/pickBy';
import isUndefined from 'lodash/isUndefined';
import { isString } from 'lodash';
import * as crypto from 'crypto';


export function filterUndef<T extends object>(object: T): Partial<T> {
  return pickBy(object, (value) => !isUndefined(value));
}

export const removeLastSlash = (url: string) => {
  if (url[url.length - 1] === '/') {
    return url.slice(0, url.length - 1);
  }
  return url;
};

export function assignToObj<T>(E: new (...args: any[]) => T, data: Partial<T>): T {
  const instance = new E();

  return Object.assign(instance, data);
}

// export const Sleep = (ms: number): Promise<void> => {
//   return new Promise((resolve) => {
//     const timer = setTimeout(() => {
//       clearTimeout(timer);
//       resolve();
//     }, ms);
//   });
// };

export const maskConfigProvider = <T extends Record<string, any>>(
  configs: T,
  options?: {
    numLastCharacter?: number;
    percentShow?: number;
    maskKeys?: (keyof T)[];
  }
): T => {
  const { numLastCharacter, percentShow, maskKeys } = Object.assign(
    { numLastCharacter: 2, percentShow: 0.2, maskKeys: [] as string[] },
    options
  );
  const maskedConfigs: any = {} as T;

  for (const key in configs) {
    const value = configs[key];

    if (!maskKeys.includes(key)) {
      maskedConfigs[key] = value;
      continue;
    }

    if (isString(value)) {
      const length = value.length;

      if (length <= numLastCharacter) {
        maskedConfigs[key] = '*'.repeat(length);
      } else {
        const showLength = Math.floor(length * percentShow);
        const maskLength = length - showLength - numLastCharacter;
        const mask = '*'.repeat(Math.max(maskLength, 0));

        maskedConfigs[key] = value.slice(0, showLength) + mask + value.slice(-numLastCharacter);
      }
    }
  }

  return maskedConfigs as T;
};

export const hashPasswordHostAway = (businessId: string) => {
  return crypto.createHmac('sha256', process.env.HOSTAWAY_SECRET).update(businessId).digest('hex');
};

type AnyObject = Record<string, any>;
export function deepPick<T extends AnyObject>(obj: T, paths: string[]): Partial<T> {
  return paths.reduce<Partial<T>>((result, path) => {
    const value = path
      .split('.')
      .reduce<AnyObject | undefined>((acc, key) => (acc && key in acc ? acc[key] : undefined), obj);

    if (value !== undefined) {
      path.split('.').reduce<AnyObject>((acc, key, index, array) => {
        return (acc[key] ||= index === array.length - 1 ? value : {});
      }, result as AnyObject);
    }
    return result;
  }, {});
}

export const isDefined = <T>(value: T): value is Exclude<T, undefined> => value !== undefined;
