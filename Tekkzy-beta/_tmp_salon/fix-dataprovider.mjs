import fs from 'fs';

const srcPath = 'f:/tekkzy/Tekkzy/_tmp_salon/data-provider.js';
const outPath = 'f:/tekkzy/Tekkzy/_tmp_salon/data-provider.fixed.js';
let c = fs.readFileSync(srcPath, 'utf8');

// 1) Capture validate fn: o=r(function(e){...}(t))
//    -> o=r((window.__TEKKZY_VALIDATE_CMS__=function(e){...})(t))
const vOpenFrom = 'o=r(function(e){';
const vOpenTo = 'o=r((window.__TEKKZY_VALIDATE_CMS__=function(e){';
if (!c.includes(vOpenFrom)) throw new Error('validate open not found');
c = c.replace(vOpenFrom, vOpenTo);

// Close the assignment group before invoking: return e}(t) -> return e})(t)
// Only the validate IIFE uses this exact pattern after our open patch.
const vCloseFrom = 'settings" object.`)}}return e}(t))';
const vCloseTo = 'settings" object.`)}}return e})(t))';
if (!c.includes(vCloseFrom)) throw new Error('validate close not found: ' + c.includes('return e}(t)'));
c = c.replace(vCloseFrom, vCloseTo);

// 2) Capture index fn: a=function(e){let t=new Map
//    -> a=(window.__TEKKZY_INDEX_CMS__=function(e){let t=new Map
const iOpenFrom = 'a=function(e){let t=new Map';
const iOpenTo = 'a=(window.__TEKKZY_INDEX_CMS__=function(e){let t=new Map';
if (!c.includes(iOpenFrom)) throw new Error('index open not found');
c = c.replace(iOpenFrom, iOpenTo);

// Close assignment group: sectionsByVariantMap:l})}(o) -> ...l})})(o)
const iCloseFrom = 'sectionsByVariantMap:l})}(o),{data:o,index:a})';
const iCloseTo = 'sectionsByVariantMap:l})})(o),{data:o,index:a})';
if (!c.includes(iCloseFrom)) throw new Error('index close not found');
c = c.replace(iCloseFrom, iCloseTo);

// 3) After successful setState, register apply + listener (statements, not commas)
const sFrom = 'c({data:l,index:f,loading:!1,error:null})}catch(i){';
const sTo =
  'c({data:l,index:f,loading:!1,error:null});' +
  'window.__TEKKZY_APPLY_CMS_DATA__=function(N){try{var O=r(window.__TEKKZY_VALIDATE_CMS__(N)),A=window.__TEKKZY_INDEX_CMS__(O);c({data:O,index:A,loading:!1,error:null});try{window.parent&&window.parent!==window&&window.parent.postMessage({type:"UPDATE_SUCCESS"},"*")}catch(X){}return!0}catch(E){return console.error("[DataProvider] live update",E),!1}};' +
  'window.__TEKKZY_CMS_LISTENER__||(window.__TEKKZY_CMS_LISTENER__=!0,window.addEventListener("message",function(ev){try{var d=ev&&ev.data;if(!d||"UPDATE_INSTITUTION_DATA"!==d.type||!d.data)return;window.__TEKKZY_APPLY_CMS_DATA__(d.data)}catch(E){}}));' +
  '}catch(i){';
if (!c.includes(sFrom)) throw new Error('setState hook not found');
c = c.replace(sFrom, sTo);

fs.writeFileSync(outPath, c);

try {
  // Turbopack wrapper uses browser globals — strip outer push for a light check
  new Function(c);
  console.log('parse: OK');
} catch (e) {
  console.log('parse: FAIL', e.message);
  // Still write file; show context around error if possible
}

console.log('written', outPath, 'len', c.length);
console.log('APPLY', c.includes('__TEKKZY_APPLY_CMS_DATA__'));
console.log('VALIDATE', c.includes('__TEKKZY_VALIDATE_CMS__'));
console.log('INDEX', c.includes('__TEKKZY_INDEX_CMS__'));
console.log('validate close ok', c.includes('return e})(t))'));
console.log('index close ok', c.includes('sectionsByVariantMap:l})})(o)'));
