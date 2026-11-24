import "react-native-url-polyfill/auto";
import { sessionStorage } from "./session";
import { createClient } from "@supabase/supabase-js";
import * as FS from "expo-file-system/legacy";
import JSZip from "jszip";
import { decode, encode } from "base64-arraybuffer";
import { receiptDir, change, read, uid } from "./native";
import { verify } from "./backup.cjs";
const url = process.env.EXPO_PUBLIC_SUPABASE_URL,
  key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const cloud =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: sessionStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null;
const LIMIT = 24 * 1024 * 1024;
function check(result) {
  if (result.error) throw result.error;
  return result.data;
}
export async function backup(userId) {
  const state = verify(read());
  const zip = new JSZip();
  let size = 0;
  zip.file("workspace.json", JSON.stringify(state));
  for (const x of state.expenses.filter((x) => x.file)) {
    const path = receiptDir + x.file,
      info = await FS.getInfoAsync(path);
    if (!info.exists)
      throw Error(
        "An original receipt is missing. Your previous backup was preserved.",
      );
    size += info.size;
    if (size > LIMIT) throw Error("Workspace exceeds the 24 MB backup limit.");
    zip.file(x.file, await FS.readAsStringAsync(path, { encoding: "base64" }), {
      base64: true,
    });
  }
  const data = await zip.generateAsync({
    type: "arraybuffer",
    compression: "STORE",
  });
  if (data.byteLength > LIMIT)
    throw Error("Workspace exceeds the 24 MB backup limit.");
  check(
    await cloud.storage
      .from("workspaces")
      .upload(userId + "/backup.zip", data, {
        contentType: "application/zip",
        upsert: true,
      }),
  );
}
const hasRecords = state => ["projects","expenses","reports","invoices"].some(key => state[key]?.length);
export async function restore(userId) {
  if (hasRecords(read()))
    throw Error("Restore requires an empty local workspace.");
  const { signedUrl } = check(
    await cloud.storage
      .from("workspaces")
      .createSignedUrl(userId + "/backup.zip", 60),
  );
  const temp = FS.cacheDirectory + uid() + ".zip";
  const staged = [];
  try {
    const res = await FS.downloadAsync(signedUrl, temp);
    if (res.status !== 200)
      throw Error("No readable backup was found for this account.");
    const info = await FS.getInfoAsync(temp);
    if (!info.exists || info.size > LIMIT)
      throw Error("Backup size exceeds the supported limit.");
    const zip = await JSZip.loadAsync(
      decode(await FS.readAsStringAsync(temp, { encoding: "base64" })),
    );
    const entries = Object.values(zip.files);
    if (
      entries.some(
        (e) => e.dir || e._data?.compression?.magic !== "\x00\x00",
      ) ||
      entries.reduce((s, e) => s + (e._data?.uncompressedSize || 0), 0) > LIMIT
    )
      throw Error("Unsupported backup encoding.");
    const state = verify(
      JSON.parse(await zip.file("workspace.json").async("string")),
    );
    await FS.makeDirectoryAsync(receiptDir, { intermediates: true });
    for (const x of state.expenses.filter((x) => x.file)) {
      const entry = zip.file(x.file);
      if (!entry) throw Error("The backup is missing a receipt.");
      const dest = receiptDir + x.file;
      staged.push(dest);
      await FS.writeAsStringAsync(
        dest,
        encode(await entry.async("arraybuffer")),
        { encoding: "base64" },
      );
    }
    change((old) => {
      if (hasRecords(old))
        throw Error("Local workspace changed.");
      return state;
    });
  } catch (e) {
    await Promise.all(
      staged.map((p) => FS.deleteAsync(p, { idempotent: true })),
    );
    throw e;
  } finally {
    await FS.deleteAsync(temp, { idempotent: true });
  }
}
export async function deleteAccount() {
  const { error } = await cloud.functions.invoke("delete-account", {
    body: {},
  });
  if (error) throw error;
  await cloud.auth.signOut({ scope: "local" });
}
