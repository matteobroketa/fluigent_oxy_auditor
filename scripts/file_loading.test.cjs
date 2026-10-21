const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('      async function readFiles(');
const end = html.indexOf('      setupDrop(', start);
function fixture() {
  const loaded = [], errors = [];
  const context = vm.createContext({
    fileLoadVersions: {oxy: 0, csv: 0},
    loadOxyText: (text, name) => loaded.push({text, name, kind: 'oxy'}),
    loadCsvText: (text, name) => loaded.push({text, name, kind: 'csv'}),
    alert: message => errors.push(message),
  });
  vm.runInContext(html.slice(start, end), context);
  return {context, loaded, errors};
}
function delayed(name) {
  let resolve, reject;
  const promise = new Promise((yes, no) => {resolve = yes; reject = no;});
  return {file: {name, text: () => promise}, resolve, reject};
}

test('a file read failure reports its name and permits the next CSV file', async () => {
  const {context, loaded, errors} = fixture();
  await context.readFiles([
    {name: 'unreadable.csv', text: async () => {throw Error('File is no longer available');}},
    {name: 'valid.csv', text: async () => 'valid data'},
  ], 'csv');
  assert.deepEqual(loaded, [{text: 'valid data', name: 'valid.csv', kind: 'csv'}]);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /unreadable.csv.*File is no longer available/);
});

test('clearing files invalidates an in-flight read and the rest of its batch', async () => {
  const {context, loaded} = fixture(), pending = delayed('old.csv');
  let nextRead = false;
  const task = context.readFiles([pending.file, {name:'next.csv', text:async()=>{nextRead=true;return 'next';}}], 'csv');
  context.fileLoadVersions.csv++;
  pending.resolve('old data'); await task;
  assert.deepEqual(loaded, []);
  assert.equal(nextRead, false);
});

test('a newer OXY selection wins even when the older file finishes later', async () => {
  const {context, loaded} = fixture(), old = delayed('old.oxy');
  const task = context.readFiles([old.file], 'oxy');
  await context.readFiles([{name:'new.oxy',text:async()=> 'new profile'}], 'oxy');
  old.resolve('old profile'); await task;
  assert.deepEqual(loaded, [{text:'new profile',name:'new.oxy',kind:'oxy'}]);
});

test('a cancelled read failure is quiet and concurrent CSV batches both append', async () => {
  const {context, loaded, errors} = fixture(), old = delayed('cancelled.csv');
  const task = context.readFiles([old.file], 'csv');
  context.fileLoadVersions.csv++; old.reject(Error('Not readable')); await task;
  const first = delayed('first.csv'), firstTask = context.readFiles([first.file], 'csv');
  await context.readFiles([{name:'second.csv',text:async()=> 'second'}], 'csv');
  first.resolve('first'); await firstTask;
  assert.deepEqual(errors, []);
  assert.deepEqual(loaded.map(item=>item.name), ['second.csv','first.csv']);
});

test('the picker snapshots files and resets immediately so the same file can be retried', async () => {
  const {context, loaded} = fixture(), pending = delayed('retry.csv');
  const input = {files:[pending.file], click(){}};
  Object.defineProperty(input, 'value', {set(){this.files.length=0;}});
  const drop = {classList:{add(){},remove(){}}};
  context.setupDrop(drop,input,'csv');
  const task = input.onchange({target:input});
  assert.equal(input.files.length, 0);
  pending.resolve('recovered'); await task;
  assert.equal(loaded[0].name, 'retry.csv');
});
