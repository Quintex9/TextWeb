
type emojiPickerProps = {
    onSelectEmoji: (emoji: string) => void;
};

export default function EmojiPicker({ onSelectEmoji }: emojiPickerProps) {
    const emojis = ["😀", "😂", "😍", "😎", "🤔", "😢", "👍", "🎉"]

    return (
        <div className="absolute bottom-12 right-0 bg-gray-200 border border-gray-300 rounded-xl grid grid-cols-5 shadow ">
            {emojis.map((emoji,index) => (
                <button
                    key={index}
                    onClick={() => onSelectEmoji(emoji)}
                    className="text-xl hover:scale-125">
                    {emoji}
                </button>
            ))}

        </div>
    )
};