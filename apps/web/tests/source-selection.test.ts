import { describe, expect, it } from 'vitest';
import { sourceLineSelection } from '../src/diagnostic-location';

describe('textarea diagnostic line selection', () => {
  it('selects the target line without its newline', () => {
    const source = '<?php\n  unsupported();\nend';
    const range = sourceLineSelection(source, 2);
    expect(source.slice(range.start, range.end)).toBe('  unsupported();');
    expect(range).toEqual({ start: 6, end: 22 });
  });
  it('calculates offsets in the textarea normalized LF representation', () => {
    const source = 'one\r\ntwo\rthree';
    const range = sourceLineSelection(source, 3);
    expect(source.replace(/\r\n?/g, '\n').slice(range.start, range.end)).toBe('three');
    expect(range.start).toBe(8);
  });
  it('uses UTF-16 offsets with Chinese and emoji before the target line', () => {
    const source = '中文😀\n$欄位 = "值";';
    const range = sourceLineSelection(source, 2);
    expect(range.start).toBe(5);
    expect(source.slice(range.start, range.end)).toBe('$欄位 = "值";');
  });
  it('selects an empty final line at EOF', () => {
    expect(sourceLineSelection('one\n', 2)).toEqual({ start: 4, end: 4 });
  });
  it('opens at the beginning for file-level or invalid line positions', () => {
    for (const line of [null, 0, -1, 100, 1.2, NaN]) {
      expect(sourceLineSelection('one\ntwo', line)).toEqual({ start: 0, end: 0 });
    }
  });
  it('supports first-line selection and empty input', () => {
    expect(sourceLineSelection('<?php\nnext', 1)).toEqual({ start: 0, end: 5 });
    expect(sourceLineSelection('', 1)).toEqual({ start: 0, end: 0 });
  });
});
