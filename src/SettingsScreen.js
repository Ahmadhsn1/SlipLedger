import React from "react";
import { LegalLinks } from "./LegalLinks";
import { T, Button, Chips } from "./UI";
import { AccountEntry } from "./Account";
import { currencies } from "./ledger.cjs";
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
  return (
    <>
      <AccountEntry onOpen={() => go("Account")} />
      <T kind="label">Appearance</T>
      <Chips values={["System","Light","Dark"]} selected={db.appearance || "System"} onSelect={(appearance)=>commit(st=>({...st,appearance}))} />
      {intro(
        "Device workspace",
        "Your ledger and original receipts are stored on this device. Device backup settings can affect retention. Uninstalling can erase local records. Export regularly.",
      )}
      <LegalLinks work={work} />
      <T kind="label">Default currency for manual entries</T>
      <Chips
        values={currencies}
        selected={db.currency}
        onSelect={(v) => commit((st) => ({ ...st, currency: v }))}
      />
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
