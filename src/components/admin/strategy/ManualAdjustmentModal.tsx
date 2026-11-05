"use client";

import { useEffect, useRef, useState } from "react";
import { X, Plus, Minus, Trash2, Pencil, Check } from "lucide-react";
import { authFetch } from "@/utils/api";
import { formatBookExpiryDate } from "@/services/adjustments";
import useAlert from "@/hooks/useAlert";

export interface AdjustmentLeg {
    leg_index: number;
    action: string;
    instrument: string;
    quantity: number;
    price: number | null;
    order_type: string;
    exchange: string;
    lot_size: number;
    token: string;
}

export interface ManualAdjustmentInitialValues {
    title?: string;
    notes?: string;
    autoTrade?: boolean;
    exchange?: string;
    legs?: AdjustmentLeg[];
    expiry?: string;
    heading?: string;
    requireEntrySpread?: boolean;
}

interface Props {
    strategyId: number;
    underlyings?: string[];
    underlyingTokens?: Record<string, number>;
    initialValues?: ManualAdjustmentInitialValues;
    onClose: () => void;
    onSuccess: () => void;
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;

/** Listed expiries in the next 4 calendar months, this month included. */
function expiriesWithinMonths(expiries: string[], months = 4): string[] {
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() + months, 0);
    const cutoffIso = [
        cutoff.getFullYear(),
        String(cutoff.getMonth() + 1).padStart(2, "0"),
        String(cutoff.getDate()).padStart(2, "0"),
    ].join("-");
    const dates = new Set<string>();
    for (const raw of expiries) {
        if (!raw || raw.length < 10) continue;
        const iso = raw.slice(0, 10);
        if (iso <= cutoffIso) dates.add(iso);
    }
    return Array.from(dates).sort();
}

function isoToInstrumentExpiry(iso: string): string {
    const [year, month, day] = iso.slice(0, 10).split("-");
    const name = MONTHS[Number(month) - 1];
    if (!year || !name || !day) return "";
    return `${year.slice(-2)} ${name} ${day}`;
}

