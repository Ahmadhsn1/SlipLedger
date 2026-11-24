import React, {useState} from 'react';
import {T, Chips, Button, Field} from './UI';
import {eligible} from './ledger.cjs';
import {issueProjectInvoice} from './projectInvoice.cjs';
import {money,today,uid} from './native';
export default function ProjectInvoiceScreen({db,project,commit,work,finish}){
  const rows=eligible(db,project.id);
  const currencies=[...new Set(rows.map(x=>x.currency))];
  const [currency,setCurrency]=useState(currencies[0]);
  const [ids,setIds]=useState([]);
  const [due,setDue]=useState(today);
  const chosen=rows.filter(x=>x.currency===currency && ids.includes(x.id));
  function toggle(id){setIds(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);}
  return <>
    <T kind="title">Invoice project costs</T><T>{project.client} · {project.name}</T>
    <Chips values={currencies} selected={currency} onSelect={c=>{setCurrency(c);setIds([]);}}/>
    {rows.filter(x=>x.currency===currency).map(x=><Button key={x.id} quiet={!ids.includes(x.id)} onPress={()=>toggle(x.id)}>
      {ids.includes(x.id)?'Selected · ':''}{x.merchant} · {x.date} · {money(x.minor,currency)}
    </Button>)}
    <Field label="Due date · YYYY-MM-DD" value={due} onChangeText={setDue}/>
    {!!currency && <T kind="strong">Selected total {money(chosen.reduce((s,x)=>s+x.minor,0),currency)}</T>}
    <Button disabled={!chosen.length} onPress={()=>work('Creating invoice',()=>{
      const id=uid();
      commit(st=>issueProjectInvoice(st,project.id,ids,id,due));
      finish(id);
    })}>Create client invoice</Button>
  </>;
}
