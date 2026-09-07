"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import { authFetch } from "@/utils/api";
import { brokerLoginWithPolling } from "@/utils/brokerLogin";
import { formatMoneyIN } from "@/utils/formatNumber";
import { useAuthStore } from "@/store/authStore";
import { isDemoUser } from "@/lib/demo";
import { RotateCw, Plus, AlertCircle, Loader2, ChevronDown, Info } from "lucide-react";
import useAlert from "@/hooks/useAlert";
import { LiveHolding } from "@/types/positions";

interface BrokerState {
  loading: boolean;
  hasProfile: boolean;
  verified: boolean;
  loggedIn: boolean;
  name: string | null;
  margin?: number | null;
  profileId?: number | null;
}

type AccountMetrics = {
  loading: boolean;
  engine1Total: number | null;
  engine1Pnl: number | null;
  engine1Realised: number | null;
  availableCash: number | null;
  totalAcValue: number | null;
};

function signedClass(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  if (value > 0) return "text-success";
  if (value < 0) return "text-error";
  return "";
}

function parseAvailableCash(marginData: Record<string, unknown>): number | null {
  if (marginData.status === "success" && marginData.available_cash != null) {
    const cash = Number(marginData.available_cash);
    if (!Number.isNaN(cash)) return cash;
  }
  const equity = (marginData.data as { equity?: { available?: { cash?: number } } } | undefined)
    ?.equity;
  const cash = equity?.available?.cash;
  return typeof cash === "number" && !Number.isNaN(cash) ? cash : null;
}

function parseTotalAccountCash(
  marginData: Record<string, unknown>,
  availableCash: number | null
): number | null {
  if (marginData.status === "success" && marginData.total_account_cash != null) {
    const cash = Number(marginData.total_account_cash);
    if (!Number.isNaN(cash)) return cash;
  }
  return availableCash;
}

function sumHoldingsMetrics(holdings: LiveHolding[]): {
  engine1Total: number;
  engine1Pnl: number;
} {
  return {
    engine1Total: holdings.reduce((sum, h) => sum + (h.current_value ?? 0), 0),
    engine1Pnl: holdings.reduce((sum, h) => sum + (h.pnl ?? 0), 0),
  };
}

function totalAcValue(
  engine1Total: number | null,
  availableCash: number | null
): number | null {
  if (engine1Total == null || availableCash == null) return null;
  return engine1Total + availableCash;
}

function e1PnlSum(
  mtm: number | null | undefined,
  realised: number | null | undefined
): number | null {
  const hasMtm = mtm != null && !Number.isNaN(mtm);
  const hasRealised = realised != null && !Number.isNaN(realised);
  if (hasMtm && hasRealised) return mtm + realised;
  if (hasMtm) return mtm;
  if (hasRealised) return realised;
  return null;
}

function parseE1Realised(pnlData: Record<string, unknown>): number | null {
  const raw = pnlData.e1_all_time_realised;
  if (raw == null) return null;
  const value = Number(raw);
  return Number.isNaN(value) ? null : value;
}

