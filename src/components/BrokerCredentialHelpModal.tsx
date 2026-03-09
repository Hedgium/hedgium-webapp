"use client";

import React from "react";
import { BROKER_CREDENTIAL_HELP } from "@/data/brokerCredentialHelp";
import type { CredentialHelpItem } from "@/data/brokerCredentialHelp";

const BROKER_DISPLAY_NAMES: Record<string, string> = {
  ZERODHA: "Zerodha",
  SHOONYA: "Shoonya",
  KOTAKNEO: "Kotak Neo",
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
  const allItems: CredentialHelpItem[] = brokerKey
    ? BROKER_CREDENTIAL_HELP[brokerKey] ?? []
    : [];
  const items = field
    ? allItems.filter((item) => item.field === field)
    : allItems;
  const brokerName = BROKER_DISPLAY_NAMES[brokerKey] ?? brokerKey;
  const titleLabel = items.length === 1 ? items[0].label : null;

  if (!open) return null;

  return (
    <dialog open className="modal modal-open">
      <div className="modal-box max-h-[85vh] overflow-y-auto w-11/12 max-w-lg">
        <h3 className="text-lg font-semibold text-base-content">
          {titleLabel
            ? `How to get ${titleLabel}`
            : `How to get ${brokerName} credentials`}
        </h3>
        {items.length === 0 ? (
          <p className="text-sm text-base-content/70 mt-2">
            No guide available for this broker yet.
          </p>
        ) : (
          <div className="mt-4 space-y-6">
            {items.map((item) => (
              <section key={item.field}>
                {items.length > 1 && (
                  <h4 className="text-sm font-medium text-base-content/90 mb-2">
                    {item.label}
                  </h4>
                )}
                <ol className="space-y-3">
                  {item.steps.map((step, i) => (
                    <li key={i} className="flex flex-col gap-2">
                      <span className="text-sm text-base-content/80">
                        {step.text}
                      </span>
                      {step.imageUrl && (
                        <span className="block rounded-lg border border-base-300 overflow-hidden bg-base-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={step.imageUrl}
                            alt=""
                            className="w-full h-auto object-contain"
                          />
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
        <div className="modal-action mt-4 pt-4 border-t border-base-300">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-ghost normal-case"
          >
            Close
          </button>
        </div>
      </div>
      <div
        className="modal-backdrop"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      />
    </dialog>
  );
}
