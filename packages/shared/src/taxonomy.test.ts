import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEPARTMENTS, departmentName } from './taxonomy.js';

test('rayons : slugs uniques, catégories non vides et sans doublon', () => {
  assert.equal(new Set(DEPARTMENTS.map((d) => d.slug)).size, DEPARTMENTS.length);
  for (const d of DEPARTMENTS) {
    assert.ok(d.categories.length > 0, d.slug);
    assert.equal(new Set(d.categories).size, d.categories.length, d.slug);
  }
});

test('les rayons historiques existent toujours', () => {
  for (const s of ['electronique', 'construction', 'vetements', 'imprimantes']) assert.notEqual(departmentName(s), s);
});
