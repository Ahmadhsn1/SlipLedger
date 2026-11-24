import React, { useState } from "react";
import { View, Alert } from "react-native";
import { cloud, backup, restore, deleteAccount } from "./cloud";
import { T, Field, Button, useTheme } from "./UI";
export function Account({ work, reload }) {
  const {s,color}=useTheme();
  const [email, setEmail] = useState(""),
    [code, setCode] = useState(""),
    [sent, setSent] = useState(false),
    [user, setUser] = useState(null);
  React.useEffect(() => {
    if (!cloud) return;
    const { data } = cloud.auth.onAuthStateChange((_, session) =>
      setUser(session?.user || null),
    );
    return () => data.subscription.unsubscribe();
  }, []);
  if (!cloud)
    return (
      <View style={s.panel}>
        <T kind="strong">Local workspace</T>
        <T kind="note">Cloud backup is unavailable in this build.</T>
      </View>
    );
  if (!user)
    return (
      <View style={s.panel}>
        <T kind="strong">Private cloud backup</T>
        <T kind="note">
          Sign in to back up or restore this device. A backup contains your
          ledger and original receipts.
        </T>
        <Field
          label="Email address"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setSent(false);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Button
          quiet
          onPress={() =>
            work("Requesting code", async () => {
              const { error } = await cloud.auth.signInWithOtp({
                email: email.trim(),
              });
              if (error) throw error;
              setSent(true);
            })
          }
        >
          {sent ? "Resend code" : "Email me a code"}
        </Button>
        {sent && (
          <>
            <Field
              label="Email code"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
            />
            <Button
              onPress={() =>
                work("Verifying", async () => {
                  const { error } = await cloud.auth.verifyOtp({
                    email: email.trim(),
                    token: code.trim(),
                    type: "email",
                  });
                  if (error) throw error;
                  setCode("");
                })
              }
            >
              Verify code
            </Button>
          </>
        )}
      </View>
    );
  return (
    <View style={s.panel}>
      <T kind="strong">{user.email}</T>
      <T kind="note">
        One private backup up to 24 MB. Backing up replaces the previous copy
        for this account.
      </T>
      <Button
        onPress={() =>
          Alert.alert(
            "Replace cloud backup?",
            "Upload this device’s ledger and original receipts to " +
              user.email +
              "?",
            [
              { text: "Cancel" },
              {
                text: "Back up",
                onPress: () =>
                  work("Backing up", async () => {
                    await backup(user.id);
                    Alert.alert("Backup saved");
                  }),
              },
            ],
          )
        }
      >
        Back up workspace
      </Button>
      <Button
        quiet
        onPress={() =>
          work("Restoring backup", async () => {
            await restore(user.id);
            reload();
            Alert.alert("Workspace restored");
          })
        }
      >
        Restore to empty workspace
      </Button>
      <Button
        quiet
        onPress={() =>
          work("Signing out", async () => {
            const { error } = await cloud.auth.signOut();
            if (error) throw error;
          })
        }
      >
        Sign out
      </Button>
      <Button
        quiet
        onPress={() =>
          Alert.alert(
            "Delete cloud account?",
            "This permanently deletes your cloud backup and login. Your local workspace stays on this device.",
            [
              { text: "Cancel" },
              {
                text: "Delete account",
                style: "destructive",
                onPress: () => work("Deleting account", deleteAccount),
              },
            ],
          )
        }
      >
        Delete cloud account
      </Button>
    </View>
  );
}
