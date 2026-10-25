import { getTranslations } from "next-intl/server";
import { PageGuard } from "@/components/layout/page-guard";
import { ChatScreen } from "@/features/chat/chat-screen";

export async function generateMetadata() {
  const t = await getTranslations("Nav.pages");
  return { title: t("chat") };
}

export default function ChatPage() {
  return (
    <PageGuard page="chat">
      <ChatScreen />
    </PageGuard>
  );
}
