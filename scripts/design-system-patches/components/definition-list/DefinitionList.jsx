import { Children, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import { Heading } from "../heading/Heading.jsx";
import { IconButton } from "../icon-button/IconButton.jsx";
import "./definition-list.css";

const directions = ["row", "column"];
const sizes = ["sm", "md", "lg"];
const labelWidths = ["auto", "fixed"];

function textFromNode(node) {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join("");
  if (isValidElement(node)) return textFromNode(node.props.children);
  return "";
}

function writeClipboard(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).catch(() => writeClipboardFallback(text));
  }

  return writeClipboardFallback(text);
}

function writeClipboardFallback(text) {
  if (typeof document === "undefined") return Promise.reject(new Error("Clipboard unavailable"));

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.insetBlockStart = "0";
  textarea.style.insetInlineStart = "0";
  textarea.style.inlineSize = "1px";
  textarea.style.blockSize = "1px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    textarea.setSelectionRange(0, textarea.value.length);
    const copied = document.execCommand("copy");
    if (!copied) throw new Error("Copy command failed");
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  } finally {
    document.body.removeChild(textarea);
  }
}

function DefinitionValue({ item, inheritedHeadingProps }) {
  const headingProps = item.valueHeadingProps ?? inheritedHeadingProps;
  const value = item.value ?? item.children;

  if (!headingProps) return value;

  return (
    <Heading as="p" type="heading" size="md" {...headingProps}>
      {value}
    </Heading>
  );
}

function DefinitionCopyButton({ text, label = "Copy value", copiedLabel = "Copied" }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    };
  }, []);

  async function handleCopy() {
    await writeClipboard(text);
    setCopied(true);

    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      setCopied(false);
      resetTimer.current = null;
    }, 2000);
  }

  return (
    <IconButton
      className="a1-definition-list__copy"
      icon={copied ? "check" : "content_copy"}
      label={copied ? copiedLabel : label}
      onClick={handleCopy}
      variant="tertiary"
    />
  );
}

export function DefinitionList({
  items = [],
  direction = "row",
  size = "md",
  labelWidth = "auto",
  copyValue = false,
  copyLabel = "Copy value",
  copiedLabel = "Copied",
  valueHeadingProps,
  className = "",
  ...props
}) {
  const resolvedDirection = directions.includes(direction) ? direction : "row";
  const resolvedSize = sizes.includes(size) ? size : "md";
  const resolvedLabelWidth = labelWidths.includes(labelWidth) ? labelWidth : "auto";
  const normalizedItems = useMemo(() => items.filter(Boolean), [items]);

  const classes = [
    "a1-definition-list",
    `a1-definition-list--${resolvedDirection}`,
    `a1-definition-list--${resolvedSize}`,
    resolvedDirection === "row" && `a1-definition-list--label-${resolvedLabelWidth}`,
    className,
  ].filter(Boolean).join(" ");

  return (
    <dl className={classes} {...props}>
      {normalizedItems.map((item, index) => {
        const value = item.value ?? item.children;
        const textToCopy = item.copyText ?? textFromNode(Children.toArray(value));
        const shouldCopy = item.copyValue ?? copyValue;
        const itemKey = item.id ?? (
          typeof item.label === "string" || typeof item.label === "number" ? item.label : index
        );

        return (
          <div className="a1-definition-list__item" key={itemKey}>
            <dt className="a1-definition-list__label">{item.label}</dt>
            <dd className="a1-definition-list__value">
              <span className="a1-definition-list__value-content">
                <DefinitionValue item={item} inheritedHeadingProps={valueHeadingProps} />
              </span>
              {shouldCopy && textToCopy && (
                <DefinitionCopyButton
                  text={textToCopy}
                  label={item.copyLabel ?? copyLabel}
                  copiedLabel={item.copiedLabel ?? copiedLabel}
                />
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
