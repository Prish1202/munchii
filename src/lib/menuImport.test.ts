import { describe, test } from 'node:test';
import { deepStrictEqual, strictEqual, notStrictEqual } from 'node:assert';
import { parseMenuText, validateMenuImportRows } from './menuImport';

describe('menu photo parser', () => {
  test('identifies item names followed by prices', () => {
    deepStrictEqual(parseMenuText('Butter Chicken ... ₹350\nMasala Dosa 80\n1. Tea Rs. 15/-\nFamily Meal INR 1,200.50'), [
      { name: 'Butter Chicken', price: '350.00' }, { name: 'Masala Dosa', price: '80.00' },
      { name: 'Tea', price: '15.00' }, { name: 'Family Meal', price: '1200.50' },
    ]);
  });
  test('does not invent prices from headings, totals or multi-price lines', () => {
    deepStrictEqual(parseMenuText('MENU\nTotal 500\nGST 18\nPaneer 100 150\nTea ₹10 ₹20\nWater 0'), []);
  });
  test('preserves quantity labels and non-English item names', () => {
    deepStrictEqual(parseMenuText('Milk 500ml ... 30\nचाय ... 20'), [
      { name: 'Milk 500ml', price: '30.00' }, { name: 'चाय', price: '20.00' },
    ]);
  });
  test('review edits are validated before saving', () => {
    strictEqual(validateMenuImportRows([{ id: '1', name: 'Tea', price: '20.50' }]), null);
    for (const price of ['0', '-5', 'NaN', '2.999', '']) {
      notStrictEqual(validateMenuImportRows([{ id: '1', name: 'Tea', price }]), null);
    }
    notStrictEqual(validateMenuImportRows([]), null);
    notStrictEqual(validateMenuImportRows([{ id: '1', name: ' ', price: '20' }]), null);
  });
});