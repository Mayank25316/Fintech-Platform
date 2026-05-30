import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useGeneralContext } from "./GeneralContext";

/**
 * StockSearch — live search bar for Indian equity / ETF symbols.
 *
 * Behaviour:
 *  • Debounces keystrokes (350 ms) before hitting GET /api/search?q=
 *  • Backend proxies to Yahoo Finance and filters for .NS / .BO symbols
 *  • Displays a clean dropdown of up to 8 results
 *  • Clicking a result fetches a live quote, then opens TradeWindow with
 *    the stock name + live price pre-filled
 *  • Falls back to an empty results list (never crashes) on API error
 *  • Closes dropdown on outside click or Escape key
 *
 * withCredentials: true is set on all axios calls.
 */

const DEBOUNCE_MS = 350;
const API = import.meta.env.VITE_API_URL;

export default function StockSearch() {
    const { openTradeWindow } = useGeneralContext();

    const [query,      setQuery]      = useState("");
    const [results,    setResults]    = useState([]);
    const [isOpen,     setIsOpen]     = useState(false);
    const [isLoading,  setIsLoading]  = useState(false);
    const [activeIdx,  setActiveIdx]  = useState(-1);   // keyboard nav index
    const [priceLoading, setPriceLoading] = useState(null); // symbol being fetched

    const wrapperRef  = useRef(null);
    const inputRef    = useRef(null);
    const debounceRef = useRef(null);
    const abortRef    = useRef(null); // AbortController for in-flight search

    // ── Outside click → close ──────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
                setActiveIdx(-1);
            }
        };
        document.addEventListener("mousedown", handler, true);
        return () => document.removeEventListener("mousedown", handler, true);
    }, []);

    // ── Escape key → close ─────────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Escape") { setIsOpen(false); setActiveIdx(-1); }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    // ── Debounced search ───────────────────────────────────────────────────────
    useEffect(() => {
        const trimmed = query.trim();

        if (!trimmed) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        // Cancel the previous debounce
        clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            // Abort any in-flight previous request
            if (abortRef.current) abortRef.current.abort();
            abortRef.current = new AbortController();

            setIsLoading(true);
            try {
                const res = await axios.get(`${API}/api/search`, {
                    params:          { q: trimmed },
                    withCredentials: true,
                    signal:          abortRef.current.signal,
                });

                const data = res.data;
                // If backend returns success:false or empty, show empty list — never crash
                if (data.success && Array.isArray(data.results)) {
                    setResults(data.results);
                    setIsOpen(data.results.length > 0);
                } else {
                    setResults([]);
                    setIsOpen(false);
                }
            } catch (err) {
                if (axios.isCancel(err) || err.name === "CanceledError") return; // deliberate abort
                console.warn("[StockSearch] search error:", err.message);
                setResults([]);   // graceful fallback — never crash UI
                setIsOpen(false);
            } finally {
                setIsLoading(false);
            }
        }, DEBOUNCE_MS);

        return () => clearTimeout(debounceRef.current);
    }, [query]);

    // ── Fetch live price → open TradeWindow ───────────────────────────────────
    const handleSelect = useCallback(async (result) => {
        setIsOpen(false);
        setQuery("");
        setResults([]);
        setPriceLoading(result.symbol);

        try {
            const res = await axios.get(`${API}/api/quotes`, {
                params:          { symbols: result.fullSymbol },
                withCredentials: true,
            });

            const pricesMap = res.data?.data ?? {};
            const priceData = pricesMap[result.symbol];
            const livePrice = priceData?.price ?? 0;

            openTradeWindow({ name: result.symbol, price: livePrice }, "BUY");
        } catch (err) {
            console.warn("[StockSearch] price fetch error:", err.message);
            // Open TradeWindow with price 0 — user can edit it manually
            openTradeWindow({ name: result.symbol, price: 0 }, "BUY");
        } finally {
            setPriceLoading(null);
        }
    }, [openTradeWindow]);

    // ── Keyboard navigation inside dropdown ───────────────────────────────────
    const handleKeyDown = (e) => {
        if (!isOpen || results.length === 0) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, results.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && activeIdx >= 0) {
            e.preventDefault();
            handleSelect(results[activeIdx]);
        }
    };

    // ── Exchange badge colour ─────────────────────────────────────────────────
    const exchangeColour = (exchange) => {
        if (exchange === "NSE") return { bg: "#e8f5e9", color: "#2e7d32" };
        if (exchange === "BSE") return { bg: "#e3f2fd", color: "#1565c0" };
        return { bg: "#f3e5f5", color: "#6a1b9a" };
    };

    return (
        <div className="ss-wrapper" ref={wrapperRef}>

            {/* ── Search input ────────────────────────────────────────────── */}
            <div className={`ss-input-row ${isLoading ? "ss-loading" : ""}`}>
                {/* Search icon */}
                <svg className="ss-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>

                <input
                    ref={inputRef}
                    id="stock-search"
                    type="text"
                    className="ss-input"
                    placeholder="Search stocks… e.g. INFY, TCS"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setActiveIdx(-1); }}
                    onFocus={() => results.length > 0 && setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    aria-autocomplete="list"
                    aria-controls="ss-dropdown"
                    aria-expanded={isOpen}
                />

                {/* Spinner or clear button */}
                {isLoading ? (
                    <span className="ss-spinner" aria-label="Searching…" />
                ) : query ? (
                    <button
                        className="ss-clear-btn"
                        onClick={() => { setQuery(""); setResults([]); setIsOpen(false); inputRef.current?.focus(); }}
                        aria-label="Clear search"
                        tabIndex={-1}
                    >✕</button>
                ) : null}
            </div>

            {/* ── Results dropdown ────────────────────────────────────────── */}
            {isOpen && results.length > 0 && (
                <ul
                    id="ss-dropdown"
                    className="ss-dropdown"
                    role="listbox"
                    aria-label="Stock search results"
                >
                    {results.map((r, i) => {
                        const { bg, color } = exchangeColour(r.exchange);
                        const isActive = i === activeIdx;
                        const isFetching = priceLoading === r.symbol;

                        return (
                            <li
                                key={r.fullSymbol}
                                role="option"
                                aria-selected={isActive}
                                className={`ss-result-row ${isActive ? "ss-active" : ""}`}
                                onMouseEnter={() => setActiveIdx(i)}
                                onMouseDown={(e) => e.preventDefault()} // keep input focus
                                onClick={() => handleSelect(r)}
                            >
                                <div className="ss-result-left">
                                    <span className="ss-result-symbol">{r.symbol}</span>
                                    <span
                                        className="ss-exchange-badge"
                                        style={{ background: bg, color }}
                                    >
                                        {r.exchange}
                                    </span>
                                </div>
                                <div className="ss-result-right">
                                    <span className="ss-result-name" title={r.name}>{r.name}</span>
                                    {isFetching
                                        ? <span className="ss-spinner ss-spinner-dark" />
                                        : <span className="ss-result-type">{r.type}</span>
                                    }
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
