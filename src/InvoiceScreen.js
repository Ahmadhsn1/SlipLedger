import React, {useState} from 'react';
import {Alert, View} from 'react-native';
import {T, Field, Button, Chips, Row} from './UI';
import {cents, currencies} from './ledger.cjs';
import {balance, addInvoice, recordPayment, lineTotal} from './invoices.cjs';
import {today, money, uid, shareInvoice} from './native';

const blankLine = () => ({key:uid(), label:'', quantity:'1', price:''});
export default function InvoiceScreen({db,commit,work,initialId}) {
  const [kind,setKind]=useState('Invoice');
  const [draft,setDraft]=useState(null);
  const [selected,select]=useState(initialId || null);
  const [payment,setPayment]=useState('');
  const bill=kind==='Bill';
  const list=(db.invoices||[]).filter(x=>(x.kind||'Invoice')===kind);
  const current=list.find(x=>x.id===selected);
  function submit(operation,done){
    try{commit(operation);done();}catch(e){Alert.alert('Check entry',e.message);}
  }
  function start(){
    let n=list.length+1;
    const number=()=> 'INV-'+String(n).padStart(3,'0');
    while(list.some(x=>x.number.toUpperCase()===number()))n++;
    setDraft({id:uid(),kind,number:bill?'':number(),client:'',due:today(),currency:db.currency||'GBP',lines:[blankLine()]});
  }
  function set(key,value){setDraft(d=>({...d,[key]:value}));}
  function editLine(key,field,value){
    setDraft(d=>({...d,lines:d.lines.map(l=>l.key===key?{...l,[field]:value}:l)}));
  }
  if(draft){
    const items=draft.lines.map(l=>({label:l.label.trim(),qty:/^\d+$/.test(l.quantity)?Number(l.quantity):0,rate:cents(l.price)}));
    const total=lineTotal(items);
    function issue(){
      const {lines,...fields}=draft;
      const doc={...fields,number:fields.number.trim(),client:fields.client.trim(),items,total,description:items[0].label,payments:[]};
      submit(st=>addInvoice(st,doc),()=>{setDraft(null);select(doc.id);});
    }
    return <><T kind="title">{bill?'New supplier bill':'New invoice'}</T>
      <Field label="Document number" value={draft.number} onChangeText={v=>set('number',v)}/>
      <Field label={bill?'Supplier':'Client'} value={draft.client} onChangeText={v=>set('client',v)}/>
      <Field label="Due date · YYYY-MM-DD" value={draft.due} onChangeText={v=>set('due',v)}/>
      <Chips values={currencies} selected={draft.currency} onSelect={v=>set('currency',v)}/>
      {draft.lines.map((l,i)=><View key={l.key} style={{gap:8}}>
        <Field label={'Item '+(i+1)} value={l.label} onChangeText={v=>editLine(l.key,'label',v)}/>
        <Field label="Quantity" keyboardType="number-pad" value={l.quantity} onChangeText={v=>editLine(l.key,'quantity',v)}/>
        <Field label="Unit price" keyboardType="decimal-pad" value={l.price} onChangeText={v=>editLine(l.key,'price',v)}/>
        {draft.lines.length>1&&<Button quiet onPress={()=>set('lines',draft.lines.filter(row=>row.key!==l.key))}>Remove item</Button>}
      </View>)}
      <Button quiet disabled={items.length>=100} onPress={()=>set('lines',[...draft.lines,blankLine()])}>Add item</Button>
      <T kind="strong">Total {total==null?'—':money(total,draft.currency)}</T>
      <Button disabled={total==null} onPress={issue}>{bill?'Save bill':'Create invoice'}</Button>
      <Button quiet onPress={()=>setDraft(null)}>Cancel</Button></>;
  }
  if(current){
    const due=balance(current);
    const items=current.items||[{label:current.description,qty:1,rate:current.total}];
    return <><T kind="title">{current.client}</T><T>{current.number} · Due {current.due}</T>
      {items.map((l,i)=><T key={i}>{l.label} · {l.qty} × {money(l.rate,current.currency)}</T>)}
      <T>Total {money(current.total,current.currency)}</T><T kind="strong">{bill?'To pay':'To receive'} {money(due,current.currency)}</T>
      {current.payments.map(p=><T key={p.id}>{p.date} · {bill?'Paid':'Received'} {money(p.amount,current.currency)}</T>)}
      {due>0&&<><Field label="Payment amount" keyboardType="decimal-pad" value={payment} onChangeText={setPayment}/>
      <Button onPress={()=>{const p={id:uid(),date:today(),amount:cents(payment)};submit(st=>recordPayment(st,current.id,p),()=>setPayment(''));}}>Record payment</Button></>}
      <Button quiet onPress={()=>work('Preparing PDF',()=>shareInvoice(current))}>Share PDF</Button>
      <Button quiet onPress={()=>{select(null);setPayment('');}}>Back to list</Button></>;
  }
  return <><T kind="title">Invoices & bills</T><Chips values={['Client invoices','Supplier bills']} selected={bill?'Supplier bills':'Client invoices'} onSelect={v=>setKind(v==='Supplier bills'?'Bill':'Invoice')}/>
    <Button onPress={start}>{bill?'Add supplier bill':'Create invoice'}</Button>
    {!list.length&&<T>{bill?'No supplier bills yet.':'No client invoices yet.'}</T>}
    {list.map(i=><Row key={i.id} title={i.client} detail={i.number+' · '+(balance(i)===0?'Paid':i.payments.length?'Part paid':'Open')} amount={money(balance(i),i.currency)} onPress={()=>select(i.id)}/>)}</>;
}
