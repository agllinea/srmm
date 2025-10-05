import { Avatar, Button, Card, CardBody, CardHeader, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Modal, ModalBody, ModalContent, ModalHeader, Textarea } from "@heroui/react";
import clsx from "clsx";
import { ChevronDown, ChevronUp, Plus, SearchIcon, Trash2, User, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Character } from "../types/character";
import { Message, Conversation } from "../types/message";

type MessageCreatorProps = {
    characters: Record<string, Character>;
    initialConversations?: Conversation[];
    onSave: (conversations: Conversation[]) => void;
    isOpen: any;
    onOpen: any;
    onOpenChange: any;
};

export default function MessageCreator({
    isOpen,
    onOpenChange,
    characters,
    initialConversations = [],
    onSave,
}: MessageCreatorProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [characterFilter, setCharacterFilter] = useState<Record<number, string>>({});

    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (initialConversations.length > 0) {
                setConversations([...initialConversations]);
                setSelectedConversationId(initialConversations[0].id);
            } else {
                const newConversation: Conversation = {
                    id: Date.now().toString(),
                    name: "New Conversation",
                    messages: [],
                };
                setConversations([newConversation]);
                setSelectedConversationId(newConversation.id);
            }
        }
    }, [isOpen, initialConversations]);

    const selectedConversation = conversations.find((t) => t.id === selectedConversationId);

    const updateSelectedConversation = (updater: (conversation: Conversation) => Conversation) => {
        if (!selectedConversationId) return;
        setConversations(conversations.map((t) => (t.id === selectedConversationId ? updater(t) : t)));
    };

    const handleCreateConversation = () => {
        const newConversation: Conversation = {
            id: Date.now().toString(),
            name: `Conversation ${conversations.length + 1}`,
            messages: [],
        };
        setConversations([...conversations, newConversation]);
        setSelectedConversationId(newConversation.id);
    };

    const handleDeleteConversation = (id: string) => {
        const filtered = conversations.filter((t) => t.id !== id);
        setConversations(filtered);
        if (selectedConversationId === id) {
            setSelectedConversationId(filtered.length > 0 ? filtered[0].id : null);
        }
    };

    const handleConversationNameChange = (id: string, name: string) => {
        setConversations(conversations.map((t) => (t.id === id ? { ...t, name } : t)));
    };

    const handleMessageTextChange = (msgId: number, text: string) => {
        updateSelectedConversation((conversation) => ({
            ...conversation,
            messages: conversation.messages.map((m) => (m.id === msgId ? { ...m, text } : m)),
        }));
    };

    const handleCharacterChange = (msgId: number, from: string) => {
        updateSelectedConversation((conversation) => ({
            ...conversation,
            messages: conversation.messages.map((m) => (m.id === msgId ? { ...m, from } : m)),
        }));
    };

    const handleSetUserAlignment = (msgId: number) => {
        if (!selectedConversation) return;
        const targetMsg = selectedConversation.messages.find((m) => m.id === msgId);
        if (!targetMsg) return;

        const targetFrom = targetMsg.from;
        updateSelectedConversation((conversation) => ({
            ...conversation,
            messages: conversation.messages.map((m) =>
                m.from === targetFrom ? { ...m, right: true } : { ...m, right: undefined }
            ),
        }));
    };

    const handleDeleteMessage = (msgId: number) => {
        updateSelectedConversation((conversation) => ({
            ...conversation,
            messages: conversation.messages.filter((m) => m.id !== msgId),
        }));
    };

    const handleMoveMessage = (index: number, direction: "up" | "down") => {
        if (!selectedConversation) return;
        const messages = [...selectedConversation.messages];
        const targetIndex = direction === "up" ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= messages.length) return;

        [messages[index], messages[targetIndex]] = [messages[targetIndex], messages[index]];
        updateSelectedConversation((conversation) => ({ ...conversation, messages }));
    };

    const handleAddMessage = () => {
        if (!selectedConversation) return;

        const lastMsg = selectedConversation.messages[selectedConversation.messages.length - 1];
        const newMessage: Message = {
            id: Math.max(0, ...selectedConversation.messages.map((m) => m.id)) + 1,
            text: "",
            from: lastMsg?.from || Object.keys(characters)[0],
            ...(lastMsg?.right && { right: true }),
            ...(lastMsg?.delayBefore !== undefined && { delayBefore: lastMsg.delayBefore }),
            ...(lastMsg?.delayAfter !== undefined && { delayAfter: lastMsg.delayAfter }),
        };

        updateSelectedConversation((conversation) => ({
            ...conversation,
            messages: [...conversation.messages, newMessage],
        }));

        scrollToBottom();
    };

    const handleSave = () => {
        onSave(conversations);
        // onClose();
    };

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: "instant" });
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="full" hideCloseButton>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="text-xl flex flex-row items-center justify-between border-b-1 border-default">
                            <span>对话编辑器</span>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => {
                                    handleSave();
                                    onClose();
                                }}
                            >
                                <XIcon size={16} />
                            </Button>
                        </ModalHeader>
                        <ModalBody className="flex flex-row  overflow-hidden p-0 gap-0">
                            <div className="w-1/5 border-r-1 border-default">
                                <div className="flex flex-rol justify-between align-middle items-center h-16 px-6 border-b-1 border-default">
                                    <span className="text-xl">对话</span>
                                    <Button isIconOnly onPress={handleCreateConversation} variant="light">
                                        <Plus />
                                    </Button>
                                </div>
                                <div className="flex flex-col px-1 py-1">
                                    {conversations.map((conversation) => (
                                        <Button
                                            key={conversation.id}
                                            radius="none"
                                            variant="light"
                                            className={clsx([
                                                selectedConversationId === conversation.id ? "bg-primary-100" : "",
                                                "justify-between",
                                            ])}
                                            onPress={() => setSelectedConversationId(conversation.id)}
                                        >
                                            <span className="text-left overflow-hidden text-ellipsis">
                                                {conversation.name}
                                            </span>
                                            <div className="mc-conversation-info">
                                                <span className="text-xs opacity-50 pl-4 pr-2">
                                                    {conversation.messages.length} msgs
                                                </span>
                                                <Button
                                                    isIconOnly
                                                    radius="full"
                                                    variant="light"
                                                    size="sm"
                                                    onPress={() => handleDeleteConversation(conversation.id)}
                                                    color="danger"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col">
                                {selectedConversation ? (
                                    <>
                                        <div className="flex flex-rol justify-between align-middle items-center h-16 px-6 border-b-1 border-default">
                                            <input
                                                type="text"
                                                className="h-16 bg-transparent text-lg flex-1 border-none outline-none focus:ring-0"
                                                value={selectedConversation.name}
                                                onChange={(e) =>
                                                    handleConversationNameChange(selectedConversation.id, e.target.value)
                                                }
                                            />
                                            <Button
                                                isIconOnly
                                                className=""
                                                onPress={handleAddMessage}
                                                startContent={<Plus />}
                                                variant="flat"
                                                color="primary"
                                            ></Button>
                                        </div>
                                        <div className="flex-1 overflow-auto h-full box-border">
                                            {selectedConversation.messages.map((msg, index) => (
                                                <Card
                                                    key={msg.id}
                                                    shadow="sm"
                                                    radius="none"
                                                    className={`m-2 ${msg.right ? "right" : ""}`}
                                                >
                                                    <CardHeader className="flex flex-row justify-between pb-0">
                                                        <div className="mc-message-character">
                                                            <Dropdown
                                                                placement="bottom-start"
                                                                onOpenChange={(isOpen) => {
                                                                    if (!isOpen) {
                                                                        setCharacterFilter((prev) => ({
                                                                            ...prev,
                                                                            [msg.id]: "",
                                                                        }));
                                                                    }
                                                                }}
                                                            >
                                                                <DropdownTrigger>
                                                                    <Button
                                                                        variant="light"
                                                                        className="w-60 justify-start items-center gap-4 pl-3"
                                                                        size="lg"
                                                                    >
                                                                        <Avatar
                                                                            src={characters[msg.from].avatar}
                                                                            name={characters[msg.from].name}
                                                                            isBordered
                                                                        />
                                                                        <span className="mc-character-name">
                                                                            {characters[msg.from].name}
                                                                        </span>
                                                                    </Button>
                                                                </DropdownTrigger>
                                                                <DropdownMenu
                                                                    aria-label="Character selection"
                                                                    variant="flat"
                                                                    selectionMode="single"
                                                                    selectedKeys={[msg.from]}
                                                                    onAction={(key) =>
                                                                        handleCharacterChange(msg.id, key as string)
                                                                    }
                                                                    topContent={
                                                                        <div className="sticky top-0 bg-white z-10 px-2 pt-2 pb-3 border-b border-default">
                                                                            <Input
                                                                                placeholder="Search characters..."
                                                                                variant="flat"
                                                                                size="sm"
                                                                                value={characterFilter[msg.id] || ""}
                                                                                onValueChange={(value) => {
                                                                                    setCharacterFilter((prev) => ({
                                                                                        ...prev,
                                                                                        [msg.id]: value,
                                                                                    }));
                                                                                }}
                                                                                startContent={<SearchIcon size={16} />}
                                                                                isClearable
                                                                                onClear={() =>
                                                                                    setCharacterFilter((prev) => ({
                                                                                        ...prev,
                                                                                        [msg.id]: "",
                                                                                    }))
                                                                                }
                                                                            />
                                                                        </div>
                                                                    }
                                                                    classNames={{
                                                                        base: "max-h-[400px] min-w-[280px]",
                                                                        list: "gap-1 p-2 overflow-auto",
                                                                    }}
                                                                >
                                                                    {Object.entries(characters)
                                                                        .filter(([, char]) => {
                                                                            const filterText =
                                                                                characterFilter[msg.id] || "";
                                                                            return char.name
                                                                                .toLowerCase()
                                                                                .includes(filterText.toLowerCase());
                                                                        })
                                                                        .map(([key, char]) => (
                                                                            <DropdownItem
                                                                                key={key}
                                                                                startContent={
                                                                                    <Avatar
                                                                                        src={char.avatar}
                                                                                        name={char.name}
                                                                                        size="sm"
                                                                                    />
                                                                                }
                                                                                classNames={{
                                                                                    base: "py-2 data-[selected=true]:bg-primary-100",
                                                                                }}
                                                                            >
                                                                                {char.name}
                                                                            </DropdownItem>
                                                                        ))}
                                                                </DropdownMenu>
                                                            </Dropdown>
                                                        </div>
                                                        <div className="flex flex-row align-middle items-center">
                                                            <Input
                                                                type="number"
                                                                label="Delay Before (ms)"
                                                                labelPlacement="outside-left"
                                                                value={
                                                                    msg.delayBefore !== undefined
                                                                        ? String(msg.delayBefore)
                                                                        : ""
                                                                }
                                                                size="sm"
                                                                onChange={(e) => {
                                                                    const val =
                                                                        e.target.value === ""
                                                                            ? undefined
                                                                            : Number(e.target.value);
                                                                    updateSelectedConversation((conversation) => ({
                                                                        ...conversation,
                                                                        messages: conversation.messages.map((m) =>
                                                                            m.id === msg.id
                                                                                ? { ...m, delayBefore: val }
                                                                                : m
                                                                        ),
                                                                    }));
                                                                }}
                                                                placeholder="Auto"
                                                            />
                                                            <Input
                                                                size="sm"
                                                                type="number"
                                                                label="Delay After (ms)"
                                                                labelPlacement="outside-left"
                                                                value={
                                                                    msg.delayAfter !== undefined
                                                                        ? String(msg.delayAfter)
                                                                        : ""
                                                                }
                                                                onChange={(e) => {
                                                                    const val =
                                                                        e.target.value === ""
                                                                            ? undefined
                                                                            : Number(e.target.value);
                                                                    updateSelectedConversation((conversation) => ({
                                                                        ...conversation,
                                                                        messages: conversation.messages.map((m) =>
                                                                            m.id === msg.id
                                                                                ? { ...m, delayAfter: val }
                                                                                : m
                                                                        ),
                                                                    }));
                                                                }}
                                                                placeholder="Auto"
                                                            />
                                                            <Button
                                                                isIconOnly
                                                                variant="light"
                                                                onPress={() => handleMoveMessage(index, "up")}
                                                                disabled={index === 0}
                                                                title="Move up"
                                                            >
                                                                <ChevronUp size={16} />
                                                            </Button>
                                                            <Button
                                                                isIconOnly
                                                                variant="light"
                                                                onPress={() => handleMoveMessage(index, "down")}
                                                                disabled={index === selectedConversation.messages.length - 1}
                                                                title="Move down"
                                                            >
                                                                <ChevronDown size={16} />
                                                            </Button>
                                                            <Button
                                                                isIconOnly
                                                                variant={msg.right ? "flat" : "light"}
                                                                color={msg.right ? "primary" : "default"}
                                                                onPress={() => handleSetUserAlignment(msg.id)}
                                                                title="Set as user message (align right)"
                                                            >
                                                                <User size={16} />
                                                            </Button>
                                                            <Button
                                                                isIconOnly
                                                                variant="light"
                                                                color="danger"
                                                                onPress={() => handleDeleteMessage(msg.id)}
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        </div>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <Textarea
                                                            value={msg.text}
                                                            onChange={(e) =>
                                                                handleMessageTextChange(msg.id, e.target.value)
                                                            }
                                                            placeholder="Type message here..."
                                                            fullWidth
                                                            variant="flat"
                                                        />
                                                    </CardBody>
                                                </Card>
                                            ))}
                                            <div ref={bottomRef} className="h-5"></div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full opacity-50">
                                        Create a conversation to start
                                    </div>
                                )}
                            </div>
                        </ModalBody>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
