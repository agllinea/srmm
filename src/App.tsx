import MessageCreator from "@/components/MessageCreator";
import MessagePlayer, { MessagePlayerRef } from "@/components/MessagePlayer";
import { characters } from "@/config/character";
import { useDB } from "@/stores/db";
import { Conversation } from "@/types/message";
import { Button, Divider, Drawer, DrawerBody, DrawerContent, DrawerHeader, Select, SelectItem, Switch, useDisclosure } from "@heroui/react";
import { DownloadIcon, EditIcon, PlayIcon, RecycleIcon, SettingsIcon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";

import "./App.css";

export default function App() {
    const { conversations, setConversations, download, upload, clear } = useDB();
    const [conversation, setConversation] = useState<Conversation>();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [useGreenScreen, setUseGreenScreen] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onOpenChange: onDrawerOpenChange } = useDisclosure();
    const messagePlayerRef = useRef<MessagePlayerRef>(null);
    const handleSaveConversations = (conversations: Conversation[]) => {
        setConversations(conversations);
    };
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                await upload(file);
                // Optional: Show success message
                console.log("Upload successful");
            } catch (error) {
                // Optional: Show error message
                console.error("Upload failed:", error);
            }
        }
    };
    return (
        <>
            <MessagePlayer conversation={conversation} ref={messagePlayerRef} greenScreen={useGreenScreen} />
            <MessageCreator
                isOpen={isOpen}
                onOpen={onOpen}
                onOpenChange={onOpenChange}
                characters={characters}
                initialConversations={conversations}
                onSave={handleSaveConversations}
            />
            <Button
                isIconOnly
                className="absolute bottom-3 right-3 z-[9999999]"
                radius="full"
                variant="solid"
                onPress={onDrawerOpen}
            >
                <SettingsIcon size={16} />
            </Button>
            <Drawer isOpen={isDrawerOpen} onOpenChange={onDrawerOpenChange}>
                <DrawerContent>
                    {(onClose) => (
                        <>
                            <DrawerHeader className="flex flex-col gap-1">通用</DrawerHeader>
                            <DrawerBody>
                                <div className="flex flex-row justify-between items-center w-full">
                                    <span>
                                        <div>打开对话编辑器</div>
                                        {/* <div className="text-xs">123</div> */}
                                    </span>
                                    <Button isIconOnly onPress={onOpen} variant="flat" size="sm">
                                        <EditIcon size={16} />
                                    </Button>
                                </div>
                                <div className="flex flex-row justify-between items-center w-full">
                                    <span>
                                        <div>选择对话</div>
                                        {/* <div className="text-xs">123</div> */}
                                    </span>
                                    <Select
                                        aria-label="Select Conversation"
                                        size="sm"
                                        className="w-40"
                                        selectedKeys={conversation?.id ? new Set([conversation.id]) : new Set()}
                                        onSelectionChange={(keys) => {
                                            // keys is a Set, convert to array and get first value
                                            const selectedId = Array.from(keys)[0] as string;
                                            const tp = conversations.find((t) => t.id === selectedId);
                                            if (tp) {
                                                setConversation(tp);
                                            }
                                        }}
                                    >
                                        {conversations.map((t) => (
                                            <SelectItem key={t.id}>{t.name}</SelectItem>
                                        ))}
                                    </Select>
                                </div>
                                <div className="flex flex-row justify-between items-center w-full">
                                    <span>
                                        <div>开始播放对话</div>
                                        {/* <div className="text-xs">123</div> */}
                                    </span>
                                    <Button
                                        isIconOnly
                                        onPress={() => {
                                            onClose();
                                            messagePlayerRef.current?.playMessages();
                                        }}
                                        disabled={messagePlayerRef.current?.isPlaying}
                                        variant="flat"
                                        size="sm"
                                    >
                                        <PlayIcon size={16} />
                                    </Button>
                                </div>
                                <Divider />
                                <div className="flex flex-row justify-between items-center w-full">
                                    <span>
                                        <div>使用绿幕</div>
                                        {/* <div className="text-xs">123</div> */}
                                    </span>
                                    <Switch
                                        size="sm"
                                        isSelected={useGreenScreen}
                                        onValueChange={setUseGreenScreen}
                                    ></Switch>
                                </div>
                                <Divider />
                                <div className="flex flex-row justify-between items-center w-full">
                                    <span>
                                        <div>下载数据</div>
                                        {/* <div className="text-xs">123</div> */}
                                    </span>
                                    <Button
                                        onPress={() => {
                                            download();
                                        }}
                                        isIconOnly
                                        variant="flat"
                                        size="sm"
                                    >
                                        <DownloadIcon size={16} />
                                    </Button>
                                </div>
                                <div className="flex flex-row justify-between items-center w-full">
                                    <span>
                                        <div>上传数据</div>
                                        {/* <div className="text-xs">123</div> */}
                                    </span>
                                    <Button
                                        onPress={() => {
                                            fileInputRef.current?.click();
                                        }}
                                        isIconOnly
                                        variant="flat"
                                        size="sm"
                                    >
                                        <UploadIcon size={16} />
                                    </Button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="application/json"
                                        onChange={handleUpload}
                                        style={{ display: "none" }}
                                    />
                                </div>
                                <div className="flex flex-row justify-between items-center w-full">
                                    <span>
                                        <div>重置数据</div>
                                        {/* <div className="text-xs">123</div> */}
                                    </span>
                                    <Button onPress={() => clear()} isIconOnly variant="flat" size="sm">
                                        <RecycleIcon size={16} />
                                    </Button>
                                </div>
                            </DrawerBody>
                        </>
                    )}
                </DrawerContent>
            </Drawer>
        </>
    );
}
