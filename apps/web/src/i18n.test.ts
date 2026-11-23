import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDictionary } from './i18n/index.js';

describe('i18n Dictionary', () => {
  it('returns French dictionary by default', () => {
    const dict = getDictionary('fr');
    assert.equal(dict.common.brand, 'Mwinda Market');
    assert.equal(dict.nav.home, 'Accueil');
    assert.equal(dict.departments.electronique, 'Gadgets Électroniques');
  });

  it('returns English dictionary when requested', () => {
    const dict = getDictionary('en');
    assert.equal(dict.nav.home, 'Home');
    assert.equal(dict.departments.electronique, 'Electronic Gadgets');
  });

  it('falls back to French when unknown locale is given', () => {
    // @ts-expect-error Testing fallback
    const dict = getDictionary('es');
    assert.equal(dict.nav.home, 'Accueil');
  });
});


import { DICT } from './i18n/dict.js';
import { tr } from './i18n/translate.js';

describe('Traductions de la boutique', () => {
  it('les quatre langues couvrent exactement les mêmes phrases', () => {
    const keys = Object.keys(DICT.en).sort();
    for (const l of ['sw', 'zh', 'es'] as const) assert.deepEqual(Object.keys(DICT[l]).sort(), keys, l);
  });
  it('aucune traduction vide ; une phrase inconnue reste en français', () => {
    for (const l of ['en', 'sw', 'zh', 'es'] as const) for (const [k, v] of Object.entries(DICT[l])) assert.ok(v.trim(), `${l}: ${k}`);
    assert.equal(tr('zh', 'Accueil'), '首页');
    assert.equal(tr('es', 'Phrase jamais traduite'), 'Phrase jamais traduite');
    assert.equal(tr('fr', 'Accueil'), 'Accueil');
  });
});
