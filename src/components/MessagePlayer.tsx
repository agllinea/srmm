import { characters } from "@/config/character";
import { Conversation, Message } from "@/types/message";
import { playSound } from "@/utils/sound";
import { AnimatePresence, motion } from "framer-motion";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

import "./MessagePlayer.css";

export type MessagePlayerProps = {
    conversation?: Conversation;
    greenScreen?: boolean;
};

export type MessagePlayerRef = {
    isPlaying: boolean;
    playMessages: () => Promise<void>;
};

const MessagePlayer = forwardRef<MessagePlayerRef, MessagePlayerProps>(({ conversation, greenScreen = false }, ref) => {
    const [rendered, setRendered] = useState<{ msg: Message; showText: boolean }[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    // find nearest ancestor that can scroll vertically
    const findScrollableParent = (el: Element | null): HTMLElement | null => {
        let cur = el as HTMLElement | null;
        while (cur && cur !== document.body) {
            const style = window.getComputedStyle(cur);
            const overflowY = style.overflowY || style.overflow;
            if (overflowY && /(auto|scroll|overlay)/.test(overflowY)) return cur;
            cur = cur.parentElement;
        }
        // fallback to the document scrolling element
        return (document.scrollingElement as HTMLElement) || document.documentElement;
    };

    // robust scroll-to-bottom
    const scrollToBottom = (smooth = true) => {
        const anchor = bottomRef.current;
        if (!anchor) return;

        const scroller = findScrollableParent(anchor);
        if (!scroller) return;

        const doScroll = () => {
            // target scroll position: set to full scrollHeight (browser will clamp to max)
            // using scrollTo + fallback assignment covers different browser behaviors
            try {
                scroller.scrollTo({ top: scroller.scrollHeight, behavior: smooth ? "smooth" : "auto" });
            } catch {
                // some older browsers may not support smooth option; fallback:
                scroller.scrollTop = scroller.scrollHeight;
            }
            // final fallback after a small delay to ensure it ended up at the bottom
            setTimeout(() => {
                scroller.scrollTop = scroller.scrollHeight;
            }, 160);
        };

        // run after layout paint and try again shortly after (handles content injection / images)
        requestAnimationFrame(() => {
            doScroll();
            setTimeout(doScroll, 40);
            setTimeout(doScroll, 200);
        });
    };

    const playMessages = async () => {
        if (!conversation) return;
        if (isPlaying) return;
        playSound("start");
        await new Promise((r) => setTimeout(r, 1000));
        setIsPlaying(true);
        setRendered([]);

        let lastUser: string | null = null;
        const SHORT_MESSAGE_THRESHOLD = 4; // Characters under this length skip typing animation

        for (let i = 0; i < conversation.messages.length; i++) {
            const m = conversation.messages[i];
            console.log(m);
            // Delay before showing message
            if (i === 0) {
                const initialDelay = m.delayBefore ?? 1000;
                await new Promise((r) => setTimeout(r, initialDelay));
            } else {
                const prev = conversation.messages[i - 1];
                let readDelay: number;

                if (m.delayBefore !== undefined) {
                    readDelay = m.delayBefore;
                } else {
                    readDelay = lastUser !== m.from ? Math.max(2000, prev.text.length * 50) : 2000;
                }
                console.log(readDelay);
                await new Promise((r) => setTimeout(r, readDelay));
            }
            lastUser = m.from;

            setRendered((p) => [...p, { msg: m, showText: false }]);

            let typingDelay: number;
            if (m.delayAfter !== undefined) {
                typingDelay = m.delayAfter;
            } else if (m.text.length < SHORT_MESSAGE_THRESHOLD) {
                typingDelay = 0; // No typing delay for short messages
            } else {
                typingDelay = Math.min(2000, Math.max(800, m.text.length * 100));
            }
            if (typingDelay !== 0) scrollToBottom();

            await new Promise((r) => setTimeout(r, typingDelay));

            playSound("send");
            setRendered((p) => p.map((it) => (it.msg.id === m.id ? { ...it, showText: true } : it)));
            scrollToBottom();
        }

        setIsPlaying(false);
    };

    // Expose isPlaying and playMessages through ref
    useImperativeHandle(
        ref,
        () => ({
            isPlaying,
            playMessages,
        }),
        [isPlaying, conversation]
    );

    return (
        <div id="MessagePlayer" className={greenScreen ? `bg-green` : ""}>
            <AnimatePresence>
                <div id="sr-message">
                    <div id="sr-message-border" />
                    <div id="sr-message-container">
                        <div id="sr-message-header">{conversation?.name}</div>
                        <div id="sr-message-content">
                            {rendered.map(({ msg, showText }) => (
                                <motion.div
                                    key={msg.id}
                                    className={`sr-message-item ${msg.right ? "right" : ""} ${
                                        !showText ? "loading" : ""
                                    }`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="sr-message-avatar-container">
                                        <img
                                            className="sr-message-avatar"
                                            src={characters[msg.from].avatar}
                                            alt="Avatar"
                                        />
                                    </div>
                                    <div className="sr-message-text-container">
                                        <div className="sr-message-username">{characters[msg.from].name}</div>
                                        {!showText && <LoadingDots />}
                                        {showText && (
                                            <motion.div
                                                className="sr-message-text"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                {msg.text}
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {/* bottom spacer / anchor */}
                            <div id="sr-message-bottom" ref={bottomRef} />
                        </div>

                        <div id="sr-message-footer" />
                    </div>
                </div>
            </AnimatePresence>
        </div>
    );
});

MessagePlayer.displayName = "MessagePlayer";

function LoadingDots({ color = "currentColor" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={48}
            height={Math.round(20)}
            viewBox="0 0 48 20"
            style={{ display: "block", color }}
            role="img"
            aria-label="Loading"
            className="mt-2"
        >
            {[0, 0.2, 0.4].map((delay, i) => (
                <circle key={i} cx={8 + i * 15} cy="10" r="6" fill="currentColor">
                    <animate
                        attributeName="opacity"
                        values="0.4;0.1;0.4"
                        dur="2s"
                        repeatCount="indefinite"
                        begin={`${delay}s`}
                    />
                </circle>
            ))}
        </svg>
    );
}

export default MessagePlayer;
