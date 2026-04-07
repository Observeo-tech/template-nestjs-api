import { col } from '@qbobjx/core';

export function snowflakeIdColumn() {
  return col
    .custom<string, 'bigint'>('bigint')
    .nativeType('bigint')
    .hydrate((value) => String(value))
    .serialize((value) => BigInt(String(value)));
}
