/** Reads valid checklist IDs from untrusted browser storage. @param {string|null} value @returns {number[]} */
export function normalizeChecklist(value) {
  try { const parsed=JSON.parse(value);return Array.isArray(parsed)?[...new Set(parsed.filter(id=>Number.isInteger(id)&&id>=0&&id<5))]:[]; } catch { return []; }
}
/** Resolves a knowledge-page URL fragment. @param {string} hash @returns {string} */
export function resolveTab(hash) { const id=hash.replace(/^#/,'');return ['heroes','shop'].includes(id)?id:'roles'; }
/** Applies all hero filters without mutating the catalog. @param {object[]} heroes @param {object} stats @param {object} filters @returns {object[]} */
export function filterHeroes(heroes,stats,{query='',attribute='all',complexity='all',position='all'}={}) {
  const q=query.trim().toLowerCase();
  return heroes.filter(h=>(position==='all'||stats?.heroes?.[h.id]?.roles.some(r=>r.position==position&&r.share>=5))&&(attribute==='all'||h.attr==attribute)&&(complexity==='all'||h.complexity==complexity)&&[h.name,h.short,...h.abilities.map(a=>a.name)].join(' ').toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name));
}
/** Filters and sorts shop items; BKB is accepted as a search alias. @param {object[]} items @param {object} filters @returns {object[]} */
export function filterItems(items,{query='',category='all',sort='category'}={}) {
  const consumables=['tango','flask','clarity','enchanted_mango','faerie_fire','ward_observer','ward_sentry','dust','smoke_of_deceit','tpscroll','blood_grenade','cheese','refresher_shard'];
  let q=query.trim().toLowerCase();if(q==='bkb')q='black king';
  const result=items.filter(i=>(category==='all'||category==='neutral'&&i.tier>=0||category==='consumable'&&consumables.includes(i.slug)||category==='basic'&&i.cost>0&&i.cost<=1000&&i.tier<0&&!consumables.includes(i.slug)||category==='early'&&i.early||category==='late'&&i.late)&&(i.name+' '+i.description+' '+i.slug).toLowerCase().includes(q));
  if(sort==='cost')result.sort((a,b)=>a.cost-b.cost);if(sort==='name')result.sort((a,b)=>a.name.localeCompare(b.name));return result;
}
/** Formats a Russian shop result count. @param {number} count @returns {string} */
export function itemCountLabel(count) {
  const form=new Intl.PluralRules('ru-RU').select(count);
  return `${count} ${{one:'предмет',few:'предмета',many:'предметов',other:'предмета'}[form]}`;
}
