import { Conversation } from "@/types/message";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEFAULT_CONVERSATIONS = [
    {
        id: "1",
        name: "星穹列车一家人",
        messages: [
            {
                id: 1,
                text: "穹，今晚有空吗？我……有点难受了。",
                from: "遐蝶",
            },
            {
                id: 2,
                text: "当然，遐蝶小姐的邀请我怎会拒绝？",
                from: "开拓者",
                right: true,
            },
            {
                id: 3,
                text: "太好了！我在浴池等你~",
                from: "遐蝶",
            },
            {
                id: 4,
                text: "穿上我上次给你买的那件泳装哦~",
                from: "开拓者",
                right: true,
            },
            {
                id: 5,
                text: "嗯~我会的~",
                from: "遐蝶",
            },
            {
                id: 6,
                text: "今天……是安全期哦~",
                from: "遐蝶",
            },
            {
                id: 7,
                text: "……",
                from: "阿格莱雅",
            },
            {
                id: 8,
                text: "私密话题别在这里聊。",
                from: "阿格莱雅",
            },

            {
                id: 9,
                text: "阿格莱雅女士要不要也一起？",
                from: "开拓者",
                right: true,
            },
            {
                id: 10,
                text: "？",
                from: "阿格莱雅",
            },
        ],
    },
];

interface DBState {
    conversations: Conversation[];
    setConversations: (conversations: Conversation[] | ((prev: Conversation[]) => Conversation[])) => void;
    download: () => void;
    upload: (file: File) => Promise<void>;
    clear: () => void;
}

const useDBStore = create<DBState>()(
    persist(
        (set, get) => ({
            conversations: DEFAULT_CONVERSATIONS,

            setConversations: (conversations) => {
                if (typeof conversations === "function") {
                    set((state) => ({ conversations: conversations(state.conversations) }));
                } else {
                    set({ conversations });
                }
            },

            download: () => {
                const state = get();
                const dataStr = JSON.stringify(state.conversations, null, 2);
                const dataBlob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `conversations-${new Date().toISOString().split("T")[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            },

            upload: async (file: File) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const content = e.target?.result as string;
                            const conversations = JSON.parse(content) as Conversation[];
                            set({ conversations });
                            resolve();
                        } catch (error) {
                            reject(new Error("Invalid JSON file"));
                        }
                    };
                    reader.onerror = () => reject(new Error("Failed to read file"));
                    reader.readAsText(file);
                });
            },
            clear: () => {
                set({ conversations: DEFAULT_CONVERSATIONS });
            },
        }),
        {
            name: "conversations-storage",
        }
    )
);

export const useDB = () => {
    const conversations = useDBStore((state) => state.conversations);
    const setConversations = useDBStore((state) => state.setConversations);
    const download = useDBStore((state) => state.download);
    const upload = useDBStore((state) => state.upload);
    const clear = useDBStore((state) => state.clear);
    return { conversations, setConversations, download, upload, clear };
};
