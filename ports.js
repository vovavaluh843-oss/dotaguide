/** @typedef {object} StoragePort
 * @property {function(string): (string|null)} getItem
 * @property {function(string,string): void} setItem
 */
/** @typedef {object} RuntimePort
 * @property {StoragePort} storage
 * @property {Location} location
 * @property {function(string,Function): void} on
 * @property {function(Function,number): void} delay
 * @property {function(string): MediaQueryList} matchMedia
 * @property {function(Function,object): IntersectionObserver|null} observe
 * @property {function(): number} width
 * @property {function(): number} height
 */
/** @typedef {object} CatalogPort
 * @property {function(): Promise<{data:object,stats:object}>} read
 */
/** Wraps browser APIs behind RuntimePort; denied storage behaves as empty storage.
 * @param {Window} host @returns {RuntimePort}
 */
export function createBrowserRuntime(host) {
  return {
    storage:{getItem(key){try{return host.localStorage.getItem(key)}catch{return null}},setItem(key,value){try{host.localStorage.setItem(key,value)}catch{}}},
    location:host.location,on:(name,handler)=>host.addEventListener(name,handler),delay:(handler,ms)=>host.setTimeout(handler,ms),
    matchMedia:query=>host.matchMedia(query),observe:(callback,options)=>host.IntersectionObserver?new host.IntersectionObserver(callback,options):null,
    width:()=>host.innerWidth,height:()=>host.innerHeight
  };
}
/** Creates the packaged, read-only catalog adapter. @returns {CatalogPort} */
export function createCatalogRepository() {
  return {async read(){const [data,stats]=await Promise.all([import('./data.js?v=20261029-3'),import('./role-stats.js?v=20261029-3')]);return {data:data.default,stats:stats.default}}};
}