function instrumentExpiryToIso(expiry: string): string {
    const [yy, mon, dd] = expiry.trim().split(/\s+/);
    const month = MONTHS.indexOf((mon ?? "").toUpperCase() as (typeof MONTHS)[number]) + 1;
    const day = Number(dd);
    const yearNum = Number(yy);
    if (!month || !Number.isFinite(day) || !Number.isFinite(yearNum)) return "";
    const year = yearNum < 100 ? 2000 + yearNum : yearNum;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function withCurrentExpiry(listed: string[], current: string): string[] {
    if (!current || listed.includes(current)) return listed;
    return [...listed, current].sort();
}

function concreteExchanges(exchange: string): string[] {
    if (exchange === "NFO_BFO") return ["NFO", "BFO"];
    if (exchange === "MCX_NCO") return ["MCX", "NCO"];
    return [exchange || "NFO"];
}

function tokenForUnderlying(map: Record<string, number>, symbol: string): string | null {
    const upper = symbol.trim().toUpperCase();
    if (!upper) return null;
    if (map[upper] != null) return String(map[upper]);
    for (const [key, value] of Object.entries(map)) {
        if (key.toUpperCase() === upper) return String(value);
    }
    return null;
}

function atmStrike(spot: number, step: number): number {
    if (!(spot > 0) || !(step > 0)) return 0;
    const places = Math.min(6, Math.max(decimalPlaces(spot), decimalPlaces(step)));
    const factor = 10 ** places;
    return Math.round(Math.round(spot / step) * step * factor) / factor;
}

interface ParsedInstrument {
    symbol: string;
    expiry: string;
    strike: number;
    optionType: "CE" | "PE";
    period: string | null;
}

function formatStrike(strike: number): string {
    if (!Number.isFinite(strike)) return "";
    const text = String(strike);
    if (!text.includes(".")) return text;
    return text.replace(/0+$/, "").replace(/\.$/, "");
}

function decimalPlaces(value: number): number {
    const text = String(value);
    const dot = text.indexOf(".");
    return dot === -1 ? 0 : text.length - dot - 1;
}

function addStrike(strike: number, step: number, direction: 1 | -1): number | null {
    const places = Math.min(6, Math.max(decimalPlaces(strike), decimalPlaces(step)));
    const factor = 10 ** places;
    const next = (Math.round(strike * factor) + direction * Math.round(step * factor)) / factor;
    if (!Number.isFinite(next) || next <= 0) return null;
    return next;
}

function parseInstrument(instrument: string): ParsedInstrument | null {
    const parts = instrument.split(",").map((part) => part.trim());
    if (parts.length !== 4 && parts.length !== 5) return null;
    const [symbol, expiry, strikeText, optionRaw, period] = parts;
    const strike = Number(strikeText);
    const optionType = optionRaw?.toUpperCase();
    if (!symbol || !expiry || !Number.isFinite(strike) || (optionType !== "CE" && optionType !== "PE")) {
        return null;
    }
    return {
        symbol,
        expiry,
        strike,
        optionType,
        period: period ? period.toUpperCase() : null,
    };
}

function buildInstrument(parsed: ParsedInstrument, strike: number, optionType: string): string {
    const core = `${parsed.symbol},${parsed.expiry},${formatStrike(strike)},${optionType}`;
    return parsed.period ? `${core},${parsed.period}` : core;
}

interface LegDraft {
    action: string;
    symbol: string;
    expiryIso: string;
    strike: number;
    optionType: "CE" | "PE";
    period: string | null;
    price: number | null;
    exchange: string;
    lot_size: number;
    quantity: number;
    token: string;
    /** Set when the stored instrument cannot be parsed. */
    rawInstrument: string | null;
}

function emptyDraft(exchange: string): LegDraft {
    return {
        action: "BUY",
        symbol: "",
        expiryIso: "",
        strike: 0,
        optionType: "CE",
        period: null,
        price: null,
        exchange,
        lot_size: 1,
        quantity: 1,
        token: "",
        rawInstrument: null,
    };
}

function draftFromLeg(leg: AdjustmentLeg): LegDraft {
    const parsed = parseInstrument(leg.instrument);
    if (!parsed) {
        return {
            ...emptyDraft(leg.exchange || "NFO"),
            action: leg.action === "SELL" ? "SELL" : "BUY",
            price: leg.price,
            exchange: leg.exchange || "NFO",
            lot_size: lotSizeOf(leg),
            quantity: leg.quantity,
            token: leg.token,
            rawInstrument: leg.instrument,
        };
    }
    return {
        action: leg.action === "SELL" ? "SELL" : "BUY",
        symbol: parsed.symbol,
        expiryIso: instrumentExpiryToIso(parsed.expiry),
        strike: parsed.strike,
        optionType: parsed.optionType,
        period: parsed.period,
        price: leg.price,
        exchange: leg.exchange || "NFO",
        lot_size: lotSizeOf(leg),
        quantity: leg.quantity,
        token: leg.token,
        rawInstrument: null,
    };
}

function draftInstrument(draft: LegDraft): string {
    if (draft.rawInstrument != null) return draft.rawInstrument.trim();
    const expiry = isoToInstrumentExpiry(draft.expiryIso);
    const core = `${draft.symbol},${expiry},${formatStrike(draft.strike)},${draft.optionType}`;
    return draft.period ? `${core},${draft.period}` : core;
}

function lotSizeOf(leg: AdjustmentLeg): number {
    return leg.lot_size > 0 ? leg.lot_size : 1;
}

interface QuoteLevel {
    price?: number;
}

interface QuoteRow {
    last_price?: number;
    instrument_token?: number;
    depth?: {
        buy?: QuoteLevel[];
        sell?: QuoteLevel[];
    };
}

function positivePrice(value: unknown): number | null {
    const price = Number(value);
    return Number.isFinite(price) && price > 0 ? price : null;
}

/** BUY joins the bid, SELL joins the offer. Falls back to last price. */
function limitPriceFromQuote(quote: QuoteRow | null, action: string): number | null {
    if (!quote) return null;
    const levels = action === "SELL" ? quote.depth?.sell : quote.depth?.buy;
    return positivePrice(levels?.[0]?.price) ?? positivePrice(quote.last_price);
}

async function quoteForToken(token: string): Promise<QuoteRow | null> {
    const res = await authFetch("market/quotes/", {}, { instruments: token });
    if (!res.ok) return null;
    const body = await res.json();
    const data = body?.data as Record<string, QuoteRow | undefined> | undefined;
    if (!data) return null;
    if (data[token]) return data[token] ?? null;
    const tokenNum = Number(token);
    if (!Number.isFinite(tokenNum)) return null;
    if (data[String(tokenNum)]) return data[String(tokenNum)] ?? null;
    return (
        Object.values(data).find((row) => row != null && Number(row.instrument_token) === tokenNum) ??
        null
    );
}

export default function ManualAdjustmentModal({
    strategyId,
    underlyings = [],
    underlyingTokens = {},
    initialValues,
    onClose,
    onSuccess,
}: Props) {
    const heading =
        initialValues?.heading ??
        ((initialValues?.legs?.length ?? 0) > 0 ? "Duplicate Adjustment" : "Add Manual Adjustment");
    const [title, setTitle] = useState(initialValues?.title ?? "");
    const [notes, setNotes] = useState(initialValues?.notes ?? "");
    const [autoTrade, setAutoTrade] = useState(initialValues?.autoTrade ?? false);
    const [requireEntrySpread, setRequireEntrySpread] = useState(
        initialValues?.requireEntrySpread === true
    );
    const [exchange, setExchange] = useState(initialValues?.exchange ?? "NFO");
    const [legs, setLegs] = useState<AdjustmentLeg[]>(initialValues?.legs ?? []);
    const [editor, setEditor] = useState<{ index: number | "new"; draft: LegDraft } | null>(null);
    const [expiryChoices, setExpiryChoices] = useState<string[]>([]);
    const [preparingAdd, setPreparingAdd] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [strikeSteps, setStrikeSteps] = useState<Record<string, number | null>>({});
    const [resolving, setResolving] = useState<Record<number, boolean>>({});
    const strikeStepRequested = useRef<Set<string>>(new Set());
    const resolvingRef = useRef<Set<number>>(new Set());
    const expiryCache = useRef<Map<string, string[]>>(new Map());
    const resolveGen = useRef(0);
    const mountedRef = useRef(true);
    const editorRef = useRef(editor);
    editorRef.current = editor;
    const alert = useAlert();
    const formOpen = editor !== null;
    const strategyUnderlyings = underlyings.map((name) => name.trim()).filter(Boolean);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const symbols = new Set<string>();
        for (const leg of legs) {
            const parsed = parseInstrument(leg.instrument);
            if (parsed) symbols.add(parsed.symbol);
        }
        for (const symbol of symbols) {
            if (strikeStepRequested.current.has(symbol)) continue;
            strikeStepRequested.current.add(symbol);
            void (async () => {
                let step: number | null = null;
                try {
                    const res = await authFetch(`market/get/${encodeURIComponent(symbol)}`);
                    if (res.ok) {
                        const data = await res.json();
                        const parsedStep = Number(data.strike_step);
                        if (Number.isFinite(parsedStep) && parsedStep > 0) step = parsedStep;
                    }
                } catch {
                    step = null;
                }
                if (mountedRef.current) {
                    setStrikeSteps((prev) => ({ ...prev, [symbol]: step }));
                }
            })();
        }
    }, [legs]);

    function underlyingChoices(current: string): string[] {
        const names = [...strategyUnderlyings];
        if (current && !names.some((name) => name.toUpperCase() === current.toUpperCase())) {
            names.unshift(current);
        }
        return names;
    }

    function exchangesToTry(preferred: string): string[] {
        const mixed = concreteExchanges(exchange);
        if (mixed.length === 1) return [preferred || mixed[0]];
        const first = mixed.includes(preferred) ? preferred : mixed[0];
        return [first, ...mixed.filter((item) => item !== first)];
    }

    async function fetchStep(symbol: string): Promise<number | null> {
        const known = strikeSteps[symbol];
        if (typeof known === "number") return known;
        try {
            const res = await authFetch(`market/get/${encodeURIComponent(symbol)}`);
            if (!res.ok) return null;
            const data = await res.json();
            const step = Number(data.strike_step);
            if (!Number.isFinite(step) || step <= 0) return null;
            if (mountedRef.current) setStrikeSteps((prev) => ({ ...prev, [symbol]: step }));
            return step;
        } catch {
            return null;
        }
    }

    async function listedExpiries(symbol: string, legExchange: string): Promise<string[]> {
        const cacheKey = `${legExchange}:${symbol}`;
        const cached = expiryCache.current.get(cacheKey);
        if (cached) return cached;
        try {
            const res = await authFetch("optionchain/expiries/", {}, {
                underlying_symbol: symbol,
                exchange: legExchange || "NFO",
            });
            const data = await res.json();
            const list: string[] = Array.isArray(data?.expiries) ? data.expiries : [];
            const listed = expiriesWithinMonths(list);
            expiryCache.current.set(cacheKey, listed);
            return listed;
        } catch {
            return [];
        }
    }

    async function expiriesFor(symbol: string, preferredExchange: string): Promise<{ expiries: string[]; exchange: string }> {
        const attempts = exchangesToTry(preferredExchange);
        for (const legExchange of attempts) {
            const listed = await listedExpiries(symbol, legExchange);
            if (listed.length > 0) return { expiries: listed, exchange: legExchange };
        }
        return { expiries: [], exchange: attempts[0] || "NFO" };
    }

    async function spotFor(symbol: string, legExchange: string): Promise<number | null> {
        let token = tokenForUnderlying(underlyingTokens, symbol);
        if (!token) {
            const commodity = legExchange === "MCX" || legExchange === "NCO";
            const instrumentType = commodity ? "FUT" : "EQ";
            const exchangeParam = commodity ? `&exchange=${encodeURIComponent(legExchange)}` : "";
            try {
                const res = await authFetch(
                    `market/instruments/search/?instrument_type=${instrumentType}&q=${encodeURIComponent(symbol)}${exchangeParam}`
                );
                if (res.ok) {
                    const rows = (await res.json()) as { tradingsymbol?: string; name?: string; instrument_token?: number }[];
                    const upper = symbol.toUpperCase();
                    const match = (Array.isArray(rows) ? rows : []).find((row) => {
                        const trading = String(row?.tradingsymbol ?? "");
                        const name = String(row?.name ?? "");
                        return trading.split(" ")[0].toUpperCase() === upper || name.toUpperCase() === upper || trading.toUpperCase() === upper;
                    });
                    if (match?.instrument_token != null) token = String(match.instrument_token);
                }
            } catch {
                token = null;
            }
        }
        if (!token) return null;
        try {
            return positivePrice((await quoteForToken(token))?.last_price);
        } catch {
            return null;
        }
    }

    async function resolveDraft(index: number | "new", next: LegDraft) {
        const gen = ++resolveGen.current;
        const key = index === "new" ? -1 : index;
        const expiry = isoToInstrumentExpiry(next.expiryIso);
        if (!next.symbol || !expiry || !(next.strike > 0)) return;
        setResolving((prev) => ({ ...prev, [key]: true }));
        try {
            let found: {
                exists?: boolean;
                message?: string;
                lot_size?: number;
                strike?: number;
                instrument_token?: number | string;
                exchange?: string;
            } | null = null;
            let usedExchange = next.exchange || "NFO";
            for (const legExchange of exchangesToTry(next.exchange)) {
                try {
                    const res = await authFetch(
                        "market/instruments/validate?security=" +
                            encodeURIComponent(next.symbol) +
                            "&date=" +
                            encodeURIComponent(expiry) +
                            "&strike=" +
                            encodeURIComponent(formatStrike(next.strike)) +
                            "&option=" +
                            next.optionType +
                            "&exchange=" +
                            encodeURIComponent(legExchange)
                    );
                    const data = await res.json();
                    if (gen !== resolveGen.current) return;
                    if (res.ok && data?.exists) {
                        found = data;
                        usedExchange = typeof data.exchange === "string" && data.exchange ? data.exchange : legExchange;
                        break;
                    }
                    found = data;
                } catch {
                    if (gen !== resolveGen.current) return;
                }
            }
            if (gen !== resolveGen.current || !mountedRef.current) return;
            if (!found?.exists) {
                alert.error(found?.message || "That contract is not listed.");
                setEditor((current) => {
                    if (!current || current.index !== index) return current;
                    const live = current.draft;
                    if (live.symbol !== next.symbol || live.expiryIso !== next.expiryIso || live.optionType !== next.optionType || live.strike !== next.strike) {
                        return current;
                    }
                    return { index, draft: { ...live, token: "" } };
                });
                return;
            }
            const apiLot = Number(found.lot_size);
            const lot = Number.isFinite(apiLot) && apiLot > 0 ? apiLot : next.lot_size > 0 ? next.lot_size : 1;
            const listedStrike = Number(found.strike);
            const strike = Number.isFinite(listedStrike) ? listedStrike : next.strike;
            const token =
                found.instrument_token != null && found.instrument_token !== ""
                    ? String(found.instrument_token)
                    : "";
            let quoted: number | null = null;
            try {
                quoted = token ? limitPriceFromQuote(await quoteForToken(token), next.action) : null;
            } catch {
                quoted = null;
            }
            if (gen !== resolveGen.current || !mountedRef.current) return;
            setEditor((current) => {
                if (!current || current.index !== index) return current;
                const live = current.draft;
                if (live.symbol !== next.symbol || live.expiryIso !== next.expiryIso || live.optionType !== next.optionType) {
                    return current;
                }
                const prevLot = live.lot_size > 0 ? live.lot_size : 1;
                const lots = Math.max(1, Math.round(live.quantity / prevLot));
                return {
                    index,
                    draft: {
                        ...live,
                        exchange: usedExchange,
                        strike,
                        token,
                        lot_size: lot,
                        quantity: lots * lot,
                        price: quoted ?? (live.strike === next.strike ? live.price : null),
                    },
                };
            });
        } catch {
            if (gen === resolveGen.current) alert.error("Could not validate the contract.");
        } finally {
            if (gen === resolveGen.current) setResolving((prev) => ({ ...prev, [key]: false }));
        }
    }

    async function loadExpiryChoices(index: number | "new", symbol: string, preferredExchange: string, currentIso: string) {
        const { expiries, exchange: resolvedExchange } = await expiriesFor(symbol, preferredExchange);
        const live = editorRef.current;
        if (!mountedRef.current || live?.index !== index || live.draft.symbol !== symbol) {
            return { expiries, exchange: resolvedExchange };
        }
        setExpiryChoices(withCurrentExpiry(expiries, currentIso));
        return { expiries, exchange: resolvedExchange };
    }

    function startEdit(index: number) {
        const leg = legs[index];
        if (!leg) return;
        const draft = draftFromLeg(leg);
        setEditor({ index, draft });
        if (!draft.rawInstrument && draft.symbol) {
            setExpiryChoices(draft.expiryIso ? [draft.expiryIso] : []);
            void loadExpiryChoices(index, draft.symbol, draft.exchange, draft.expiryIso);
        } else {
            setExpiryChoices([]);
        }
    }

    function cancelEdit() {
        resolveGen.current += 1;
        setEditor(null);
        setExpiryChoices([]);
    }

    function saveEdit() {
        if (!editor) return;
        const { index, draft } = editor;
        const key = index === "new" ? -1 : index;
        if (resolving[key]) {
            alert.error("Still checking that contract.");
            return;
        }
        const hasPrice = draft.price !== null && draft.price !== undefined && draft.price !== 0;
        const price = hasPrice ? Number(draft.price) : null;
        if (hasPrice && (!Number.isFinite(price) || (price ?? 0) <= 0)) {
            alert.error("Price must be empty (MARKET) or a positive number.");
            return;
        }
        const instrument = draftInstrument(draft);
        if (!instrument || (draft.rawInstrument == null && !draft.token)) {
            alert.error(draft.rawInstrument == null ? "That contract is not listed." : "Instrument is required.");
            return;
        }
        const saved: AdjustmentLeg = {
            leg_index: index === "new" ? legs.length + 1 : legs[index].leg_index,
            action: draft.action === "SELL" ? "SELL" : "BUY",
            instrument,
            quantity: draft.quantity,
            price,
            order_type: hasPrice ? "LIMIT" : "MARKET",
            exchange: draft.exchange || "NFO",
            lot_size: draft.lot_size > 0 ? draft.lot_size : 1,
            token: draft.token,
        };
        if (index === "new") {
            setLegs((prev) => [...prev, { ...saved, leg_index: prev.length + 1 }]);
        } else {
            setLegs((prev) => prev.map((leg, i) => (i === index ? { ...leg, ...saved, leg_index: leg.leg_index } : leg)));
        }
        cancelEdit();
    }

    function patchDraft(patch: Partial<LegDraft>, resolve: boolean) {
        const current = editorRef.current;
        if (!current) return;
        const next: LegDraft = { ...current.draft, ...patch };
        setEditor({ index: current.index, draft: next });
        if (resolve && next.rawInstrument == null) void resolveDraft(current.index, next);
    }

    async function onUnderlyingChange(symbol: string) {
        const current = editorRef.current;
        if (!current || current.draft.rawInstrument != null) return;
        const { expiries, exchange: resolvedExchange } = await expiriesFor(symbol, current.draft.exchange);
        if (!mountedRef.current || editorRef.current?.index !== current.index) return;
        const live = editorRef.current.draft;
        const expiryIso = expiries.includes(live.expiryIso) ? live.expiryIso : expiries[0] ?? "";
        setExpiryChoices(withCurrentExpiry(expiries, expiryIso));
        const step = await fetchStep(symbol);
        const spot = await spotFor(symbol, resolvedExchange);
        if (!mountedRef.current || editorRef.current?.index !== current.index) return;
        const strike = spot && step ? atmStrike(spot, step) : editorRef.current.draft.strike;
        const next: LegDraft = {
            ...editorRef.current.draft,
            symbol,
            exchange: resolvedExchange,
            expiryIso,
            strike: strike > 0 ? strike : editorRef.current.draft.strike,
            period: null,
            token: "",
            price: null,
        };
        setEditor({ index: current.index, draft: next });
        if (next.expiryIso && next.strike > 0) void resolveDraft(current.index, next);
        else alert.error(`No listed expiry for ${symbol}.`);
    }

    function onExpiryChange(expiryIso: string) {
        patchDraft({ expiryIso, period: null, token: "", price: null }, true);
    }

    function onOptionChange(optionType: "CE" | "PE") {
        patchDraft({ optionType, token: "" }, true);
    }

    function stepDraftStrike(direction: 1 | -1) {
        const current = editorRef.current;
        if (!current) return;
        const step = strikeSteps[current.draft.symbol];
        if (typeof step !== "number") return;
        const strike = addStrike(current.draft.strike, step, direction);
        if (strike == null) return;
        patchDraft({ strike, token: "" }, true);
    }

    function setDraftLots(lots: number) {
        const current = editorRef.current;
        if (!current) return;
        const nextLots = Math.max(1, Math.round(lots));
        const lot = current.draft.lot_size > 0 ? current.draft.lot_size : 1;
        setEditor({ index: current.index, draft: { ...current.draft, quantity: nextLots * lot } });
    }

    async function startAdd() {
        if (strategyUnderlyings.length === 0) {
            alert.error("This strategy has no underlyings.");
            return;
        }
        const symbol = strategyUnderlyings[0];
        const preferred = concreteExchanges(exchange)[0];
        setPreparingAdd(true);
        try {
            const { expiries, exchange: resolvedExchange } = await expiriesFor(symbol, preferred);
            const preferredIso = (initialValues?.expiry ?? "").slice(0, 10);
            const expiryIso = expiries.includes(preferredIso) ? preferredIso : expiries[0] ?? "";
            if (!expiryIso) {
                alert.error(`No expiries listed for ${symbol}.`);
                return;
            }
            const step = await fetchStep(symbol);
            const spot = await spotFor(symbol, resolvedExchange);
            const strike = spot && step ? atmStrike(spot, step) : 0;
            if (!(strike > 0)) {
                alert.error(`No spot price for ${symbol}.`);
                return;
            }
            if (!mountedRef.current) return;
            const draft: LegDraft = {
                ...emptyDraft(resolvedExchange),
                symbol,
                expiryIso,
                strike,
                exchange: resolvedExchange,
            };
            setExpiryChoices(expiries);
            setEditor({ index: "new", draft });
            void resolveDraft("new", draft);
        } finally {
            if (mountedRef.current) setPreparingAdd(false);
        }
    }

    function setLots(index: number, lots: number) {
        const nextLots = Math.max(1, Math.round(lots));
        setLegs((prev) =>
            prev.map((leg, i) =>
                i === index ? { ...leg, quantity: nextLots * lotSizeOf(leg) } : leg
            )
        );
    }

    async function retargetLeg(index: number, nextStrike: number, nextOption: "CE" | "PE") {
        if (resolvingRef.current.has(index)) return;
        const leg = legs[index];
        if (!leg) return;
        const parsed = parseInstrument(leg.instrument);
        if (!parsed) return;
        if (parsed.strike === nextStrike && parsed.optionType === nextOption) return;

        resolvingRef.current.add(index);
        setResolving((prev) => ({ ...prev, [index]: true }));
        try {
            const exchange = leg.exchange || "NFO";
            const res = await authFetch(
                "market/instruments/validate?security=" +
                    encodeURIComponent(parsed.symbol) +
                    "&date=" +
                    encodeURIComponent(parsed.expiry) +
                    "&strike=" +
                    encodeURIComponent(formatStrike(nextStrike)) +
                    "&option=" +
                    nextOption +
                    "&exchange=" +
                    encodeURIComponent(exchange)
            );
            const data = await res.json();
            if (!res.ok || !data?.exists) {
                alert.error(data?.message || "That contract is not listed.");
                return;
            }
            const apiLot = Number(data.lot_size);
            const lot = Number.isFinite(apiLot) && apiLot > 0 ? apiLot : lotSizeOf(leg);
            const lots = Math.max(1, Math.round(leg.quantity / lotSizeOf(leg)));
            const listedStrike = Number(data.strike);
            const strike = Number.isFinite(listedStrike) ? listedStrike : nextStrike;
            const token =
                data.instrument_token != null && data.instrument_token !== ""
                    ? String(data.instrument_token)
                    : leg.token;
            let quoted: number | null = null;
            try {
                quoted = limitPriceFromQuote(await quoteForToken(token), leg.action);
            } catch {
                // Strike change still stands if the quote is unavailable.
            }
            const price = quoted ?? leg.price;
            const orderType = quoted != null ? "LIMIT" : leg.order_type;
            setLegs((prev) =>
                prev.map((row, i) =>
                    i === index
                        ? {
                              ...row,
                              instrument: buildInstrument(parsed, strike, nextOption),
                              token,
                              lot_size: lot,
                              quantity: lots * lot,
                              price,
                              order_type: orderType,
                          }
                        : row
                )
            );
        } catch {
            alert.error("Could not validate the contract.");
        } finally {
            resolvingRef.current.delete(index);
            setResolving((prev) => ({ ...prev, [index]: false }));
        }
    }

    function removeLeg(index: number) {
        setLegs((prev) => {
            const updated = prev.filter((_, i) => i !== index);
            return updated.map((l, i) => ({ ...l, leg_index: i + 1 }));
        });
        setEditor((current) => {
            if (!current || current.index === "new") return current;
            if (current.index === index) return null;
            return current.index > index ? { ...current, index: current.index - 1 } : current;
        });
    }

    async function handleSubmit() {
        if (legs.length === 0) {
            alert.error("Please add at least one leg before submitting.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                title: title || null,
                notes: notes || null,
                is_active: true,
                auto_trade: autoTrade,
                require_entry_spread: requireEntrySpread,
                legs,
            };

            const res = await authFetch(`strategies/${strategyId}/push-allocate-adjustment/`, {
                method: "POST",
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                alert.error(data?.detail || "Failed to create adjustment");
                return;
            }

            // The API returns a message when an active adjustment already exists
            if (data?.message) {
                alert.error(data.message);
                return;
            }

            alert.success("Manual adjustment created successfully");
            onSuccess();
            onClose();
        } catch {
            alert.error("Error submitting adjustment");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-xl">
                        {heading}
                    </h3>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
                        <X size={18} />
                    </button>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="form-control">
                        <label className="label"><span className="label-text">Title</span></label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Roll adjustment"
                            className="input input-bordered w-full"
                        />
                    </div>

                    <div className="form-control">
                        <label className="label"><span className="label-text">Exchange</span></label>
                        <select
                            value={exchange}
                            onChange={(e) => { setExchange(e.target.value); setEditor(null); }}
                            className="select select-bordered w-full"
                            disabled={formOpen}
                        >
                            <option value="NFO">NFO</option>
                            <option value="BFO">BFO</option>
                            <option value="MCX">MCX</option>
                            <option value="NCO">NCO</option>
                            <option value="NFO_BFO">NFO + BFO (mixed)</option>
                            <option value="MCX_NCO">MCX + NCO (mixed)</option>
                        </select>
                    </div>

                    <div className="form-control">
                        <label className="label cursor-pointer gap-3 justify-start">
                            <span className="label-text">Auto Trade</span>
                            <input
                                type="checkbox"
                                checked={autoTrade}
                                onChange={(e) => setAutoTrade(e.target.checked)}
                                className="toggle toggle-primary"
                            />
                        </label>
                    </div>

                    <div className="form-control">
                        <label
                            className="label cursor-pointer gap-3 justify-start"
                            title="Wait for the builder entry spread condition before placing each batch"
                        >
                            <span className="label-text">Require entry spread</span>
                            <input
                                type="checkbox"
                                checked={requireEntrySpread}
                                onChange={(e) => setRequireEntrySpread(e.target.checked)}
                                className="toggle toggle-primary"
                            />
                        </label>
                    </div>
                </div>

                <div className="divider my-2" />

                {/* Legs section */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-base">
                            Legs
                            {legs.length > 0 && (
                                <span className="ml-2 badge badge-neutral badge-sm">{legs.length}</span>
                            )}
                        </h4>
                        {!formOpen && (
                            <button
                                className="btn btn-sm btn-outline gap-1"
                                onClick={() => void startAdd()}
                                disabled={preparingAdd || strategyUnderlyings.length === 0}
                                title={strategyUnderlyings.length === 0 ? "No underlyings on this strategy" : "Add leg"}
                            >
                                {preparingAdd ? <span className="loading loading-spinner loading-xs" /> : <Plus size={14} />}
                                Add Leg
                            </button>
                        )}
                    </div>

                    {/* Legs table */}
                    {(legs.length > 0 || editor?.index === "new") && (
                        <div className="overflow-x-auto rounded-lg border border-base-300 mb-4">
                            <table className="table table-sm">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Action</th>
                                        <th>Instrument</th>
                                        <th>Lots</th>
                                        <th>Price</th>
                                        <th>Order</th>
                                        <th>Exch</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const rows = legs.map((leg, i) => ({
                                            key: String(i),
                                            index: i as number | "new",
                                            label: leg.leg_index,
                                            leg,
                                            draft: editor?.index === i ? editor.draft : null,
                                            resolveKey: i,
                                        }));
                                        if (editor?.index === "new") {
                                            const draft = editor.draft;
                                            rows.push({
                                                key: "new",
                                                index: "new",
                                                label: legs.length + 1,
                                                leg: {
                                                    leg_index: legs.length + 1,
                                                    action: draft.action,
                                                    instrument: draftInstrument(draft),
                                                    quantity: draft.quantity,
                                                    price: draft.price,
                                                    order_type: draft.price ? "LIMIT" : "MARKET",
                                                    exchange: draft.exchange,
                                                    lot_size: draft.lot_size,
                                                    token: draft.token,
                                                },
                                                draft,
                                                resolveKey: -1,
                                            });
                                        }
                                        return rows.map((row) => {
                                        const { leg, draft, resolveKey } = row;
                                        const isEditing = draft !== null;
                                        const rowBusy = resolving[resolveKey] === true;
                                        return (
                                        <tr key={row.key} className={isEditing ? "bg-primary/5" : undefined}>
                                            <td className="font-mono">{row.label}</td>
                                            <td>
                                                {isEditing && draft ? (
                                                    <select
                                                        className="select select-bordered select-xs w-[5.5rem]"
                                                        value={draft.action}
                                                        onChange={(e) =>
                                                            patchDraft({ action: e.target.value === "SELL" ? "SELL" : "BUY" }, false)
                                                        }
                                                    >
                                                        <option value="BUY">BUY</option>
                                                        <option value="SELL">SELL</option>
                                                    </select>
                                                ) : (
                                                    <span className={`badge badge-sm ${leg.action === "BUY" ? "badge-success" : "badge-error"}`}>
                                                        {leg.action}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="font-mono text-xs">
                                                {isEditing && draft?.rawInstrument != null ? (
                                                    <input
                                                        className="input input-bordered input-xs w-56 font-mono"
                                                        value={draft.rawInstrument}
                                                        onChange={(e) => patchDraft({ rawInstrument: e.target.value }, false)}
                                                    />
                                                ) : isEditing && draft ? (
                                                    (() => {
                                                        const step = strikeSteps[draft.symbol];
                                                        const stepKnown = typeof step === "number";
                                                        const stepTitle = rowBusy
                                                            ? "Checking contract"
                                                            : stepKnown
                                                              ? `Move strike by ${step}`
                                                              : step === null
                                                                ? `No strike step for ${draft.symbol}`
                                                                : "Loading strike step";
                                                        return (
                                                            <div className="flex min-w-72 flex-col gap-1">
                                                                <div className="flex items-center gap-1">
                                                                    <select
                                                                        className="select select-bordered select-xs max-w-32"
                                                                        aria-label="Underlying"
                                                                        value={draft.symbol}
                                                                        disabled={rowBusy}
                                                                        onChange={(e) => void onUnderlyingChange(e.target.value)}
                                                                    >
                                                                        {underlyingChoices(draft.symbol).map((name) => (
                                                                            <option key={name} value={name}>{name}</option>
                                                                        ))}
                                                                    </select>
                                                                    <select
                                                                        className="select select-bordered select-xs"
                                                                        aria-label="Expiry"
                                                                        value={draft.expiryIso}
                                                                        disabled={rowBusy || expiryChoices.length === 0}
                                                                        onChange={(e) => onExpiryChange(e.target.value)}
                                                                    >
                                                                        {expiryChoices.length === 0 && <option value="">Loading…</option>}
                                                                        {expiryChoices.map((iso) => (
                                                                            <option key={iso} value={iso}>{formatBookExpiryDate(iso)}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-ghost btn-xs btn-square"
                                                                        aria-label="Decrease strike"
                                                                        title={stepTitle}
                                                                        disabled={!stepKnown || rowBusy || submitting}
                                                                        onClick={() => stepDraftStrike(-1)}
                                                                    >
                                                                        <Minus size={12} />
                                                                    </button>
                                                                    <span className="min-w-14 text-center tabular-nums">
                                                                        {formatStrike(draft.strike)}
                                                                    </span>
                                                                    <select
                                                                        className="select select-bordered select-xs w-16"
                                                                        aria-label="Option type"
                                                                        value={draft.optionType}
                                                                        disabled={rowBusy}
                                                                        onChange={(e) => onOptionChange(e.target.value === "PE" ? "PE" : "CE")}
                                                                    >
                                                                        <option value="CE">CE</option>
                                                                        <option value="PE">PE</option>
                                                                    </select>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-ghost btn-xs btn-square"
                                                                        aria-label="Increase strike"
                                                                        title={stepTitle}
                                                                        disabled={!stepKnown || rowBusy || submitting}
                                                                        onClick={() => stepDraftStrike(1)}
                                                                    >
                                                                        <Plus size={12} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()
                                                ) : (
                                                    (() => {
                                                        const parsed = parseInstrument(leg.instrument);
                                                        if (!parsed) return leg.instrument;
                                                        const step = strikeSteps[parsed.symbol];
                                                        const stepKnown = typeof step === "number";
                                                        const stepTitle = rowBusy
                                                            ? "Checking contract"
                                                            : stepKnown
                                                              ? `Move strike by ${step}`
                                                              : step === null
                                                                ? `No strike step for ${parsed.symbol}`
                                                                : "Loading strike step";
                                                        const strikeLocked = formOpen || submitting;
                                                        return (
                                                            <div className="flex min-w-64 flex-col gap-1">
                                                                <span className="text-[10px] text-base-content/60">
                                                                    {parsed.symbol}
                                                                    {stepKnown ? ` · step ${step}` : step === undefined ? " · step …" : ""}
                                                                    {` · ${parsed.expiry}`}
                                                                </span>
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-ghost btn-xs btn-square"
                                                                        aria-label="Decrease strike"
                                                                        title={stepTitle}
                                                                        disabled={!stepKnown || rowBusy || strikeLocked}
                                                                        onClick={() => {
                                                                            if (typeof step !== "number" || row.index === "new") return;
                                                                            const next = addStrike(parsed.strike, step, -1);
                                                                            if (next != null) void retargetLeg(row.index, next, parsed.optionType);
                                                                        }}
                                                                    >
                                                                        <Minus size={12} />
                                                                    </button>
                                                                    <span className="min-w-16 text-center tabular-nums">
                                                                        {formatStrike(parsed.strike)} {parsed.optionType}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-ghost btn-xs btn-square"
                                                                        aria-label="Increase strike"
                                                                        title={stepTitle}
                                                                        disabled={!stepKnown || rowBusy || strikeLocked}
                                                                        onClick={() => {
                                                                            if (typeof step !== "number" || row.index === "new") return;
                                                                            const next = addStrike(parsed.strike, step, 1);
                                                                            if (next != null) void retargetLeg(row.index, next, parsed.optionType);
                                                                        }}
                                                                    >
                                                                        <Plus size={12} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()
                                                )}
                                            </td>
                                            <td>
                                                {(() => {
                                                    const lot = isEditing && draft
                                                        ? (draft.lot_size > 0 ? draft.lot_size : 1)
                                                        : lotSizeOf(leg);
                                                    const quantity = isEditing && draft ? draft.quantity : leg.quantity;
                                                    const rawLots = quantity / lot;
                                                    const lots = Number.isInteger(rawLots) ? rawLots : Math.round(rawLots * 100) / 100;
                                                    const locked = rowBusy || submitting || (formOpen && !isEditing);
                                                    return (
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-0.5">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-ghost btn-xs btn-square"
                                                                    aria-label="Remove one lot"
                                                                    disabled={lots <= 1 || locked}
                                                                    onClick={() => {
                                                                        if (isEditing) setDraftLots(lots - 1);
                                                                        else if (row.index !== "new") setLots(row.index, lots - 1);
                                                                    }}
                                                                >
                                                                    <Minus size={12} />
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    step={1}
                                                                    aria-label="Lots"
                                                                    className="input input-bordered input-xs w-14 text-center tabular-nums"
                                                                    value={lots}
                                                                    disabled={locked}
                                                                    onChange={(e) => {
                                                                        const next = Number(e.target.value);
                                                                        if (!Number.isFinite(next) || next < 1) return;
                                                                        if (isEditing) setDraftLots(next);
                                                                        else if (row.index !== "new") setLots(row.index, next);
                                                                    }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-ghost btn-xs btn-square"
                                                                    aria-label="Add one lot"
                                                                    title={`Add ${lot} quantity`}
                                                                    disabled={locked}
                                                                    onClick={() => {
                                                                        if (isEditing) setDraftLots(lots + 1);
                                                                        else if (row.index !== "new") setLots(row.index, lots + 1);
                                                                    }}
                                                                >
                                                                    <Plus size={12} />
                                                                </button>
                                                            </div>
                                                            <span className="text-[10px] text-base-content/50 tabular-nums">
                                                                qty {quantity}
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td>
                                                {isEditing && draft ? (
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        step="0.05"
                                                        className="input input-bordered input-xs w-24"
                                                        placeholder="MKT"
                                                        value={draft.price ?? ""}
                                                        onChange={(e) =>
                                                            patchDraft({
                                                                price:
                                                                    e.target.value === ""
                                                                        ? null
                                                                        : Number(e.target.value),
                                                            }, false)
                                                        }
                                                    />
                                                ) : (
                                                    leg.price ?? "—"
                                                )}
                                            </td>
                                            <td>
                                                <span className="badge badge-outline badge-xs">
                                                    {isEditing && draft
                                                        ? draft.price
                                                            ? "LIMIT"
                                                            : "MARKET"
                                                        : leg.order_type}
                                                </span>
                                            </td>
                                            <td className="text-xs">{isEditing && draft ? draft.exchange : leg.exchange}</td>
                                            <td>
                                                <div className="flex items-center gap-0.5">
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={saveEdit}
                                                                className="btn btn-ghost btn-xs text-success"
                                                                title="Save leg"
                                                                disabled={rowBusy}
                                                            >
                                                                <Check size={12} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={cancelEdit}
                                                                className="btn btn-ghost btn-xs"
                                                                title="Cancel edit"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (row.index !== "new") startEdit(row.index);
                                                            }}
                                                            className="btn btn-ghost btn-xs"
                                                            title="Edit leg"
                                                            disabled={formOpen}
                                                        >
                                                            <Pencil size={12} />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (row.index !== "new") removeLeg(row.index);
                                                        }}
                                                        className="btn btn-ghost btn-xs text-error"
                                                        title="Remove leg"
                                                        disabled={isEditing}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        );
                                        });
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {legs.length === 0 && editor?.index !== "new" && (
                        <p className="text-sm opacity-40 text-center py-6">
                            No legs added yet — click &ldquo;Add Leg&rdquo; to start.
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-action mt-4 pt-4 border-t border-base-300">
                    <button onClick={onClose} className="btn btn-ghost" disabled={submitting}>
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || legs.length === 0 || formOpen}
                        className="btn btn-primary"
                    >
                        {submitting
                            ? <span className="loading loading-spinner loading-sm" />
                            : "Submit Adjustment"
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}
