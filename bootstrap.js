import {mountApp} from './app.js?v=20261029-3';
import {mountSidebar} from './sidebar.js?v=20261029-3';
import {createBrowserRuntime,createCatalogRepository} from './ports.js';
/** Connects browser adapters to the page controllers. @param {Window} host @returns {void} */
function bootstrap(host) {
  const dependencies={document:host.document,runtime:createBrowserRuntime(host),catalog:createCatalogRepository()};
  mountApp(dependencies);
  mountSidebar(dependencies);
}
bootstrap(window);
