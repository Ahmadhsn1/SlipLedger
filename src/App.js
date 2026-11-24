import SettingsScreen from "./SettingsScreen";
import ReviewScreen from "./ReviewScreen";
import ProjectInvoiceScreen from "./ProjectInvoiceScreen";
import InvoiceScreen from "./InvoiceScreen";
import LedgerScreen from "./LedgerScreen";
import { Account } from "./Account";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  useColorScheme,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { requireOptionalNativeModule } from "expo-modules-core";
import * as Picker from "expo-image-picker";
import * as Docs from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { T, Button, Chips, Field, Row, useTheme, ThemeContext, themes, resolveTheme } from "./UI";
import {
  read,
  change,
  uid,
  today,
  money,
  keep,
  receiptDir,
  removeFile,
  shareReport,
  checkInput,
  recoverWorkspace,
} from "./native";
import {
  currencies,
  categories,
  suggest,
  validate,
  cents,
  totals,
  eligible,
  report,
} from "./ledger.cjs";

const tabs = ["Ledger", "Projects", "Invoices", "Reports", "Settings"];
const cleanDraft = (project = "", currency = "") => ({
  merchant: "",
  date: today(),
  amount: "",
  currency,
  tax: "",
  category: "Other",
  project,
  billable: true,
  file: null,
});
const fail = (e) =>
  Alert.alert("Couldn’t finish", e.message || "Please try again.");
const summary = (items) =>
  totals(items)
    .map((x) => money(x.minor, x.currency))
    .join("  ·  ");
const confirm = (title, body, label, run) =>
  Alert.alert(title, body, [
    { text: "Cancel", style: "cancel" },
    { text: label, style: "destructive", onPress: run },
  ]);
