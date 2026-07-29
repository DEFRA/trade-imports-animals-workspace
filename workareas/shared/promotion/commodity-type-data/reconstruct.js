'use strict';
const fs = require('fs');

const EXTRACT = '/private/tmp/claude-501/-Users-samfarrington-git-defra-trade-imports-animals/430876d2-cf7e-4ff7-9a0b-94862fbb8c9b/scratchpad/certnom-extract.txt';
const OUTDIR = '/Users/samfarrington/git/defra/trade-imports-animals-workspace/workareas/shared/promotion/commodity-type-data';
const FIX = '/Users/samfarrington/git/defra/ipaffs/ipaffs-frontend-notification/service/test/data';

// commodity code -> CVEDA (640) requirement PK (resolved from production LFS data)
const REQ = {
  '0101':     '9A36CC3B-5268-9A1E-8350-488C171A39DD',
  '0102':     '9411ACDA-F682-56F5-FCCF-68906BEB4272',
  '01061900': '26DE075B-2A2A-81C1-7409-90BD837F2CA6',
  '0301':     '36F102FC-F54B-C58C-AD78-6AD5CBE682E5',
};

// certification_nomenclature column indices (0-based), per the .fmt (41 cols)
const C = {
  reqCode: 9,        // CertificationRequirement_Code
  typeName: 13,      // CommodityType_Name
  typeId: 14,        // CommodityType_ID
  typeDefault: 15,   // IsDefaultCommodityType
  familyName: 19,
  className: 23,
  speciesName: 26,   // Species_Name
  speciesId: 27,     // Species_ID
};

function normName(s) {
  if (s === undefined || s === null) return '';
  const t = s.trim();
  if (t === 'Blank/Empty' || t === 'NULL') return '';
  return t;
}
function isEmpty(s) {
  return s === undefined || s === null || s.trim() === '' || s.trim() === 'NULL';
}

const lines = fs.readFileSync(EXTRACT, 'utf8').split(/\r?\n/).filter(Boolean);

function reconstruct(code) {
  const reqPK = REQ[code];
  const typesByName = new Map();   // name -> {id, text, isDefault}
  const speciesByTypeId = new Map(); // typeId -> Map(speciesId -> name)
  let rowCount = 0;

  for (const line of lines) {
    const f = line.split('||');
    if (f[C.reqCode] !== reqPK) continue;
    // animal filter: cert 640 != 851 -> require commodity_type_id present
    if (isEmpty(f[C.typeId])) continue;
    rowCount++;
    const tName = normName(f[C.typeName]);
    const tId = f[C.typeId].trim();
    const tDef = isEmpty(f[C.typeDefault]) ? '0' : f[C.typeDefault].trim();
    if (!typesByName.has(tName)) {
      typesByName.set(tName, { id: tId, text: tName, isDefault: tDef });
    }
    if (!isEmpty(f[C.speciesId])) {
      if (!speciesByTypeId.has(tId)) speciesByTypeId.set(tId, new Map());
      speciesByTypeId.get(tId).set(f[C.speciesId].trim(), normName(f[C.speciesName]));
    }
  }

  if (rowCount === 0) {
    // fn_commodity_category_data pseudo-data fallback: empty tree ->
    // single blank type whose value is the traces_commodity_code, no species.
    return {
      code, certificateType: 'cveda', requirementCode: reqPK, rowCount: 0,
      emptyTreeFallback: true,
      types: [{ id: code, text: '', isDefault: '0', species: [] }],
    };
  }

  const types = [...typesByName.values()].map(t => {
    const sp = speciesByTypeId.get(t.id) || new Map();
    const species = [...sp.entries()]
      .map(([value, text]) => ({ text, value }))
      .sort((a, b) => a.text.localeCompare(b.text));
    return { id: t.id, text: t.text, isDefault: t.isDefault, species };
  });
  return { code, certificateType: 'cveda', requirementCode: reqPK, rowCount, types };
}

