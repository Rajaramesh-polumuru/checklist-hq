/**
 * Rich text parsing utilities for basic markdown formatting.
 * Supports:
 * - Bold: **text** or *text* (single asterisk for bold to match common usage)
 * - Italic: _text_ or <em>text</em>
 * - Links: [text](url)
 */
interface TextSegment {
    type: 'text' | 'bold' | 'italic' | 'link';
    content: string;
    href?: string;
}
/**
 * Parse markdown-style text into segments for rendering.
 * Handles bold (**text** or *text*), italic (_text_), and links [text](url).
 */
export declare function parseRichText(text: string): TextSegment[];
/**
 * Check if text contains any rich text formatting markers.
 */
export declare function hasRichText(text: string): boolean;
interface FormattedTextProps {
    text: string;
    className?: string;
}
/**
 * Renders text with basic markdown formatting.
 * For use in display contexts (not in input fields).
 */
export declare function FormattedText({ text, className }: FormattedTextProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=rich-text.d.ts.map