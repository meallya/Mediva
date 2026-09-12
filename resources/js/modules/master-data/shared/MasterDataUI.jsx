import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faMagnifyingGlass,
    faPlus,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";

export function MasterDataHeader({
    title,
    subtitle,
    buttonLabel,
    onCreate,
    icon,
}) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-[16px]">
            <div>
                <div className="flex items-center gap-[10px]">
                    {icon && (
                        <span className="flex h-[36px] w-[36px] items-center justify-center rounded-[9px] bg-[#eaf4ff] text-[#047AF7]">
                            <FontAwesomeIcon icon={icon} />
                        </span>
                    )}

                    <h1 className="text-[24px] font-semibold text-[#212121]">
                        {title}
                    </h1>
                </div>

                <p className="mt-[5px] text-[12px] text-[#626262]">
                    {subtitle}
                </p>
            </div>

            {onCreate && (
                <button
                    type="button"
                    onClick={onCreate}
                    className="inline-flex h-[40px] items-center gap-[8px] rounded-[9px] bg-[#047AF7] px-[15px] text-[13px] font-medium text-white transition hover:bg-[#006fe6]"
                >
                    <FontAwesomeIcon icon={faPlus} />
                    {buttonLabel}
                </button>
            )}
        </div>
    );
}

export function MasterDataAlert({ error, success }) {
    return (
        <>
            {error && (
                <div className="mt-[16px] rounded-[10px] border border-red-200 bg-red-50 px-[14px] py-[12px] text-[14px] text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className="mt-[16px] rounded-[10px] border border-emerald-200 bg-emerald-50 px-[14px] py-[12px] text-[14px] text-emerald-700">
                    {success}
                </div>
            )}
        </>
    );
}

export function SearchBox({
    value,
    onChange,
    placeholder,
}) {
    return (
        <div className="flex h-[42px] items-center gap-[9px] rounded-[9px] border border-[#dddddd] bg-white px-[12px]">
            <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="text-[13px] text-[#aaaaaa]"
            />

            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="w-full bg-transparent text-[13px] text-[#343434] outline-none"
            />
        </div>
    );
}

export function StatusBadge({ active }) {
    return (
        <span
            className={`inline-flex rounded-full border px-[8px] py-[4px] text-[11px] font-medium ${
                active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 bg-gray-50 text-gray-600"
            }`}
        >
            {active ? "Aktif" : "Nonaktif"}
        </span>
    );
}

export function Pagination({
    meta,
    loading,
    onPageChange,
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-[10px] border-t border-[#eeeeee] px-[16px] py-[14px]">
            <p className="text-[12px] text-[#888888]">
                Total {meta.total ?? 0} data
            </p>

            <div className="flex items-center gap-[8px]">
                <button
                    type="button"
                    disabled={(meta.current_page ?? 1) <= 1 || loading}
                    onClick={() => onPageChange((meta.current_page ?? 1) - 1)}
                    className="rounded-[8px] border border-[#dddddd] px-[12px] py-[7px] text-[12px] text-[#555555] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Sebelumnya
                </button>

                <span className="text-[12px] text-[#666666]">
                    {meta.current_page ?? 1} / {meta.last_page ?? 1}
                </span>

                <button
                    type="button"
                    disabled={
                        (meta.current_page ?? 1) >= (meta.last_page ?? 1)
                        || loading
                    }
                    onClick={() => onPageChange((meta.current_page ?? 1) + 1)}
                    className="rounded-[8px] border border-[#dddddd] px-[12px] py-[7px] text-[12px] text-[#555555] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Berikutnya
                </button>
            </div>
        </div>
    );
}

export function Modal({
    title,
    subtitle,
    onClose,
    children,
}) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 px-[20px] py-[24px] backdrop-blur-[1px]">
            <div className="max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-[15px] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eeeeee] bg-white px-[22px] py-[17px]">
                    <div>
                        <h2 className="text-[16px] font-semibold text-[#212121]">
                            {title}
                        </h2>
                        <p className="mt-[3px] text-[12px] text-[#888888]">
                            {subtitle}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] text-[#999999] transition hover:bg-[#f5f5f5]"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                {children}
            </div>
        </div>
    );
}

export function Field({
    label,
    required = false,
    helper,
    children,
}) {
    return (
        <label className="block">
            <span className="mb-[6px] block text-[12px] font-medium text-[#555555]">
                {label}
                {required && <span className="ml-[3px] text-red-500">*</span>}
            </span>

            {children}

            {helper && (
                <span className="mt-[5px] block text-[11px] text-[#999999]">
                    {helper}
                </span>
            )}
        </label>
    );
}

export function TableEmpty({
    loading,
    colSpan,
    emptyText,
}) {
    return (
        <tr>
            <td
                colSpan={colSpan}
                className="px-[16px] py-[35px] text-center text-[13px] text-[#999999]"
            >
                {loading ? "Memuat data..." : emptyText}
            </td>
        </tr>
    );
}

export function Th({ children }) {
    return (
        <th className="px-[14px] py-[12px] text-left text-[11px] font-semibold uppercase tracking-[0.4px] text-[#777777]">
            {children}
        </th>
    );
}

export function Td({ children, className = "" }) {
    return (
        <td className={`px-[14px] py-[13px] text-[13px] text-[#555555] ${className}`}>
            {children}
        </td>
    );
}
