import React from "react";
import WorkspaceSlider from "./WorkspaceSlider";
import { View } from "react-native";
import { T, Button, Chips, Field, useTheme } from "./UI";

export default function LedgerScreen({
  workspace, setWorkspace, workspaceExpenses, outstanding,
  db,
  search,
  setSearch,
  filter,
  setFilter,
  add,
  filtered,
  rows,
  intro,
  limit,
  setLimit,
  summary,
}) {
  const { s, color } = useTheme();
  return (
    <>
      <WorkspaceSlider selected={workspace} onSelect={setWorkspace} />
      <View style={s.hero}>
        <T kind="label" style={{ color: "#eff1ff" }}>
          {workspace === "Personal" ? "Personal spending" : "Outstanding reimbursement"}
        </T>
        <T kind="title" style={{ color: "#fff" }}>
          {workspace === "Personal" ? summary(workspaceExpenses) || "No expenses yet" : summary(outstanding) || "No open balance"}
        </T>
        <T style={{ color: "#eff1ff" }}>
          {workspace === "Personal" ? "All recorded personal expenses" : outstanding.length + " billable receipts awaiting reimbursement"}
        </T>
      </View>
      <Button onPress={() => add()}>＋ Add receipt</Button>
      <T kind="strong">Expenses</T>
      {workspaceExpenses.length > 0 ? (
        <>
          <Field
            label="Search expenses"
            placeholder="Merchant, project or category"
            value={search}
            onChangeText={setSearch}
          />
          {workspace === "Business" && <Chips
            values={[
              "All",
              "Ready to claim",
              "Invoiced",
              "Prepared",
              "Sent",
              "Reimbursed",
              "Internal",
            ]}
            selected={filter}
            onSelect={setFilter}
          />}
          {rows(filtered.slice(0, limit))}
          {filtered.length > limit && (
            <Button quiet onPress={() => setLimit((v) => v + 40)}>
              Show more expenses
            </Button>
          )}
          {!filtered.length && <T>No matching expenses.</T>}
        </>
      ) : (
        intro(
          "Your ledger is empty",
          "Add an expense manually or scan your first receipt. You can review every amount before saving it.",
        )
      )}
    </>
  );
}
