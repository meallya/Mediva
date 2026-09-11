import React, { useEffect } from "react";

/*
|--------------------------------------------------------------------------
| KEYBOARD SUBMIT
|--------------------------------------------------------------------------
|
| Pemakaian:
|
| <div data-enter-scope>
|
|     <input />
|
|     <button
|         data-enter-primary
|         onClick={handleSave}
|     >
|         Simpan
|     </button>
|
| </div>
|
| Tekan Enter dari input:
| → tombol primary diklik.
|
| Enter TIDAK bekerja dari:
| → textarea
| → select
| → button
| → link
| → contenteditable
| → elemen dalam data-enter-ignore
|
*/

export default function KeyboardSubmit() {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key !== "Enter") {
                return;
            }

            if (
                event.shiftKey ||
                event.ctrlKey ||
                event.altKey ||
                event.metaKey
            ) {
                return;
            }

            if (event.isComposing) {
                return;
            }

            const target = event.target;

            if (!(target instanceof HTMLElement)) {
                return;
            }

            /*
                |--------------------------------------------------------------------------
                | AREA YANG TIDAK BOLEH AUTO SUBMIT
                |--------------------------------------------------------------------------
                */

            if (target.closest("[data-enter-ignore='true']")) {
                return;
            }

            const tag = target.tagName.toLowerCase();

            if (["textarea", "select", "button", "a"].includes(tag)) {
                return;
            }

            if (target.isContentEditable) {
                return;
            }

            /*
                |--------------------------------------------------------------------------
                | CARI SCOPE
                |--------------------------------------------------------------------------
                */

            const scope = target.closest("[data-enter-scope]");

            if (!scope) {
                return;
            }

            /*
                |--------------------------------------------------------------------------
                | CARI PRIMARY BUTTON
                |--------------------------------------------------------------------------
                */

            const button = scope.querySelector("[data-enter-primary]");

            if (!button || button.disabled) {
                return;
            }

            event.preventDefault();

            button.click();
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return null;
}
