const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
// Execute the deployed inline parser functions, without a DOM or dependencies.
const core = html.slice(html.indexOf('      function parseNumberUnit('), html.indexOf('      function mapRun('));
const pressureStart = html.lastIndexOf('      function parseCSV(');
const pressureParser = html.slice(pressureStart, html.indexOf('      function normalLabel(', pressureStart));

function context(pressure = false) {
  const ctx = vm.createContext({ pressureHeaderInfo: () => null, pressureFactors: {} });
  vm.runInContext(core, ctx);
  if (pressure) vm.runInContext(pressureParser, ctx);
  return ctx;
}

for (const pressure of [false, true]) {
  const variant = pressure ? 'pressure-enabled' : 'base';
  test(`${variant} CSV parser treats integer timestamps as elapsed seconds`, () => {
    const ctx = context(pressure);
    for (const offset of [0, 1, 10, 2000]) {
      const csv = 'Time,Flow\n' + Array.from({ length: 15 }, (_, i) => `${offset + i},2`).join('\n');
      const run = ctx.parseCSV(csv);
      assert.deepEqual(Array.from(run.times), Array.from({ length: 15 }, (_, i) => i));
      assert.equal(run.duration, 14);
    }
  });

  test(`${variant} CSV parser preserves fractional seconds and timestamp dates`, () => {
    const ctx = context(pressure);
    for (const csv of [
      'Time;Flow\n0,5;1\n1,25;2\n2,5;3',
      'Time,Flow\n2026-10-21T10:00:00.500Z,1\n2026-10-21T10:00:01.250Z,2\n2026-10-21T10:00:02.500Z,3',
    ]) assert.deepEqual(Array.from(ctx.parseCSV(csv).times), [0, 0.75, 2]);
    assert.throws(() => ctx.parseCSV('Time,Flow\nnot-a-time,1'), /time column/);
  });
}

const wait = { $type: 'Wait', Duration: '00:00:01' };

test('OXY nested loops retain their timeline and channel states', () => {
  const profile = {
    Instruments: [{ Key: 'flow', Type: 'FrpFlowUnit', Port: 1 }],
    Functions: [
      { $type: 'SetValue', Setpoint: '2 uL/min', InstrumentKeys: ['flow'] },
      { $type: 'For', Iterations: 2, Functions: [
        { $type: 'Group', UserLabel: 'Hold', Functions: [wait] },
      ] },
      { $type: 'ResetAll' }, wait,
    ],
  };
  const result = context().parseOxy(JSON.stringify(profile));
  assert.equal(result.programDuration, 3);
  assert.deepEqual(Array.from(result.segments, s => s.state.flow), [2, 2, 0]);
  assert.equal(result.segments[0].label, 'Hold');
});

test('OXY invalid and oversized loops fail quickly, including empty loop bodies', () => {
  const ctx = context();
  for (const iterations of ['Infinity', 'NaN', -1, 1.5, 1000000000]) {
    ctx.input = JSON.stringify({ Functions: [{ $type: 'For', Iterations: iterations, Functions: [] }] });
    assert.throws(() => vm.runInContext('parseOxy(input)', ctx, { timeout: 1000 }), /iterations|expanded-step limit/);
  }
  ctx.input = JSON.stringify({ Functions: [{ $type: 'For', Iterations: 1000, Functions: [
    { $type: 'For', Iterations: 1000, Functions: [] },
  ] }] });
  assert.throws(() => vm.runInContext('parseOxy(input)', ctx, { timeout: 1000 }), /expanded-step limit/);
});

test('OXY malformed and deeply nested structures fail with useful errors', () => {
  const ctx = context();
  for (const value of [null, [], 'profile']) {
    assert.throws(() => ctx.parseOxy(JSON.stringify(value)), /JSON object/);
  }
  assert.throws(() => ctx.parseOxy('{"Functions":{}}'), /must be an array/);
  assert.throws(() => ctx.parseOxy('{"Functions":[null]}'), /must be objects/);
  let functions = [wait];
  for (let i = 0; i < 102; i++) functions = [{ $type: 'Group', Functions: functions }];
  assert.throws(() => ctx.parseOxy(JSON.stringify({ Functions: functions })), /nesting exceeds/);
});
