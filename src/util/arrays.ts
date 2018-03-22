export function flattenArray<T>(accumulator: T[], currentValue: T[]) : T[] {
  accumulator.push(...currentValue);
  return accumulator;
}