function Main() {
  const [db, setDb] = useState(read),
    [stack, setStack] = useState([{ name: "Ledger" }]),
    [draft, setDraft] = useState(null),
    [client, setClient] = useState(""),
    [project, setProject] = useState(""),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("All"),
    [hint, setHint] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState("");
  const theme = resolveTheme(db.appearance, useColorScheme());
  const {color,s}=theme;
  const lock = useRef(false),
    scroll = useRef(null);
  const page = stack[stack.length - 1],
    name = page.name;
  const go = (name, id) => {
    setError("");
    setStack((v) => [...v, { name, id }]);
  };
  const back = () => {
    setError("");
    setStack((v) => (v.length > 1 ? v.slice(0, -1) : v));
  };
  const commit = (fn) => {
    const next = change(fn);
    setDb(next);
    return next;
  };
  const work = async (label, fn) => {
    if (lock.current) return false;
    lock.current = true;
    setBusy(label);
    try {
      await fn();
      return true;
    } catch (e) {
      fail(e);
      return false;
    } finally {
      lock.current = false;
      setBusy("");
    }
  };
  const field = (key, value) => {
    setError("");
    setDraft((d) => ({ ...d, [key]: value }));
  };
  const leave = () => {
    if (lock.current) return true;
    if (stack.length < 2) return false;
    if (name === "Review")
      confirm(
        "Discard changes?",
        "Your saved ledger will stay as it was.",
        "Discard",
        back,
      );
    else back();
    return true;
  };
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", leave);
    return () => sub.remove();
  });
  useEffect(() => scroll.current?.scrollTo({ y: 0, animated: false }), [page]);
  const proj = db.projects.find((x) => x.id === page.id);
  const expense = db.expenses.find((x) => x.id === page.id);
  const rep = db.reports.find((x) => x.id === page.id);
  const claimIndex = React.useMemo(
    () => new Map(db.reports.flatMap((r) => r.items.map((i) => [i.id, r]))),
    [db.reports],
  );
  const invoiced = React.useMemo(() => {
    const map = new Map();
    for (const doc of db.invoices || []) for (const item of doc.items || [])
      if (item.expenseId) map.set(item.expenseId,doc);
    return map;
  },[db.invoices]);
  const owner = (x) => claimIndex.get(x.id) || invoiced.get(x.id);
  const label = (x) =>
    x.workspace === "Personal" ? "Personal" : db.projects.find((p) => p.id === x.project)?.name || "Project";
  const status = (x) =>
    invoiced.has(x.id) ? "Invoiced" : x.billable ? owner(x)?.status || "Ready to claim" : "Internal";
  const outstanding = db.expenses.filter(
    (x) => x.billable && !invoiced.has(x.id) && status(x) !== "Reimbursed",
  );
  const newProject = () => {
    setClient("");
    setProject("");
    go("New project");
  };
  const add = (id) => {
    const scope = id ? "Business" : workspace;
    setDraft({...cleanDraft(id || "", db.currency || ""), workspace:scope, billable:scope==="Business"});
    setHint("");
    go("Add receipt");
  };
  async function source(mode) {
    let asset, ext, uri;
    if (mode === "Camera") {
      const permission = await Picker.requestCameraPermissionsAsync();
      if (!permission.granted)
        throw Error(
          "Camera access is off. Enable it in device settings or import a file.",
        );
      const result = await Picker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (result.canceled) return;
      asset = result.assets[0];
      ext = (asset.mimeType || "image/jpeg").split("/")[1];
      uri = asset.uri;
    } else if (mode === "Import") {
      const result = await Docs.getDocumentAsync({
        type: ["image/jpeg", "image/png", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      asset = result.assets[0];
      ext =
        { "image/jpeg": "jpeg", "image/png": "png", "application/pdf": "pdf" }[
          asset.mimeType
        ] || asset.name.split(".").pop().toLowerCase();
      uri = asset.uri;
    }
    if (uri && !["jpeg", "jpg", "png", "pdf", "heic"].includes(ext))
      throw Error("Choose a JPEG, PNG or PDF.");
    if (uri) await checkInput(uri);
    let fields = {},
      note = "";
    if (uri) {
      try {
        const result = await requireOptionalNativeModule(
          "FieldReader",
        ).recognize(uri, ext === "pdf");
        fields = suggest(result);
        note = "Check the suggested fields against the original receipt.";
      } catch {
        note =
          "Enter the details manually. The original will be attached when you save.";
      }
    }
    setDraft((d) => ({ ...d, ...fields, uri, ext }));
    setHint(note);
    setStack((v) => [...v.slice(0, -1), { name: "Review" }]);
  }
  async function save() {
    const msg = validate(draft);
    if (msg) {
      setError(msg);
      return;
    }
    const isEdit = !!draft.id;
    const file = draft.uri ? await keep(draft.uri, draft.ext) : draft.file;
    const x = {
      id: draft.id || uid(),
      merchant: draft.merchant.trim(),
      date: draft.date,
      minor: cents(draft.amount),
      taxMinor: draft.tax ? cents(draft.tax) : null,
      currency: draft.currency,
      category: draft.category,
      workspace: draft.workspace || "Business",
      billable: draft.workspace === "Personal" ? false : draft.billable,
      project: draft.workspace === "Personal" ? null : draft.project,
      file,
    };
    try {
      commit((state) => {
        if (x.workspace !== "Personal" && !state.projects.some((p) => p.id === x.project))
          throw Error("Choose an existing project.");
        if ((state.invoices||[]).some(d=>d.items?.some(i=>i.expenseId===x.id)) || state.reports.some((r) => r.items.some((i) => i.id === x.id)))
          throw Error("This receipt is already linked to a report or invoice.");
        return {
          ...state,
          expenses: isEdit
            ? state.expenses.map((e) => (e.id === x.id ? x : e))
            : [x, ...state.expenses],
        };
      });
    } catch (e) {
      if (draft.uri && file) await removeFile(file);
      throw e;
    }
    setWorkspace(x.workspace);
    back();
  }
  function checkSave() {
    if (
      !draft.id &&
      db.expenses.some(
        (x) =>
          x.merchant.toLowerCase() === draft.merchant.trim().toLowerCase() &&
          x.date === draft.date &&
          x.minor === cents(draft.amount) &&
          x.currency === draft.currency,
      )
    ) {
      Alert.alert(
        "Possible duplicate",
        "A receipt with the same merchant, date and total already exists.",
        [
          { text: "Review" },
          { text: "Save anyway", onPress: () => work("Saving receipt", save) },
        ],
      );
      return;
    }
    work("Saving receipt", save);
  }
  function createProject() {
    if (!client.trim() || !project.trim()) {
      setError("Enter a client and a project name.");
      return;
    }
    const p = { id: uid(), name: project.trim(), client: client.trim() };
    if (
      db.projects.some(
        (x) =>
          x.name.toLowerCase() === p.name.toLowerCase() &&
          x.client.toLowerCase() === p.client.toLowerCase(),
      )
    ) {
      setError("That client already has this project.");
      return;
    }
    commit((state) => ({ ...state, projects: [p, ...state.projects] }));
    if (stack.at(-2)?.name === "Review") field("project", p.id);
    back();
  }
  const rows = (items) =>
    items.map((x) => (
      <Row
        key={x.id}
        title={x.merchant}
        detail={[x.date,label(x),x.workspace === "Personal" ? null : status(x)].filter(Boolean).join(" · ")}
        amount={money(x.minor, x.currency)}
        onPress={() => go("Expense", x.id)}
      />
    ));
  const projectRows = (list) =>
    list.map((p) => (
      <Row
        key={p.id}
        title={p.name}
        detail={p.client}
        onPress={() => go("Project", p.id)}
      />
    ));
  const reportRows = (list) =>
    list.map((r) => (
      <Row
        key={r.id}
        title={r.project}
        detail={r.client + " · " + r.date + " · " + r.status}
        amount={summary(r.items)}
        onPress={() => go("Report", r.id)}
      />
    ));
  const intro = (title, body) => (
    <View style={s.panel}>
      <T kind="strong">{title}</T>
      <T kind="note">{body}</T>
    </View>
  );
  const [workspace, setWorkspace] = useState("Personal");
  const [limit, setLimit] = useState(40);
  useEffect(() => setLimit(40), [search, filter, page]);
  const workspaceExpenses=db.expenses.filter(x=>(x.workspace || "Business")===workspace);
  const filtered = workspaceExpenses.filter(
    (x) =>
      (filter === "All" || status(x) === filter) &&
      [x.merchant, label(x), x.category, x.date]
        .join(" ")
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  let content;
  if (name === "Invoices") content=<InvoiceScreen initialId={page.id} db={db} commit={commit} work={work} />;
  if (name === "Ledger")
    content = (
      <LedgerScreen
        workspace={workspace}
        setWorkspace={v=>{setWorkspace(v);setFilter("All");setSearch("");setLimit(40)}}
        workspaceExpenses={workspaceExpenses}
        outstanding={outstanding}
        db={db}
        search={search}
        setSearch={setSearch}
        filter={filter}
        setFilter={setFilter}
        add={add}
        filtered={filtered}
        rows={rows}
        intro={intro}
        limit={limit}
        setLimit={setLimit}
        summary={summary}
      />
    );
  if (name === "Projects")
    content = (
      <>
        <Button onPress={newProject}>＋ New project</Button>
        {projectRows(db.projects)}
        {!db.projects.length &&
          intro(
            "Organize expenses by job",
            "Create a client project to keep its receipts and reimbursement reports together.",
          )}
      </>
    );
  if (name === "New project")
    content = (
      <>
        <Field
          label="Client name"
          value={client}
          onChangeText={setClient}
          placeholder="e.g. Juniper Studio"
        />
        <Field
          label="Project name"
          value={project}
          onChangeText={setProject}
          placeholder="e.g. Autumn campaign"
        />
        <Button onPress={createProject}>Save project</Button>
      </>
    );
  if(name==="Invoice project costs" && proj) content=<ProjectInvoiceScreen db={db} project={proj} work={work} commit={commit} finish={id=>setStack([{name:"Invoices",id}])}/>;
  if (name === "Project" && proj) {
    const items = db.expenses.filter((x) => x.project === proj.id),
      ready = eligible(db, proj.id);
    content = (
      <>
        <T kind="note">{proj.client}</T>
        <T kind="title">{proj.name}</T>
        <View style={s.hero}>
          <T style={{ color: color.mint }}>Ready to claim</T>
          <T kind="title" style={{ color: "#fff" }}>
            {summary(ready) || "No new expenses"}
          </T>
        </View>
        <Button onPress={() => add(proj.id)}>Add receipt</Button>
        <Button disabled={!ready.length} onPress={()=>go("Invoice project costs",proj.id)}>Invoice selected expenses</Button>
        <Button
          quiet
          disabled={!ready.length}
          onPress={() => go("Prepare report", proj.id)}
        >
          Prepare client report
        </Button>
        <T kind="strong">Project receipts</T>
        {rows(items)}
      </>
    );
  }
  if (name === "Add receipt")
    content = (
      <>
        {intro(
          "Capture the original",
          "Photograph one receipt or import a JPEG, PNG or PDF up to 8 MB. Recognition runs on this device.",
        )}
        <Button onPress={() => work("Opening camera", () => source("Camera"))}>
          Take photo
        </Button>
        <Button
          quiet
          onPress={() => work("Reading receipt", () => source("Import"))}
        >
          Import image or PDF
        </Button>
        <Button quiet onPress={() => source("Manual")}>
          Enter manually
        </Button>
      </>
    );
  if (name === "Review" && draft)
    content = (
      <ReviewScreen
        draft={draft}
        hint={hint}
        field={field}
        newProject={newProject}
        work={work}
        db={db}
        checkSave={checkSave}
      />
    );
  if (name === "Expense" && expense) {
    const x = expense;
    content = (
      <>
        <T kind="title">{money(x.minor, x.currency)}</T>
        <T kind="strong">{x.merchant}</T>
        <T>
          {x.date} · {x.category}
        </T>
        <T>
          {x.workspace === "Personal" ? label(x) : label(x)+" · "+status(x)}
        </T>
        <T kind="note">
          Included tax:{" "}
          {x.taxMinor == null ? "Unspecified" : money(x.taxMinor, x.currency)}
        </T>
        {x.file ? (
          <Button
            quiet
            onPress={() =>
              work("Opening receipt", () =>
                Sharing.shareAsync(receiptDir + x.file),
              )
            }
          >
            View or share original
          </Button>
        ) : (
          <T kind="note">Entered manually · no original attached</T>
        )}
        {!owner(x) && (
          <>
            <Button
              onPress={() => {
                setDraft({
                  ...x,
                  amount: (x.minor / 100).toFixed(2),
                  tax: x.taxMinor == null ? "" : (x.taxMinor / 100).toFixed(2),
                });
                setHint("");
                go("Review");
              }}
            >
              Edit expense
            </Button>
            <Button
              quiet
              onPress={() =>
                confirm(
                  "Delete expense?",
                  "This removes the expense and its original receipt.",
                  "Delete",
                  () =>
                    work("Deleting expense", async () => {
                      commit((st) => ({
                        ...st,
                        expenses: st.expenses.filter((e) => e.id !== x.id),
                      }));
                      back();
                      if (x.file) await removeFile(x.file);
                    }),
                )
              }
            >
              Delete expense
            </Button>
          </>
        )}
      </>
    );
  }
  if (name === "Reports")
    content = (
      <>
        {intro(
          "Client reports",
          "Prepare a report from a project. Each billable receipt can appear in one report.",
        )}
        <Button onPress={() => go("Choose project")}>Prepare report</Button>
        {reportRows(db.reports)}
      </>
    );
  if (name === "Choose project")
    content = (
      <>
        {db.projects
          .filter((p) => eligible(db, p.id).length)
          .map((p) => (
            <Row
              key={p.id}
              title={p.name}
              detail={p.client}
              onPress={() => go("Prepare report", p.id)}
            />
          ))}
        {!db.projects.some((p) => eligible(db, p.id).length) &&
          intro(
            "Nothing ready to claim",
            "Save a client-billable expense first.",
          )}
      </>
    );
  if (name === "Prepare report" && proj) {
    const items = eligible(db, proj.id);
    content = (
      <>
        <T kind="strong">{proj.name}</T>
        <T>{proj.client}</T>
        <T kind="title">{summary(items)}</T>
        <T kind="note">
          Confirm these expenses before preparing the report. Preparing locks
          the included entries. Sharing and marking it sent are separate
          actions.
        </T>
        {rows(items)}
        <Button
          disabled={!items.length}
          onPress={() =>
            work("Preparing report", async () => {
              const id = uid();
              commit((st) => ({
                ...st,
                reports: [report(st, proj.id, id, today()), ...st.reports],
              }));
              setStack([{ name: "Reports" }, { name: "Report", id }]);
            })
          }
        >
          Confirm report
        </Button>
      </>
    );
  }
  if (name === "Report" && rep) {
    const next = { Prepared: "Sent", Sent: "Reimbursed" }[rep.status];
    content = (
      <>
        <T kind="cap">{rep.status.toUpperCase()}</T>
        <T kind="title">{rep.project}</T>
        <T>
          {rep.client} · {rep.date}
        </T>
        <T kind="strong">{summary(rep.items)}</T>
        {rep.items.map((x) => (
          <View key={x.id} style={s.row}>
            <T style={{ flex: 1 }}>{x.merchant}</T>
            <T>{money(x.minor, x.currency)}</T>
          </View>
        ))}
        <Button
          onPress={() =>
            work("Building evidence pack", () => shareReport(rep, "zip"))
          }
        >
          Share report + originals (.zip)
        </Button>
        {["pdf", "csv"].map((f) => (
          <Button
            key={f}
            quiet
            onPress={() =>
              work("Preparing " + f.toUpperCase(), () => shareReport(rep, f))
            }
          >
            Share {f.toUpperCase()}
          </Button>
        ))}
        {next && (
          <Button
            quiet
            onPress={() =>
              Alert.alert(
                "Mark as " + next.toLowerCase() + "?",
                next === "Sent"
                  ? "Confirm you sent this report to the client."
                  : "Confirm you received the full reimbursement.",
                [
                  { text: "Cancel" },
                  {
                    text: "Confirm",
                    onPress: () =>
                      commit((st) => ({
                        ...st,
                        reports: st.reports.map((r) =>
                          r.id === rep.id ? { ...r, status: next } : r,
                        ),
                      })),
                  },
                ],
              )
            }
          >
            Mark as {next.toLowerCase()}
          </Button>
        )}
        {rep.status === "Prepared" && (
          <Button
            quiet
            onPress={() =>
              confirm(
                "Discard prepared report?",
                "Its expenses will return to Ready to claim.",
                "Discard",
                () => {
                  commit((st) => ({
                    ...st,
                    reports: st.reports.filter((r) => r.id !== rep.id),
                  }));
                  back();
                },
              )
            }
          >
            Discard prepared report
          </Button>
        )}
      </>
    );
  }
  if (name === "Settings")
    content = (
      <SettingsScreen
        work={work}
        setDb={setDb}
        db={db}
        go={go}
        commit={commit}
        intro={intro}
        confirm={confirm}
      />
    );
  if (name === "Account")
    content = <Account work={work} reload={() => setDb(read())} />;
  return (
    <ThemeContext.Provider value={theme}><SafeAreaView style={{ flex: 1, backgroundColor: color.paper }}>
      <StatusBar barStyle={theme===themes.dark?"light-content":"dark-content"} backgroundColor={color.paper} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View
          style={{
            paddingHorizontal: 22,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Image
              accessible={false}
              source={theme === themes.dark ? require("../assets/bird-dark.png") : require("../assets/bird-light.png")}
              style={{ width: 30, height: 30, borderRadius: 8 }}
            />
            <T kind="strong">SlipLedger</T>
          </View>
          {stack.length > 1 && (
            <Button quiet disabled={!!busy} onPress={leave}>
              Back
            </Button>
          )}
        </View>
        <ScrollView
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            width: "100%",
            maxWidth: 740,
            alignSelf: "center",
            padding: 22,
            gap: 15,
            paddingBottom: 40,
          }}
        >
          <T kind="title" accessibilityRole="header">
            {name}
          </T>
          <View pointerEvents={busy ? "none" : "auto"} style={{ gap: 14 }}>
            {content}
          </View>
          {!!error && (
            <T accessibilityLiveRegion="polite" style={{ color: color.error }}>
              {error}
            </T>
          )}
          {!!busy && (
            <View accessibilityLiveRegion="polite" style={s.panel}>
              <ActivityIndicator />
              <T>{busy}…</T>
            </View>
          )}
        </ScrollView>
        {stack.length === 1 && (
          <View
            style={{
              flexDirection: "row",
              marginHorizontal: 7, marginBottom: 4, borderRadius: 14, overflow: "hidden", borderWidth: 1,
              borderColor: color.line,
              backgroundColor: color.white,
            }}
          >
            {tabs.map((t, i) => (
              <Pressable
                key={t}
                accessibilityRole="tab"
                accessibilityState={{ selected: name === t }}
                disabled={!!busy}
                onPress={() => setStack([{ name: t }])}
                style={{
                  flex: 1,
                  minHeight: 62,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  backgroundColor: name === t ? color.mint : color.white,
                }}
              >
                <T kind="strong">{["≡", "▤", "▥", "▧", "⚙"][i]}</T>
                <T kind="label">{t}</T>
              </Pressable>
            ))}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView></ThemeContext.Provider>
  );
}
export default function App() {
  const systemTheme=resolveTheme("System",useColorScheme());
  const {color}=systemTheme;
  const [ready, setReady] = useState(false);
  const [issue, setIssue] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let mounted = true;
    recoverWorkspace()
      .then(() => {
        if (mounted) setReady(true);
      })
      .catch(() => {
        if (mounted)
          setIssue(
            "Couldn’t open the device workspace. Check available storage and try again.",
          );
      });
    return () => {
      mounted = false;
    };
  }, [attempt]);
  return (
    <ThemeContext.Provider value={systemTheme}><SafeAreaProvider>
      {ready ? (
        <Main />
      ) : (
        <SafeAreaView
          style={{
            flex: 1,
            justifyContent: "center",
            padding: 24,
            gap: 14,
            backgroundColor: color.paper,
          }}
        >
          <T kind="title">SlipLedger</T>
          {issue ? (
            <>
              <T>{issue}</T>
              <Button
                onPress={() => {
                  setIssue("");
                  setAttempt((n) => n + 1);
                }}
              >
                Try again
              </Button>
            </>
          ) : (
            <ActivityIndicator accessibilityLabel="Opening workspace" />
          )}
        </SafeAreaView>
      )}
    </SafeAreaProvider></ThemeContext.Provider>
  );
}
