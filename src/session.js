import * as Secure from "expo-secure-store";
import { uid } from "./native";
const options = { keychainAccessible: Secure.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
const prefix = "fieldtab.auth.";
async function manifest(key) {
  const value = await Secure.getItemAsync(prefix + key, options);
  return value ? JSON.parse(value) : null;
}
async function discard(key, index) {
  if (!index) return;
  await Promise.all(
    Array.from({ length: index.count }, (_, i) =>
      Secure.deleteItemAsync(prefix + key + "." + index.id + "." + i, options),
    ),
  );
}
export const sessionStorage = {
  async getItem(key) {
    const index = await manifest(key);
    if (!index) return null;
    const chunks = await Promise.all(
      Array.from({ length: index.count }, (_, i) =>
        Secure.getItemAsync(prefix + key + "." + index.id + "." + i, options),
      ),
    );
    return chunks.every((s) => s != null)
      ? decodeURIComponent(chunks.join(""))
      : null;
  },
  async setItem(key, value) {
    const old = await manifest(key),
      encoded = encodeURIComponent(value),
      id = uid(),
      chunks = encoded.match(/.{1,1500}/g) || [""];
    const index = { id, count: chunks.length };
    try {
      await Promise.all(
        chunks.map((c, i) =>
          Secure.setItemAsync(prefix + key + "." + id + "." + i, c, options),
        ),
      );
      await Secure.setItemAsync(prefix + key, JSON.stringify(index), options);
    } catch (e) {
      await discard(key, index);
      throw e;
    }
    await discard(key, old);
  },
  async removeItem(key) {
    const old = await manifest(key);
    await Secure.deleteItemAsync(prefix + key, options);
    await discard(key, old);
  },
};
