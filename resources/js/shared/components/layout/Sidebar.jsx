import React, { useEffect, useMemo, useRef, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

import useAuth from "../../../modules/auth/hooks/useAuth";

import navigation from "../../constants/navigation";

export default function Sidebar() {
  const navigate = useNavigate();

  const location = useLocation();

  const { permissions = [] } = useAuth();

  /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

  const [openGroup, setOpenGroup] = useState(null);

  const [isScrolling, setIsScrolling] = useState(false);

  const scrollTimeout = useRef(null);

  /*
    |--------------------------------------------------------------------------
    | PERMISSION
    |--------------------------------------------------------------------------
    */

  const canAccess = (item) => {
    if (!item.permissions || item.permissions.length === 0) return true;
    return item.permissions.some((permission) =>
      permissions.includes(permission),
    );
  };

  /*
    |--------------------------------------------------------------------------
    | FILTER NAVIGATION
    |--------------------------------------------------------------------------
    */

  const visibleNavigation = useMemo(() => {
    return navigation
      .map((item) => {
        /*
                |--------------------------------------------------------------------------
                | SINGLE LINK
                |--------------------------------------------------------------------------
                */

        if (item.type === "link") {
          return canAccess(item) ? item : null;
        }

        /*
                |--------------------------------------------------------------------------
                | GROUP / DROPDOWN
                |--------------------------------------------------------------------------
                */

        if (item.type === "group") {
          /*
                    |--------------------------------------------------------------------------
                    | CHECK PARENT PERMISSION
                    |--------------------------------------------------------------------------
                    */

          if (!canAccess(item)) {
            return null;
          }

          /*
                    |--------------------------------------------------------------------------
                    | FILTER CHILDREN
                    |--------------------------------------------------------------------------
                    */

          const children = item.children.filter((child) => canAccess(child));

          /*
                    |--------------------------------------------------------------------------
                    | HIDE EMPTY GROUP
                    |--------------------------------------------------------------------------
                    */

          if (children.length === 0) {
            return null;
          }

          return {
            ...item,

            children,
          };
        }

        return null;
      })
      .filter(Boolean);
  }, [permissions]);

  /*
    |--------------------------------------------------------------------------
    | PATH MATCH
    |--------------------------------------------------------------------------
    */

  const matchesPath = (path) => {
    if (!path) {
      return false;
    }

    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  /*
    |--------------------------------------------------------------------------
    | ACTIVE CHILD
    |--------------------------------------------------------------------------
    |
    | Ambil route yang PALING SPESIFIK.
    |
    | Contoh:
    |
    | /billing
    | /billing/transactions
    |
    | Saat URL:
    | /billing/transactions
    |
    | yang aktif hanya:
    | /billing/transactions
    |
    */

  const getActiveChildPath = (children = []) => {
    const matches = children
      .filter((child) => {
        if (!child.path || !child.available) {
          return false;
        }

        return matchesPath(child.path);
      })
      .sort((first, second) => second.path.length - first.path.length);

    return matches[0]?.path ?? null;
  };

  /*
    |--------------------------------------------------------------------------
    | ACTIVE SINGLE LINK
    |--------------------------------------------------------------------------
    */

  const isActiveSingleLink = (path) => {
    if (!path) {
      return false;
    }

    /*
        |--------------------------------------------------------------------------
        | DASHBOARD
        |--------------------------------------------------------------------------
        */

    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    /*
        |--------------------------------------------------------------------------
        | NORMAL LINK
        |--------------------------------------------------------------------------
        */

    return matchesPath(path);
  };

  /*
    |--------------------------------------------------------------------------
    | ACTIVE GROUP
    |--------------------------------------------------------------------------
    */

  const getActiveGroup = () => {
    const activeGroup = visibleNavigation.find((item) => {
      if (item.type !== "group") {
        return false;
      }

      return Boolean(getActiveChildPath(item.children));
    });

    return activeGroup?.label ?? null;
  };

  /*
    |--------------------------------------------------------------------------
    | AUTO OPEN ACTIVE GROUP
    |--------------------------------------------------------------------------
    */

  useEffect(() => {
    const activeGroup = getActiveGroup();

    if (activeGroup) {
      setOpenGroup(activeGroup);
    }
  }, [location.pathname, visibleNavigation]);

  /*
    |--------------------------------------------------------------------------
    | TOGGLE GROUP
    |--------------------------------------------------------------------------
    */

  const handleToggleGroup = (label) => {
    setOpenGroup((current) => (current === label ? null : label));
  };

  /*
    |--------------------------------------------------------------------------
    | NAVIGATE
    |--------------------------------------------------------------------------
    */

  const handleNavigate = (item) => {
    /*
        |--------------------------------------------------------------------------
        | COMING SOON
        |--------------------------------------------------------------------------
        */

    if (!item.available) {
      return;
    }

    /*
        |--------------------------------------------------------------------------
        | NAVIGATE
        |--------------------------------------------------------------------------
        */

    navigate(item.path);
  };

  /*
    |--------------------------------------------------------------------------
    | SCROLLBAR
    |--------------------------------------------------------------------------
    */

  const handleScroll = () => {
    setIsScrolling(true);

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 700);
  };

  /*
    |--------------------------------------------------------------------------
    | CLEANUP
    |--------------------------------------------------------------------------
    */

  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

  return (
    <aside
      className="
                fixed
                bottom-0
                left-0
                top-0
                z-30
                flex
                w-[255px]
                flex-col
                overflow-hidden
                border-r
                border-[#eeeeee]
                bg-white
            "
    >
      {/* =============================================================
                LOGO
            ============================================================== */}

      <div
        className="
                    flex
                    h-[88px]
                    shrink-0
                    items-center
                    justify-center
                    border-b
                    border-[#eeeeee]
                    bg-white
                "
      >
        <img
          src="/images/mediva.png"
          alt="MEDIVA"
          className="
                        h-auto
                        w-[155px]
                        object-contain
                    "
        />
      </div>

      {/* =============================================================
                NAVIGATION
            ============================================================== */}

      <nav
        onScroll={handleScroll}
        style={{
          scrollbarGutter: "stable",
        }}
        className={`
                    mediva-sidebar-scroll
                    flex-1
                    overflow-y-auto
                    overflow-x-hidden
                    px-[16px]
                    py-[20px]

                    ${isScrolling ? "is-scrolling" : ""}
                `}
      >
        <div className="space-y-[5px]">
          {visibleNavigation.map((item) => {
            /*
                        |--------------------------------------------------------------------------
                        | SINGLE LINK
                        |--------------------------------------------------------------------------
                        */

            if (item.type === "link") {
              const active = isActiveSingleLink(item.path);

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleNavigate(item)}
                  className={`
                                        flex
                                        min-h-[44px]
                                        w-full
                                        items-center
                                        gap-[12px]
                                        rounded-[10px]
                                        px-[13px]
                                        text-left
                                        text-[13px]
                                        font-medium
                                        transition-all
                                        duration-200

                                        ${
                                          active
                                            ? "bg-[#C2E1F4]/40 text-[#047AF7]"
                                            : "text-[#626262] hover:bg-[#C2E1F4]/15 hover:text-[#047AF7]"
                                        }
                                    `}
                >
                  {/* ICON */}

                  <div
                    className="
                                            flex
                                            w-[19px]
                                            shrink-0
                                            items-center
                                            justify-center
                                        "
                  >
                    <FontAwesomeIcon icon={item.icon} className="text-[14px]" />
                  </div>

                  {/* LABEL */}

                  <span>{item.label}</span>
                </button>
              );
            }

            /*
                        |--------------------------------------------------------------------------
                        | GROUP
                        |--------------------------------------------------------------------------
                        */

            const isOpen = openGroup === item.label;

            /*
                        |--------------------------------------------------------------------------
                        | ACTIVE CHILD PALING SPESIFIK
                        |--------------------------------------------------------------------------
                        */

            const activeChildPath = getActiveChildPath(item.children);

            const hasActiveChild = Boolean(activeChildPath);

            return (
              <div key={item.label}>
                {/* =================================================
                                    PARENT
                                ================================================== */}

                <button
                  type="button"
                  onClick={() => handleToggleGroup(item.label)}
                  className={`
                                        flex
                                        min-h-[44px]
                                        w-full
                                        items-center
                                        gap-[12px]
                                        rounded-[10px]
                                        px-[13px]
                                        text-left
                                        text-[13px]
                                        font-medium
                                        transition-all
                                        duration-200

                                        ${
                                          hasActiveChild
                                            ? "text-[#047AF7]"
                                            : "text-[#626262] hover:bg-[#C2E1F4]/15 hover:text-[#047AF7]"
                                        }

                                        ${isOpen ? "bg-[#C2E1F4]/15" : ""}
                                    `}
                >
                  {/* ICON */}

                  <div
                    className="
                                            flex
                                            w-[19px]
                                            shrink-0
                                            items-center
                                            justify-center
                                        "
                  >
                    <FontAwesomeIcon icon={item.icon} className="text-[14px]" />
                  </div>

                  {/* LABEL */}

                  <span className="flex-1">{item.label}</span>

                  {/* ARROW */}

                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`
                                            text-[10px]
                                            text-[#B4B4B4]
                                            transition-transform
                                            duration-200

                                            ${isOpen ? "rotate-180" : ""}
                                        `}
                  />
                </button>

                {/* =================================================
                                    CHILDREN
                                ================================================== */}

                <div
                  className={`
                                        grid
                                        overflow-hidden
                                        transition-all
                                        duration-200

                                        ${
                                          isOpen
                                            ? "grid-rows-[1fr] opacity-100"
                                            : "grid-rows-[0fr] opacity-0"
                                        }
                                    `}
                >
                  <div className="min-h-0">
                    <div
                      className="
                                                relative
                                                ml-[22px]
                                                mt-[4px]
                                                space-y-[2px]
                                                border-l
                                                border-[#e9edf2]
                                                pb-[5px]
                                                pl-[13px]
                                            "
                    >
                      {item.children.map((child) => {
                        /*
                                                    |--------------------------------------------------------------------------
                                                    | HANYA SATU CHILD ACTIVE
                                                    |--------------------------------------------------------------------------
                                                    */

                        const active = child.path === activeChildPath;

                        return (
                          <button
                            key={child.path}
                            type="button"
                            disabled={!child.available}
                            title={
                              child.available
                                ? child.label
                                : `${child.label} - Sedang dikembangkan`
                            }
                            onClick={() => handleNavigate(child)}
                            className={`
                                                                flex
                                                                min-h-[38px]
                                                                w-full
                                                                items-center
                                                                gap-[10px]
                                                                rounded-[8px]
                                                                px-[10px]
                                                                text-left
                                                                transition-all
                                                                duration-200

                                                                ${
                                                                  active &&
                                                                  child.available
                                                                    ? "bg-[#C2E1F4]/35 text-[#047AF7]"
                                                                    : ""
                                                                }

                                                                ${
                                                                  child.available &&
                                                                  !active
                                                                    ? "text-[#626262] hover:bg-[#C2E1F4]/15 hover:text-[#047AF7]"
                                                                    : ""
                                                                }

                                                                ${
                                                                  !child.available
                                                                    ? "cursor-default text-[#B4B4B4]"
                                                                    : ""
                                                                }
                                                            `}
                          >
                            {/* ICON */}

                            <div
                              className="
                                                                    flex
                                                                    w-[16px]
                                                                    shrink-0
                                                                    items-center
                                                                    justify-center
                                                                "
                            >
                              <FontAwesomeIcon
                                icon={child.icon}
                                className="text-[12px]"
                              />
                            </div>

                            {/* LABEL */}

                            <span
                              className="
                                                                    flex-1
                                                                    truncate
                                                                    text-[12px]
                                                                    font-medium
                                                                "
                            >
                              {child.label}
                            </span>

                            {/* SOON */}

                            {!child.available && (
                              <span
                                className="
                                                                        shrink-0
                                                                        rounded-[5px]
                                                                        bg-[#f3f4f6]
                                                                        px-[6px]
                                                                        py-[3px]
                                                                        text-[9px]
                                                                        font-medium
                                                                        text-[#B4B4B4]
                                                                    "
                              >
                                Soon
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
