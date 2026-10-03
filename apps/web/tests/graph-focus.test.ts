import { describe, expect, it } from 'vitest';
import { matchingTables, focusGraphTable } from '../src/graph-focus';
import { initialGraphView } from '../src/comparison-layout';
describe('graph table search and focus', () => {
  it('uses trimmed case-insensitive literal substring matching without changing names', () => {
    const names = ['Users', 'user_profiles', '__proto__', 'a[b]'];
    expect(matchingTables(names,' USER ')).toEqual(['Users','user_profiles']);
    expect(matchingTables(names,'[b]')).toEqual(['a[b]']);
    expect(matchingTables(names,'__proto__')).toEqual(['__proto__']);
    expect(matchingTables(names,'')).toEqual(names);
    expect(matchingTables(names,'missing')).toEqual([]);
  });
  it('centers the table at its actual moved position and preserves overrides', () => {
    const view = initialGraphView({width:1020,height:500}); view.positions.set('users',{x:900,y:400});
    const focused = focusGraphTable(view,{name:'users',height:100},view.positions.get('users')!);
    expect(focused.pan.x + (900 + 150) * focused.zoom).toBe(600);
    expect(focused.pan.y + (400 + 50) * focused.zoom).toBe(280);
    expect(focused.focused).toBe('users'); expect(focused.positions).toBe(view.positions);
    expect(view.focused).toBeUndefined(); expect(view.pan).toEqual({x:20,y:20});
  });
  it('fits tall tables within the zoom limits rather than expanding them', () => {
    const view = initialGraphView({width:550,height:2000});
    expect(focusGraphTable(view,{name:'tall',height:1000},{x:30,y:30}).zoom).toBe(0.48);
    expect(focusGraphTable(view,{name:'huge',height:10000},{x:30,y:30}).zoom).toBe(0.15);
    expect(focusGraphTable(view,{name:'small',height:80},{x:30,y:30}).zoom).toBe(1);
  });
  it('resets the focus along with view without changing search data or positions', () => {
    const view = focusGraphTable(initialGraphView({width:550,height:180}),{name:'constructor',height:80},{x:30,y:30});
    const reset = initialGraphView({width:550,height:180});
    expect(reset.focused).toBeUndefined(); expect(view.focused).toBe('constructor');
    expect(matchingTables(['constructor'],'constructor')).toEqual(['constructor']);
  });
});
