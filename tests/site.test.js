import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeChecklist, resolveTab, filterHeroes, filterItems} from '../domain.js';

test('Corrupt stored checklist never breaks the home page', () => {
  for(const value of ['null','{}','"hello"','broken','42']) assert.deepEqual(normalizeChecklist(value),[]);
  assert.deepEqual(normalizeChecklist('[0,0,1,4,5,-1,"2",null]'),[0,1,4]);
});
test('Knowledge links select roles, heroes and shop, with safe fallback',()=>{
  assert.equal(resolveTab('#heroes'),'heroes');assert.equal(resolveTab('#shop'),'shop');
  assert.equal(resolveTab('#role-hard'),'roles');assert.equal(resolveTab('#invalid'),'roles');
});
test('Hero filters combine search, attribute, complexity and position',()=>{
  const heroes=[{id:1,name:'Axe',short:'Танк',attr:0,complexity:1,abilities:[{name:'Berserker Call'}]},{id:2,name:'Luna',short:'Керри',attr:1,complexity:1,abilities:[]}];
  const stats={heroes:{1:{roles:[{position:3,share:95},{position:1,share:4}]}}};
  assert.deepEqual(filterHeroes(heroes,stats,{query:' CALL ',attribute:'0',complexity:'1',position:'3'}).map(x=>x.id),[1]);
  assert.equal(filterHeroes(heroes,stats,{position:'1'}).length,0);
  assert.equal(filterHeroes(heroes,stats,{query:'ничего'}).length,0);
});
test('Item search supports BKB alias, categories and non-mutating sort',()=>{
  const items=[{name:'Tango',slug:'tango',cost:90,tier:-1,description:'Лечение'},{name:'Black King Bar',slug:'black_king_bar',cost:4050,tier:-1,description:'Защита',late:true}];
  assert.equal(filterItems(items,{query:' BKB '})[0].slug,'black_king_bar');
  assert.equal(filterItems(items,{category:'consumable'}).length,1);
  assert.equal(filterItems(items,{category:'late',sort:'cost'})[0].cost,4050);
  filterItems(items,{sort:'name'});assert.equal(items[0].name,'Tango');
});
test('Both pages use module entrypoint, versioned styles and a skip link',async()=>{
  for(const file of ['index.html','guide.html']){
    const html=await readFile(new URL('../'+file,import.meta.url),'utf8');
    assert.match(html,/<script type="module" src="bootstrap.js\?v=/);
    assert.doesNotMatch(html,/<script src="(?:data|role-stats|app|sidebar)\.js/);
    assert.match(html,/class="skip-link" href="#main-content"/);
  }
});
test('Catalog data does not create globals and includes all heroes and valid role distributions',async()=>{
  const {default:data}=await import('../data.js');const {default:stats}=await import('../role-stats.js');
  assert.equal(data.heroes.length,127);assert.ok(data.items.length>250);
  for(const hero of data.heroes){const roles=stats.heroes[hero.id].roles;assert.equal(roles.length,5);const total=roles.reduce((sum,r)=>sum+r.share,0);assert.ok(total>99&&total<101)}
  for(const file of ['app.js','sidebar.js','data.js','role-stats.js']){
    const source=await readFile(new URL('../'+file,import.meta.url),'utf8');assert.doesNotMatch(source,/window\.DOTA_/);
  }
});
test('Storage adapter survives restricted browser storage',async()=>{
  const {createBrowserRuntime}=await import('../ports.js');
  const host={get localStorage(){throw Error('Access denied')}};
  const runtime=createBrowserRuntime(host);assert.equal(runtime.storage.getItem('checks'),null);
  assert.doesNotThrow(()=>runtime.storage.setItem('checks','[]'));
});
test('Every catalog image and build image exists in the published package',async()=>{
  const {access}=await import('node:fs/promises');const {default:data}=await import('../data.js');const {default:stats}=await import('../role-stats.js');
  const images=new Set([...data.heroes,...data.items].map(x=>x.image));
  for(const h of Object.values(stats.heroes))for(const role of h.roles)if(role.build)for(const i of [...role.build.starting,...role.build.core])images.add('assets/item_'+i.slug+'.png');
  for(const image of images)await access(new URL('../'+image,import.meta.url));
});
test('Russian item counters use the correct noun form',async()=>{
  const {itemCountLabel}=await import('../domain.js');
  for(const [n,label] of [[0,'0 предметов'],[1,'1 предмет'],[2,'2 предмета'],[5,'5 предметов'],[11,'11 предметов'],[21,'21 предмет']])assert.equal(itemCountLabel(n),label);
});
