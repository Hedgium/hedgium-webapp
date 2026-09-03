"use client";

import React, { useEffect, useRef } from "react";
import type { CredentialHelpItem } from "@/data/brokerCredentialHelp";
import { BROKER_CREDENTIAL_HELP } from "@/data/brokerCredentialHelp";

/** Renders URL-like patterns (e.g. prism.shoonya.com, https://...) in bold. */
function textWithBoldLinks(text: string): React.ReactNode {
  const urlRegex = /(https?:\/\/[^\s]+|[\w.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <strong key={key++} className="font-semibold">
        {match[0]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }
  parts.push(text.slice(lastIndex));
  return <>{parts}</>;
}

/** Renders **double-asterisk** segments as bold, then URLs inside plain segments. */
function renderStepText(text: string): React.ReactNode {
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  return segments.map((segment, i) => {
    if (
      segment.startsWith("**") &&
      segment.endsWith("**") &&
      segment.length > 4
    ) {
      const inner = segment.slice(2, -2);
      return (
        <strong key={i} className="font-semibold text-base-content">
          {inner}
        </strong>
      );
    }
    return <React.Fragment key={i}>{textWithBoldLinks(segment)}</React.Fragment>;
  });
}

const BROKER_DISPLAY_NAMES: Record<string, string> = {
  ZERODHA: "Zerodha",
  SHOONYA: "Shoonya",
  KOTAKNEO: "Kotak Neo",
  IIFLCAPITAL: "IIFL Capital",
  PROSTOCKS: "ProStocks",
};

type BrokerCredentialHelpModalProps = {
  open: boolean;
  onClose: () => void;
  brokerKey: string;
  /** When set, show only the help for this field (e.g. broker_user_id, api_key). */
  field?: string | null;
};

export default function BrokerCredentialHelpModal({
  open,
  onClose,
  brokerKey,
  field = null,
}: BrokerCredentialHelpModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = "broker-credential-help-heading";

  const allItems: CredentialHelpItem[] = brokerKey
    ? BROKER_CREDENTIAL_HELP[brokerKey] ?? []
    : [];
  const items = field
    ? allItems.filter((item) => item.field === field)
    : allItems;
  const brokerName = BROKER_DISPLAY_NAMES[brokerKey] ?? brokerKey;
  const singleItem = items.length === 1 ? items[0] : null;
  const modalHeading =
    singleItem?.modalTitle ??
    (singleItem ? `How to get ${singleItem.label}` : `How to get ${brokerName} credentials`);

  // showModal()/close() give us a native focus trap, Escape-to-close, an inert
  // background, and a ::backdrop — all for free, unlike the `open` attribute alone.
  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    if (open && !node.open) {
      node.showModal();
    } else if (!open && node.open) {
      node.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="modal z-[100]"
      aria-labelledby={headingId}
      onClose={onClose}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="modal-box relative z-[101] flex max-h-[85vh] w-11/12 max-w-3xl flex-col p-6">
        <h3 id={headingId} className="shrink-0 text-lg font-semibold text-base-content">
          {modalHeading}
        </h3>
        {items.length === 0 ? (
          <p className="mt-2 shrink-0 text-sm text-base-content/70">
            No guide available for this broker yet.
          </p>
        ) : (
          <div className="relative z-[1] mt-4 min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
            <div className="space-y-6 pb-2">
              {items.map((item) => (
                <section key={item.field}>
                  {items.length > 1 && (
                    <h4 className="mb-2 text-sm font-medium text-base-content/90">
                      {item.label}
                    </h4>
                  )}
                  {/*
                    list-inside: numbers stay inside the scroll box (list-outside is clipped by overflow-y-auto).
                    No flex on <li>: flex breaks native list markers in WebKit.
                  */}
                  <ol className="list-inside list-decimal space-y-3 text-sm text-base-content/80 marker:font-semibold marker:text-base-content">
                    {item.steps.map((step, i) => (
                      <li key={i} className="space-y-2 break-words">
                        <div>{renderStepText(step.text)}</div>
                        {step.imageUrl && (
                          <div className="rounded-lg border border-base-300 bg-base-200 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={step.imageUrl}
                              alt={typeof step.text === "string" ? step.text : "Broker credential setup screenshot"}
                              className="h-auto w-full object-contain"
                            />
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          </div>
        )}
        <div className="modal-action mt-4 shrink-0 border-t border-base-300 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-ghost normal-case focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}
