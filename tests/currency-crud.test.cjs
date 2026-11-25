const test=require('node:test'),assert=require('node:assert/strict');
const {totals,suggest,currencyOptions}=require('../src/ledger.cjs');
const {addInvoice,updateInvoice,deleteInvoice,recordPayment,changePayment,balance}=require('../src/invoices.cjs');
const {verify}=require('../src/backup.cjs');
const empty=()=>({version:1,projects:[],expenses:[],reports:[],invoices:[],customCurrencies:['AED']});
const invoice=()=>({id:'invoice-1',kind:'Invoice',number:'INV-1',client:'Example',description:'Service',due:'2026-11-25',currency:'PKR',items:[{label:'Service',qty:1,rate:10000}],total:10000,payments:[]});
test('PKR and added currencies survive invoice backup and keep separate totals',()=>{
 const st=addInvoice(empty(),invoice());assert.equal(verify(st).invoices[0].currency,'PKR');
 assert.ok(currencyOptions(st).includes('AED'));
 assert.deepEqual(totals([{currency:'PKR',minor:100},{currency:'AED',minor:200}]),[{currency:'PKR',minor:100},{currency:'AED',minor:200}]);
 assert.equal(suggest('Shop\nTOTAL PKR 1,250.00').currency,'PKR');
 assert.equal(suggest('Shop\nTOTAL AED 10.00',currencyOptions(st)).currency,'AED');
});
test('invoice update, payment correction, deletion and balances',()=>{
 let st=addInvoice(empty(),invoice());st=recordPayment(st,'invoice-1',{id:'pay-1',amount:4000,date:'2026-11-25'});
 assert.throws(()=>deleteInvoice(st,'invoice-1'));
 assert.throws(()=>updateInvoice(st,{...st.invoices[0],currency:'AED'}));
 st=changePayment(st,'invoice-1','pay-1',{amount:5000,date:'2026-11-25'});assert.equal(balance(st.invoices[0]),5000);
 assert.throws(()=>changePayment(st,'invoice-1','pay-1',{amount:20000,date:'2026-11-25'}));
 st=updateInvoice(st,{...st.invoices[0],client:'Corrected'});assert.equal(st.invoices[0].client,'Corrected');
 st=changePayment(st,'invoice-1','pay-1',null);st=deleteInvoice(st,'invoice-1');assert.equal(st.invoices.length,0);
});
