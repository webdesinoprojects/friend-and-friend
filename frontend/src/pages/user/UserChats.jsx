import ChatWorkspace from "../../components/chat/ChatWorkspace";
import UserAppLayout from "../../components/users/UserAppLayout";

export default function UserChats() {
  return (
    <UserAppLayout title="Chat">
      <ChatWorkspace role="USER" />
    </UserAppLayout>
  );
}
