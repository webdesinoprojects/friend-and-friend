import ChatWorkspace from "../../components/chat/ChatWorkspace";
import AppShell from "../../components/layout/AppShell";

export default function ProviderChats() {
  return (
    <AppShell type="provider">
      <ChatWorkspace role="PROVIDER" />
    </AppShell>
  );
}
