import React from "react";
import { Image } from "react-native";
import { T, Button, Chips, Field } from "./UI";
import * as Sharing from "expo-sharing";
import { receiptDir } from "./native";
import { currencies, categories } from "./ledger.cjs";
export default function ReviewScreen({
  draft,
  hint,
  field,
  newProject,
  work,
  db,
  checkSave,
}) {
  return (
    <>
      {!!hint && <T kind="note">{hint}</T>}
      {(draft.uri || draft.file) &&
        !((draft.ext || draft.file?.split(".").pop()) === "pdf") && (
          <Image
            accessibilityLabel="Receipt original"
            resizeMode="contain"
            style={{
              height: 165,
              backgroundColor: "#e7e9e1",
              borderRadius: 12,
            }}
            source={{ uri: draft.uri || receiptDir + draft.file }}
          />
        )}
      {(draft.ext === "pdf" || draft.file?.endsWith(".pdf")) && (
        <Button
          quiet
          onPress={() =>
            work("Opening original", () =>
              Sharing.shareAsync(draft.uri || receiptDir + draft.file),
            )
          }
        >
          View or share original PDF
        </Button>
      )}
      <Field
        label="Merchant"
        value={draft.merchant}
        onChangeText={(v) => field("merchant", v)}
      />
      <Field
        label="Receipt date · YYYY-MM-DD"
        value={draft.date}
        onChangeText={(v) => field("date", v)}
      />
      <T kind="label">Receipt currency</T>
      <Chips
        values={currencies}
        selected={draft.currency}
        onSelect={(v) => field("currency", v)}
      />
      <Field
        label="Total including tax"
        keyboardType="decimal-pad"
        value={draft.amount}
        onChangeText={(v) => field("amount", v)}
      />
      <Field
        label="Included tax (optional)"
        keyboardType="decimal-pad"
        value={draft.tax}
        onChangeText={(v) => field("tax", v)}
      />
      <T kind="label">Workspace</T>
      <Chips values={["Personal","Business"]} selected={draft.workspace || "Business"} onSelect={v=>field("workspace",v)}/>
      {draft.workspace!=="Personal" && <><T kind="label">Project</T>
      {db.projects.map((p) => (
        <Button
          key={p.id}
          quiet={draft.project !== p.id}
          onPress={() => field("project", p.id)}
        >
          {p.name} · {p.client}
        </Button>
      ))}
      <Button quiet onPress={newProject}>
        ＋ New project
      </Button>
      </>}
      <T kind="label">Category</T>
      <Chips
        values={categories}
        selected={draft.category}
        onSelect={(v) => field("category", v)}
      />
      {draft.workspace!=="Personal" && <><T kind="label">Who covers this expense?</T>
      <Chips
        values={["Client", "My business"]}
        selected={draft.billable ? "Client" : "My business"}
        onSelect={(v) => field("billable", v === "Client")}
      />
      </>}
      <Button onPress={checkSave}>Confirm and save</Button>
    </>
  );
}
