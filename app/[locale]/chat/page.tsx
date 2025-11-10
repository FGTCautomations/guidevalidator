export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getUserConversations } from "@/lib/chat/queries";
import { ConversationList } from "@/components/chat/conversation-list";

export const metadata = {
  title: "Messages | Guide Validator",
  description: "View and manage your conversations",
};

type ChatPageProps = {
  params: { locale: string };
};

export default async function ChatPage({ params }: ChatPageProps) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${params.locale}/auth/sign-in`);
  }

  const conversations = await getUserConversations(supabase, user.id);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      <div className="w-80 flex-shrink-0">
        <ConversationList
          conversations={conversations}
          currentUserId={user.id}
          locale={params.locale}
        />
      </div>
      <div className="flex flex-1 items-center justify-center text-foreground/60">
        <div className="text-center space-y-2">
          <div className="text-4xl">💬</div>
          <p className="text-sm">Select a conversation to start messaging</p>
        </div>
      </div>
    </div>
  );
}
