import React, { useState } from "react";
import { LegalLinks } from "./LegalLinks";
import { T, Button, Chips, Field } from "./UI";
import { AccountEntry } from "./Account";
import { currencyOptions, validCurrency } from "./ledger.cjs";
import { read, eraseWorkspace } from "./native";
export default function SettingsScreen({
  work,
  setDb,
  db,
  go,
  commit,
  intro,
  confirm,
}) {
  const [code, setCode] = useState("");
  const [currencyError, setCurrencyError] = useState("");
  return (
    <>
      <AccountEntry onOpen={() => go("Account")} />
      <T kind="strong">Business details for invoices</T>
      {[['name','Business name'],['address','Business address'],['email','Business email'],['phone','Business phone'],['taxId','Tax registration number'],['paymentDetails','Payment instructions']].map(([key,label])=><Field key={key} label={label} value={db.businessProfile?.[key] || ''} onChangeText={value=>commit(st=>({...st,businessProfile:{...(st.businessProfile || {}),[key]:value.slice(0,500)}}))}/>)}
      <T kind="label">Appearance</T>
      <Chips values={["System","Light","Dark"]} selected={db.appearance || "System"} onSelect={(appearance)=>commit(st=>({...st,appearance}))} />
      {intro(
        "Device workspace",
        "Your ledger and original receipts are stored on this device. Device backup settings can affect retention. Uninstalling can erase local records. Export regularly.",
      )}
      <LegalLinks work={work} />
      <T kind="label">Default currency for manual entries</T>
      <Chips
        values={currencyOptions(db)}
        selected={db.currency}
        onSelect={(v) => commit((st) => ({ ...st, currency: v }))}
      />
      <Field label="Add currency · 3-letter code (e.g. AED, SAR, CAD)" value={code} autoCapitalize="characters" maxLength={3} onChangeText={v=>{setCode(v.toUpperCase());setCurrencyError("");}} />
      {!!currencyError && <T>{currencyError}</T>}
      <Button quiet onPress={()=>{
        const value=code.trim().toUpperCase();
        if(!validCurrency(value)){setCurrencyError("Enter a three-letter currency code.");return;}
        if(currencyOptions(db).includes(value)){setCurrencyError("This currency is already available.");return;}
        if((db.customCurrencies || []).length>=200){setCurrencyError("Currency limit reached.");return;}
        commit(st=>({...st,customCurrencies:[...(st.customCurrencies || []),value],currency:value}));setCode("");
      }}>Add currency</Button>
      <T kind="note">Amounts currently support up to two decimal places for every currency code. No currency conversion is performed.</T>
      <T kind="note">
        Reports keep each currency separate. Reimbursement status is recorded by
        you.
      </T>
      <Button
        quiet
        onPress={() =>
          confirm(
            "Erase this workspace?",
            "All local projects, receipts and reports will be permanently removed. Export anything you need first.",
            "Erase everything",
            () =>
              work("Erasing workspace", async () => {
                await eraseWorkspace();
                setDb(read());
              }),
          )
        }
      >
        Erase workspace
      </Button>
    </>
  );
}
