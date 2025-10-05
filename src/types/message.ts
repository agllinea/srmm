export type Message = {
    id: number;
    text: string;
    from: string;
    right?: boolean;
    delayBefore?: number;
    delayAfter?: number;
};

export type Conversation = {
    id: string;
    name: string;
    messages: Message[];
};