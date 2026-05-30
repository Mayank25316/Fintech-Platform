import { useEffect, useRef } from "react";

/**
 * useClickOutside
 *
 * Fires `callback` whenever the user clicks outside the element
 * referenced by the returned `ref`.
 *
 * Usage:
 *   const ref = useClickOutside(() => setOpen(false));
 *   return <div ref={ref}>...</div>;
 *
 * @param {() => void} callback   called on outside click
 * @param {boolean}    [active]   set to false to pause listening (default: true)
 */
export default function useClickOutside(callback, active = true) {
    const ref = useRef(null);

    useEffect(() => {
        if (!active) return;

        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                callback();
            }
        };

        // Use capture phase so the event fires before React's bubble phase handlers
        document.addEventListener("mousedown", handleClick, true);
        return () => document.removeEventListener("mousedown", handleClick, true);
    }, [callback, active]);

    return ref;
}