export default function BrokerLoginStatus() {
  const router = useRouter();
  const alert = useAlert();
  const { user, brokerNeedsRefresh, setBrokerNeedsRefresh } = useAuthStore();
  const isDemo = isDemoUser(user);

  const [broker, setBroker] = useState<BrokerState>({
    loading: true,
    hasProfile: false,
    verified: false,
    loggedIn: false,
    name: null,
    margin: null,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [accountMetrics, setAccountMetrics] = useState<AccountMetrics>({
    loading: false,
    engine1Total: null,
    engine1Pnl: null,
    engine1Realised: null,
    availableCash: null,
    totalAcValue: null,
  });
  const [metricsOpen, setMetricsOpen] = useState(false);
  const metricsDropdownRef = useRef<HTMLDivElement>(null);

  // Login modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const metricsFetchGen = useRef(0);
  const metricsLoadedForProfileRef = useRef<number | null>(null);
  const loginModalRef = useRef<HTMLDialogElement>(null);
  const loginModalHeadingId = useId();
  const loginPasswordId = useId();

  useEffect(() => {
    const node = loginModalRef.current;
    if (!node) return;
    if (showLoginModal && !node.open) {
      node.showModal();
    } else if (!showLoginModal && node.open) {
      node.close();
    }
  }, [showLoginModal]);

  const fetchAccountMetrics = useCallback(async () => {
    if (!user) return;
    const gen = ++metricsFetchGen.current;
    setAccountMetrics((m) => ({ ...m, loading: true }));

    try {
      const [holdingsRes, marginRes, pnlRes] = await Promise.all([
        authFetch("positions/live/holdings/"),
        authFetch("profiles/live/margin/"),
        authFetch("positions/pnl/summary/"),
      ]);

      if (gen !== metricsFetchGen.current) return;

      let engine1Total: number | null = null;
      let engine1Pnl: number | null = null;
      let engine1Realised: number | null = null;
      let availableCash: number | null = null;
      let totalAccountCash: number | null = null;

      if (holdingsRes.ok) {
        const holdingsData = await holdingsRes.json();
        if (holdingsData.status === "success") {
          const holdings: LiveHolding[] = Array.isArray(holdingsData.data)
            ? holdingsData.data
            : [];
          const e1 = sumHoldingsMetrics(holdings);
          engine1Total = e1.engine1Total;
          engine1Pnl = e1.engine1Pnl;
        }
      }

      if (marginRes.ok) {
        const marginData = await marginRes.json();
        availableCash = parseAvailableCash(marginData);
        totalAccountCash = parseTotalAccountCash(marginData, availableCash);
      }

      if (pnlRes.ok) {
        engine1Realised = parseE1Realised(await pnlRes.json());
      }

      setAccountMetrics({
        loading: false,
        engine1Total,
        engine1Pnl,
        engine1Realised,
        availableCash: totalAccountCash,
        totalAcValue: totalAcValue(engine1Total, totalAccountCash),
      });
    } catch (err) {
      console.error("Account metrics fetch failed:", err);
      if (gen !== metricsFetchGen.current) return;
      setAccountMetrics({
        loading: false,
        engine1Total: null,
        engine1Pnl: null,
        engine1Realised: null,
        availableCash: null,
        totalAcValue: null,
      });
    }
  }, [user]);

  const fetchActiveProfile = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!user) return;
      if (!silent) {
        setBroker((b) => ({ ...b, loading: true }));
      }
      setStatusError(null);

      try {
        const res = await authFetch("profiles/check-profile/");
        if (!res.ok) {
          metricsLoadedForProfileRef.current = null;
          setBroker({
            loading: false,
            hasProfile: false,
            verified: false,
            loggedIn: false,
            name: null,
          });
          return;
        }
        const data = await res.json();
        const loggedIn = Boolean(data.logged_in);
        const profileId = data.id ?? null;
        setBroker({
          loading: false,
          hasProfile: !!data.id,
          verified: data.verified || false,
          loggedIn,
          name: data.broker_name || null,
          margin: data.margin_equity != null ? Number(data.margin_equity) : null,
          profileId,
        });
        if (!loggedIn) {
          metricsLoadedForProfileRef.current = null;
        }
      } catch (err) {
        console.error("Broker check failed:", err);
        metricsLoadedForProfileRef.current = null;
        setBroker({
          loading: false,
          hasProfile: false,
          verified: false,
          loggedIn: false,
          name: null,
        });
      }
    },
    [user]
  );

  const refreshAccountValues = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!user) return;
      setRefreshing(true);
      setStatusError(null);

      try {
        const res = await authFetch("profiles/refresh-margin/");
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to refresh margin");
        if (data.margin_equity != null) {
          const margin = Number(data.margin_equity);
          if (!Number.isNaN(margin)) {
            setBroker((b) => ({ ...b, margin }));
          }
        }
        await fetchAccountMetrics();
        if (!silent) {
          // alert.success("Account values updated");
        }
      } catch {
        setStatusError("Failed to refresh account values.");
      } finally {
        setRefreshing(false);
      }
    },
    [user, fetchAccountMetrics, alert]
  );

  // Watch for broker setup completion (set by the add-broker page)
  useEffect(() => {
    if (brokerNeedsRefresh) {
      setBrokerNeedsRefresh(false);
      metricsLoadedForProfileRef.current = null;
      void fetchActiveProfile();
    }
  }, [brokerNeedsRefresh, fetchActiveProfile, setBrokerNeedsRefresh]);

  useEffect(() => {
    void fetchActiveProfile();
  }, [fetchActiveProfile]);

  useEffect(() => {
    if (!metricsOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (metricsDropdownRef.current?.contains(e.target as Node)) return;
      setMetricsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMetricsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [metricsOpen]);

  // Load live E1 / cash metrics once per logged-in profile (no profile bar reload loop).
  useEffect(() => {
    if (broker.loading || !broker.loggedIn || !broker.profileId) {
      if (!broker.loggedIn) {
        metricsLoadedForProfileRef.current = null;
        setAccountMetrics({
          loading: false,
          engine1Total: null,
          engine1Pnl: null,
          engine1Realised: null,
          availableCash: null,
          totalAcValue: null,
        });
      }
      return;
    }

    if (metricsLoadedForProfileRef.current === broker.profileId) return;
    metricsLoadedForProfileRef.current = broker.profileId;
    void fetchAccountMetrics();
  }, [broker.loading, broker.loggedIn, broker.profileId, fetchAccountMetrics]);

  // ── Login handler (for already-verified broker) ──
  const handleBrokerLogin = async () => {
    setLoginError(null);
    const keysOnlyLogin = broker.name === "SHAREINDIA";
    if (!keysOnlyLogin && !password) { setLoginError("Please enter your password / MPIN"); return; }
    if (!broker.profileId || !broker.name) { setLoginError("Profile information missing"); return; }

    setLoggingIn(true);
    try {
      const result = await brokerLoginWithPolling({
        brokerName: broker.name,
        profileId: broker.profileId,
        secret: password,
      });

      if (result.status === "success") {
        alert.success(`${broker.name} login successful`);
        setShowLoginModal(false);
        setPassword("");
        setLoginError(null);
        metricsLoadedForProfileRef.current = null;
        await fetchActiveProfile();
      } else {
        // Surface the exact message from the broker
        setLoginError(result.message || "Login failed. Please check your credentials.");
      }
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoggingIn(false);
    }
  };

  const e1PnlDisplay = e1PnlSum(
    accountMetrics.engine1Pnl,
    accountMetrics.engine1Realised
  );

  return (
    <>
      {/* ── Broker Status Bar ── */}
      <div className="p-4 md:px-8 border-b border-b-base-300">
        <div className="flex justify-between items-center">
          {broker.loading ? (
            <p className="text-sm opacity-70 animate-pulse">Checking broker status...</p>

          ) : !isDemo && (!broker.hasProfile || !broker.verified) ? (
            /* No profile OR setup not completed */
            <div className="flex items-center gap-2">
              <span className="text-sm text-base-content/70">
                {broker.hasProfile ? "Broker setup incomplete" : "No broker connected"}
              </span>
              <button
                onClick={() => {
                  if (broker.hasProfile && broker.profileId && broker.name) {
                    // Skip credentials — pass existing profile to the login step
                    router.push(
                      `/add-broker?profileId=${broker.profileId}&broker=${broker.name}`
                    );
                  } else {
                    router.push("/add-broker");
                  }
                }}
                className="btn btn-primary btn-sm gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                {broker.hasProfile ? "Complete Setup" : "Add Broker"}
              </button>
            </div>

          ) : (
            /* Verified profile */
            <>
              <div className="flex items-center gap-1">
                <span>Broker:</span>
                {broker.loggedIn ? (
                  <span className="font-medium">{broker.name}</span>
                ) : !isDemo ? (
                  <>
                    <span className="text-error font-medium">Not logged in</span>
                    {broker.name && (
                      <button
                        onClick={() => { setShowLoginModal(true); setLoginError(null); }}
                        disabled={loggingIn}
                        className="btn btn-primary btn-sm disabled:!bg-primary disabled:!text-primary-content disabled:opacity-90 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
                      >
                        Login
                      </button>
                    )}
                  </>
                ) : (
                  <span className="font-medium">{broker.name}</span>
                )}
              </div>

              {broker.loggedIn && (
                <div
                  ref={metricsDropdownRef}
                  className={`dropdown dropdown-end ${metricsOpen ? "dropdown-open" : ""}`}
                >
                  <button
                    type="button"
                    aria-expanded={metricsOpen}
                    aria-haspopup="true"
                    aria-label={`Account metrics, margin ${
                      broker.margin != null ? formatMoneyIN(broker.margin, { decimals: 0 }) : "unavailable"
                    }`}
                    className="btn btn-ghost btn-sm h-auto min-h-0 gap-1 px-2 py-1 font-normal normal-case focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    onClick={() => setMetricsOpen((o) => !o)}
                  >
                    <span className="text-sm" aria-hidden="true">
                      <span className="font-medium">Margin:</span>{" "}
                      <span className="tabular-nums">
                        {broker.margin != null
                          ? formatMoneyIN(broker.margin, { decimals: 0 })
                          : "—"}
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 opacity-60 transition-transform ${metricsOpen ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  <ul className="dropdown-content menu z-[200] mt-1 w-56 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg">
                    <li className="pointer-events-none px-2 py-1">
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-base-content/70">E1 Total</span>
                        <span className="tabular-nums font-medium">
                          {accountMetrics.loading
                            ? "…"
                            : accountMetrics.engine1Total != null
                              ? formatMoneyIN(accountMetrics.engine1Total, { decimals: 0 })
                              : "—"}
                        </span>
                      </div>
                    </li>
                    <li className="px-2 py-1">
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-base-content/70">E1 PnL</span>
                        <span className="inline-flex items-center justify-end gap-0.5">
                          {accountMetrics.loading ? (
                            "…"
                          ) : (
                            <>
                              <span
                                className={`tabular-nums font-medium ${signedClass(e1PnlDisplay)}`}
                              >
                                {e1PnlDisplay != null
                                  ? formatMoneyIN(e1PnlDisplay, { decimals: 0 })
                                  : "—"}
                              </span>
                              {(accountMetrics.engine1Pnl != null ||
                                accountMetrics.engine1Realised != null) && (
                                <div className="dropdown dropdown-hover dropdown-end">
                                  <button
                                    type="button"
                                    tabIndex={0}
                                    className="inline-flex cursor-pointer text-base-content/45 hover:text-base-content/70"
                                    aria-label="E1 PnL breakdown"
                                  >
                                    <Info className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                                  </button>
                                  <div
                                    tabIndex={0}
                                    className="dropdown-content z-[210] w-40 rounded-lg border border-base-300 bg-base-100 p-2 text-left text-xs"
                                  >
                                    <div className="flex items-baseline justify-between gap-3">
                                      <span className="text-base-content/55">MTM</span>
                                      <span
                                        className={`tabular-nums ${signedClass(accountMetrics.engine1Pnl)}`}
                                      >
                                        {accountMetrics.engine1Pnl != null
                                          ? formatMoneyIN(accountMetrics.engine1Pnl, {
                                              decimals: 0,
                                            })
                                          : "—"}
                                      </span>
                                    </div>
                                    <div className="mt-1 flex items-baseline justify-between gap-3">
                                      <span className="text-base-content/55">Realised</span>
                                      <span
                                        className={`tabular-nums ${signedClass(
                                          accountMetrics.engine1Realised
                                        )}`}
                                      >
                                        {accountMetrics.engine1Realised != null
                                          ? formatMoneyIN(accountMetrics.engine1Realised, {
                                              decimals: 0,
                                            })
                                          : "—"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </span>
                      </div>
                    </li>
                    <li className="pointer-events-none px-2 py-1">
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-base-content/70">Avl cash</span>
                        <span className="tabular-nums font-medium">
                          {accountMetrics.loading
                            ? "…"
                            : accountMetrics.availableCash != null
                              ? formatMoneyIN(accountMetrics.availableCash, { decimals: 0 })
                              : "—"}
                        </span>
                      </div>
                    </li>
                    <li className="pointer-events-none px-2 py-1 border-t border-base-300/80">
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="font-medium">Total AC</span>
                        <span className="tabular-nums font-semibold">
                          {accountMetrics.loading
                            ? "…"
                            : accountMetrics.totalAcValue != null
                              ? formatMoneyIN(accountMetrics.totalAcValue, { decimals: 0 })
                              : "—"}
                        </span>
                      </div>
                    </li>
                    <li className="mt-1 border-t border-base-300/80 pt-1">
                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        onClick={() => {
                          void refreshAccountValues();
                        }}
                        disabled={refreshing || accountMetrics.loading}
                      >
                        <RotateCw
                          className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                          aria-hidden="true"
                        />
                        Refresh
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
        {statusError && (
          <p className="text-error text-sm mt-2" role="alert">
            {statusError}
          </p>
        )}
      </div>

      {/* ── Login Modal ── */}
      {!isDemo && (
      <dialog
        ref={loginModalRef}
        className="modal"
        aria-labelledby={loginModalHeadingId}
        onClose={() => { setShowLoginModal(false); setPassword(""); setLoginError(null); }}
        onCancel={() => setShowLoginModal(false)}
      >
        <div className="modal-box max-w-md">
          <h3 id={loginModalHeadingId} className="font-bold text-lg mb-2">
            Login to {broker.name}
          </h3>
          <p className="text-sm text-base-content/70 mb-4">
            {broker.name === "SHAREINDIA"
              ? "Share India login uses the app key and app secret saved on your profile. No password is required."
              : `Your ${broker.name === "KOTAKNEO" ? "MPIN" : "password"} is only used to sign in with your broker for this session. We do not store it.`}
          </p>

          <div className="space-y-3">
            {broker.name !== "SHAREINDIA" && (
            <div>
              <label htmlFor={loginPasswordId} className="block text-sm font-medium mb-2">
                {broker.name === "KOTAKNEO" ? "MPIN" : "Password"}
              </label>
              <input
                id={loginPasswordId}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setLoginError(null); }}
                className={`input input-bordered w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${loginError ? "input-error" : ""}`}
                placeholder={`Enter ${broker.name === "KOTAKNEO" ? "MPIN" : "password"}`}
                onKeyDown={(e) => { if (e.key === "Enter") handleBrokerLogin(); }}
                aria-invalid={loginError ? true : undefined}
                aria-describedby={loginError ? `${loginPasswordId}-error` : undefined}
                autoFocus
              />
            </div>
            )}
              {loginError && (
                <div id={`${loginPasswordId}-error`} role="alert" className="flex items-center gap-1.5 text-error text-sm mt-2">
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{loginError}</span>
                </div>
              )}

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => { setShowLoginModal(false); setPassword(""); setLoginError(null); }}
                className="btn btn-ghost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                disabled={loggingIn}
              >
                Cancel
              </button>
              <button
                onClick={handleBrokerLogin}
                disabled={loggingIn || (broker.name !== "SHAREINDIA" && !password)}
                aria-busy={loggingIn}
                className="btn btn-primary disabled:!bg-primary disabled:!text-primary-content disabled:opacity-90 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
              >
                {loggingIn
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />Logging in…</>
                  : "Login"
                }
              </button>
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button aria-label="Close">close</button>
        </form>
      </dialog>
      )}
    </>
  );
}