// ---- fixture resolution: build typeId -> {text, speciesNames Set} ----
function fixtureTree(file) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const d = JSON.parse(raw.data);
  const classByVal = new Map(d.classes.map(c => [c.value, c.type]));
  const famByVal = new Map(d.families.map(f => [f.value, f.clazz]));
  const modelByVal = new Map(d.models.map(m => [m.value, m.family]));
  const typeText = new Map(d.types.map(t => [t.value, t.text]));
  const perType = new Map(); // typeId -> {text, species: Map(id->name)}
  for (const t of d.types) perType.set(t.value, { text: t.text, species: new Map() });
  for (const s of d.species) {
    const fam = modelByVal.get(s.model);
    const clazz = famByVal.get(fam);
    const typeId = classByVal.get(clazz);
    if (typeId !== undefined && perType.has(typeId)) {
      perType.get(typeId).species.set(s.value, s.text);
    }
  }
  return { types: d.types, perType };
}

function summariseTypes(types) {
  return types.map(t => `${t.text === '' ? '<blank>' : t.text}(id=${t.id}, species=${t.species.length})`).join('  |  ');
}

const out = {};
for (const code of Object.keys(REQ)) out[code] = reconstruct(code);

// write commodity-types.json (task-shaped)
const shaped = Object.values(out).map(o => ({
  code: o.code,
  certificateType: o.certificateType,
  requirementCode: o.requirementCode,
  types: o.types.map(t => ({ id: t.id, text: t.text, isDefault: t.isDefault, species: t.species })),
}));
fs.writeFileSync(OUTDIR + '/commodity-types.json', JSON.stringify(shaped, null, 2) + '\n');

// ---- VALIDATION GATE ----
console.log('=== RECONSTRUCTION (production LFS snapshot 2023-10-10) ===');
for (const code of Object.keys(REQ)) {
  const o = out[code];
  console.log(`\n[${code}] reqPK=${o.requirementCode} rows=${o.rowCount}`);
  console.log('  types: ' + summariseTypes(o.types));
  for (const t of o.types) {
    console.log(`    type ${t.text === '' ? '<blank>' : t.text} (id=${t.id}, default=${t.isDefault}):`);
    for (const s of t.species) console.log(`        ${s.value}  ${s.text}`);
  }
}

console.log('\n\n=== VALIDATION vs FIXTURES ===');
for (const code of ['0101', '0102']) {
  const fx = fixtureTree(`${FIX}/commodity-categories-${code}.json`);
  const rc = out[code];
  console.log(`\n--- ${code} ---`);
  console.log('  FIXTURE types: ' + fx.types.map(t => `${t.text === '' ? '<blank>' : t.text}(id=${t.value})`).join(', '));
  console.log('  RECON   types: ' + rc.types.map(t => `${t.text === '' ? '<blank>' : t.text}(id=${t.id})`).join(', '));
  console.log(`  type COUNT: fixture=${fx.types.length} recon=${rc.types.length}  ${fx.types.length === rc.types.length ? 'MATCH' : 'DIVERGE'}`);
  // per-type species-name comparison
  for (const [tid, info] of fx.perType.entries()) {
    const fnames = [...info.species.values()].map(n => n.trim()).sort();
    // find recon type by matching text
    const rt = rc.types.find(t => t.text === info.text) || rc.types[0];
    const rnames = rt ? rt.species.map(s => s.text.trim()).sort() : [];
    console.log(`  type "${info.text === '' ? '<blank>' : info.text}": fixtureSpecies=${fnames.length} reconSpecies=${rnames.length}`);
    console.log('    fixture names: ' + fnames.join(', '));
    console.log('    recon   names: ' + rnames.join(', '));
    const fset = new Set(fnames.map(n => n.toLowerCase()));
    const rset = new Set(rnames.map(n => n.toLowerCase()));
    const onlyF = fnames.filter(n => !rset.has(n.toLowerCase()));
    const onlyR = rnames.filter(n => !fset.has(n.toLowerCase()));
    console.log('    only-in-fixture: ' + (onlyF.join(', ') || '(none)'));
    console.log('    only-in-recon:   ' + (onlyR.join(', ') || '(none)'));
  }
}
console.log('\nWROTE ' + OUTDIR + '/commodity-types.json');
