declare global {
  interface ObjectConstructor {
    hasOwn<ObjectType, Key extends PropertyKey>(
      object: ObjectType,
      key: Key
    ): object is ObjectType & Record<Key, unknown>;
  }

  interface ArrayConstructor {
    isArray(arg: unknown): arg is unknown[] | ReadonlyArray<unknown>;
  }

  interface Array<T> {
    at(index: number): T | undefined;
  }

  interface ReadonlyArray<T> {
    at(index: number): T | undefined;
  }

  interface Map<K, V> {
    get(key: unknown): V | undefined;
    has(key: unknown): boolean;
  }

  interface Set<T> {
    has(key: unknown): boolean;
  }

  interface ReadonlyMap<K, V> {
    get(key: unknown): V | undefined;
    has(key: unknown): boolean;
  }

  interface WeakMap<K extends object, V> {
    get(key: unknown): V | undefined;
    has(key: unknown): boolean;
  }
}

export {};
