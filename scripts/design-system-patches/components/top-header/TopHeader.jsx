import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "../button/Button.jsx";
import { Icon } from "../icon/Icon.jsx";
import { IconButton } from "../icon-button/IconButton.jsx";
import { Menu, MenuSection, MenuItem } from "../menu/Menu.jsx";
import { SideNav, SideNavGroup, SideNavItem } from "../side-nav/SideNav.jsx";
import "./top-header.css";

// ── Helpers ────────────────────────────────────────────────────────────────────

// Split a flat items array into sections separated by { divider: true } markers.
function splitIntoSections(items) {
  const sections = [];
  let current = [];
  for (const item of items) {
    if (item.divider) {
      sections.push(current);
      current = [];
    } else {
      current.push(item);
    }
  }
  if (current.length > 0) sections.push(current);
  return sections;
}

const menuFocusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getMenuFocusableElements(container) {
  return [...container.querySelectorAll(menuFocusableSelector)].filter((element) => {
    if (element.getAttribute("aria-disabled") === "true") return false;
    return element.getClientRects().length > 0;
  });
}

function NavMenuItem({ item, onClose }) {
  const [open, setOpen] = useState(false);
  const [flyoutPlacement, setFlyoutPlacement] = useState("end");
  const [flyoutMaxHeight, setFlyoutMaxHeight] = useState(undefined);
  const flyoutRef = useRef(null);
  const hasFlyout = item.items?.length > 0;
  const sections = hasFlyout ? splitIntoSections(item.items) : [];
  const Trigger = item.href ? "a" : "button";

  const triggerProps = item.href
    ? {
        href: item.href,
        onClick: (event) => { item.onClick?.(event); onClose?.(); },
      }
    : {
        type: "button",
        onClick: () => setOpen((next) => !next),
      };

  const focusFirstFlyoutItem = () => {
    requestAnimationFrame(() => {
      flyoutRef.current?.querySelector("a, button")?.focus();
    });
  };

  const openFlyoutFromKeyboard = () => {
    setOpen(true);
    focusFirstFlyoutItem();
  };

  useLayoutEffect(() => {
    if (!hasFlyout || !open) return undefined;

    const updateFlyoutLayout = () => {
      const flyout = flyoutRef.current;
      const trigger = flyout
        ?.closest(".a1-top-header__flyout-wrap")
        ?.querySelector(".a1-top-header__flyout-trigger");
      if (!flyout || !trigger) return;

      const viewportMargin = 8;
      const triggerRect = trigger.getBoundingClientRect();
      const flyoutRect = flyout.getBoundingClientRect();
      const rightSpace = window.innerWidth - triggerRect.right - viewportMargin;
      const leftSpace = triggerRect.left - viewportMargin;
      const nextPlacement = rightSpace >= flyoutRect.width || rightSpace >= leftSpace
        ? "end"
        : "start";
      const maxHeight = Math.max(1, window.innerHeight - flyoutRect.top - viewportMargin);

      setFlyoutPlacement(nextPlacement);
      setFlyoutMaxHeight(`${Math.floor(maxHeight)}px`);
    };

    updateFlyoutLayout();
    window.addEventListener("resize", updateFlyoutLayout);
    window.addEventListener("scroll", updateFlyoutLayout, true);
    return () => {
      window.removeEventListener("resize", updateFlyoutLayout);
      window.removeEventListener("scroll", updateFlyoutLayout, true);
    };
  }, [hasFlyout, open]);

  if (!hasFlyout) {
    return (
      <MenuItem
        icon={item.icon}
        href={item.href}
        active={!!item.active}
        onClick={(event) => { item.onClick?.(event); onClose?.(); }}
      >
        {item.label}
      </MenuItem>
    );
  }

  return (
    <div
      className="a1-top-header__flyout-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Trigger
        className={["a1-menu-item", "a1-top-header__flyout-trigger", item.active && "a1-menu-item--active"].filter(Boolean).join(" ")}
        aria-expanded={open}
        aria-current={item.active ? "page" : undefined}
        aria-haspopup="menu"
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFlyoutFromKeyboard();
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            openFlyoutFromKeyboard();
          }
        }}
        {...triggerProps}
      >
        {item.icon && (
          <Icon
            name={item.icon}
            className="a1-menu-item__icon a1-top-header__flyout-icon"
            aria-hidden="true"
          />
        )}
        <span className="a1-menu-item__label a1-top-header__flyout-label">
          {item.label}
        </span>
        <Icon
          name="chevron_right"
          className="a1-top-header__flyout-chevron"
          aria-hidden="true"
        />
      </Trigger>

      {open && (
        <div
          ref={flyoutRef}
          className="a1-top-header__flyout-menu"
          data-placement={flyoutPlacement}
          style={{ "--a1-top-header-flyout-max-block-size": flyoutMaxHeight }}
          role="menu"
          aria-label={`${item.label} submenu`}
          onKeyDown={(event) => {
            if (event.key === "Tab") {
              const focusableElements = getMenuFocusableElements(event.currentTarget);
              if (focusableElements.length === 0) {
                event.preventDefault();
                return;
              }

              const firstElement = focusableElements[0];
              const lastElement = focusableElements[focusableElements.length - 1];

              if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
              } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
              }
              event.stopPropagation();
              return;
            }

            if (event.key === "ArrowLeft" || event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
              event.currentTarget
                .closest(".a1-top-header__flyout-wrap")
                ?.querySelector(".a1-top-header__flyout-trigger")
                ?.focus();
            }
          }}
        >
          {sections.map((section, i) => (
            <MenuSection key={i}>
              {section.map((sub) => (
                <NavMenuItem key={sub.label} item={sub} onClose={onClose} />
              ))}
            </MenuSection>
          ))}
        </div>
      )}
    </div>
  );
}

// ── NavItem (desktop) ──────────────────────────────────────────────────────────

function NavItem({ item, openId, onOpen }) {
  const triggerRef = useRef(null);
  const hasSubmenu = item.items?.length > 0;
  const hasRoute = !!item.href;
  const isOpen = hasSubmenu && openId === item.id;
  const isIconOnly = !!item.iconOnly;
  const sections = hasSubmenu ? splitIntoSections(item.items) : [];

  const itemClass = [
    "a1-top-header__nav-item",
    hasSubmenu && hasRoute && "a1-top-header__nav-item--split",
  ]
    .filter(Boolean)
    .join(" ");

  const linkClass = [
    "a1-top-header__nav-link",
    item.active && "a1-top-header__nav-link--active",
    isIconOnly && "a1-top-header__nav-link--icon-only",
  ]
    .filter(Boolean)
    .join(" ");

  const linkContent = (
    <>
      {item.icon && (
        <Icon
          name={item.icon}
          className="a1-top-header__nav-link-icon"
          aria-hidden="true"
        />
      )}
      {!isIconOnly && <span>{item.label}</span>}
    </>
  );

  const submenuChevron = (
    hasSubmenu && (
      <Icon
        name="expand_more"
        className="a1-top-header__nav-chevron"
        aria-hidden="true"
      />
    )
  );

  const submenuButtonContent = (
    <>
      {linkContent}
      {submenuChevron}
    </>
  );

  return (
    <li className={itemClass}>
      {hasSubmenu && hasRoute ? (
        <>
          <a
            href={item.href}
            className={linkClass}
            aria-current={item.active ? "page" : undefined}
            aria-label={isIconOnly ? item.label : undefined}
            onClick={item.onClick}
          >
            {linkContent}
          </a>
          <button
            ref={triggerRef}
            type="button"
            className="a1-top-header__nav-link a1-top-header__nav-submenu-trigger"
            aria-expanded={isOpen}
            aria-haspopup="menu"
            aria-label={`${item.label} submenu`}
            onClick={() => onOpen(isOpen ? null : item.id)}
          >
            {submenuChevron}
          </button>
          <Menu
            open={isOpen}
            onClose={() => onOpen(null)}
            anchorRef={triggerRef}
            aria-label={`${item.label} submenu`}
            className="a1-menu--with-flyouts"
          >
            {sections.map((section, i) => (
              <MenuSection key={i}>
                {section.map((sub) => (
                  <NavMenuItem
                    key={sub.label}
                    item={sub}
                    onClose={() => onOpen(null)}
                  />
                ))}
              </MenuSection>
            ))}
          </Menu>
        </>
      ) : hasSubmenu ? (
        <>
          <button
            ref={triggerRef}
            type="button"
            className={linkClass}
            aria-expanded={isOpen}
            aria-haspopup="menu"
            aria-current={item.active ? "page" : undefined}
            aria-label={isIconOnly ? item.label : undefined}
            onClick={() => onOpen(isOpen ? null : item.id)}
          >
            {submenuButtonContent}
          </button>
          <Menu
            open={isOpen}
            onClose={() => onOpen(null)}
            anchorRef={triggerRef}
            aria-label={`${item.label} submenu`}
            className="a1-menu--with-flyouts"
          >
            {sections.map((section, i) => (
              <MenuSection key={i}>
                {section.map((sub) => (
                  <NavMenuItem
                    key={sub.label}
                    item={sub}
                    onClose={() => onOpen(null)}
                  />
                ))}
              </MenuSection>
            ))}
          </Menu>
        </>
      ) : item.href ? (
        <a
          href={item.href}
          className={linkClass}
          aria-current={item.active ? "page" : undefined}
          aria-label={isIconOnly ? item.label : undefined}
          onClick={item.onClick}
        >
          {linkContent}
        </a>
      ) : (
        <button
          type="button"
          className={linkClass}
          aria-current={item.active ? "page" : undefined}
          aria-label={isIconOnly ? item.label : undefined}
          onClick={item.onClick}
        >
          {linkContent}
        </button>
      )}
    </li>
  );
}

/*
 * Mobile nav renders submenu parents as groups. When a parent also has a route,
 * the first child links to that parent page so the route remains reachable.
 */
function getMobileSubItems(item) {
  if (!item.href) return (item.items ?? []).filter((sub) => !sub.divider);

  return [
    {
      icon: item.icon,
      label: item.label,
      href: item.href,
      onClick: item.onClick,
    },
    ...(item.items ?? []),
  ].filter((sub) => !sub.divider);
}

function MobileDrawerItem({ item, onClose }) {
  const children = (item.items ?? []).filter((sub) => !sub.divider);

  if (children.length > 0) {
    return (
      <SideNavGroup icon={item.icon} label={item.label}>
        {item.href && (
          <SideNavItem
            as="a"
            href={item.href}
            icon={item.icon}
            label="Overview"
            onClick={(event) => { item.onClick?.(event); onClose(); }}
          />
        )}
        {children.map((sub) => (
          <MobileDrawerItem key={sub.label} item={sub} onClose={onClose} />
        ))}
      </SideNavGroup>
    );
  }

  return (
    <SideNavItem
      as={item.href ? "a" : "button"}
      href={item.href}
      icon={item.icon}
      label={item.label}
      onClick={(event) => { item.onClick?.(event); onClose(); }}
    />
  );
}

// ── ActionMenu ─────────────────────────────────────────────────────────────────

function ActionMenu({ action, isOpen, onToggle }) {
  const btnRef = useRef(null);
  const hasItems = (action.items?.length ?? 0) > 0;
  const sections = hasItems ? splitIntoSections(action.items) : [];

  return (
    <div className="a1-top-header__action">
      <div
        ref={btnRef}
        className={action.badge ? "a1-top-header__action-badge-wrap" : undefined}
        data-count={action.badge || undefined}
      >
        <IconButton
          icon={action.icon}
          label={action.label}
          aria-expanded={hasItems ? isOpen : undefined}
          aria-haspopup={hasItems ? "menu" : undefined}
          onClick={hasItems ? onToggle : action.onClick}
        />
      </div>

      {hasItems && (
        <Menu
          open={isOpen}
          onClose={onToggle}
          anchorRef={btnRef}
          aria-label={action.label}
        >
          {sections.map((section, i) => (
            <MenuSection key={i}>
              {section.map((item, j) => {
                if (item.isHeader) {
                  return (
                    <div key={j} className="a1-top-header__menu-identity">
                      <span className="a1-top-header__menu-identity-name">
                        {item.label}
                      </span>
                      {item.description && (
                        <span className="a1-top-header__menu-identity-desc">
                          {item.description}
                        </span>
                      )}
                    </div>
                  );
                }
                return (
                  <MenuItem
                    key={j}
                    icon={item.icon}
                    href={item.href}
                    variant={item.danger ? "destructive" : "default"}
                    onClick={item.onClick}
                  >
                    {item.label}
                  </MenuItem>
                );
              })}
            </MenuSection>
          ))}
        </Menu>
      )}
    </div>
  );
}

// ── MobileDrawer ───────────────────────────────────────────────────────────────

function MobileDrawer({ navItems, onClose }) {
  const [openSubId, setOpenSubId] = useState(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <SideNav open onClose={onClose}>
      {navItems.map((item) => {
        if (item.items?.length > 0) {
          return (
            <SideNavGroup
              key={item.id}
              icon={item.icon}
              label={item.label}
              open={openSubId === item.id}
              onOpenChange={(next) => setOpenSubId(next ? item.id : null)}
            >
              {getMobileSubItems(item).map((sub) => (
                <MobileDrawerItem key={sub.label} item={sub} onClose={onClose} />
              ))}
            </SideNavGroup>
          );
        }

        return (
          <SideNavItem
            key={item.id}
            as={item.href ? "a" : "button"}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={item.active}
            onClick={(event) => { item.onClick?.(event); onClose(); }}
          />
        );
      })}
    </SideNav>
  );
}

// ── TopHeader ──────────────────────────────────────────────────────────────────

export function TopHeader({
  logo,
  logoText,
  logoHref = "/",
  navItems = [],
  actions = [],
  loginButton,
  endSlot,
  className = "",
}) {
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [openAction, setOpenAction] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // SideNav handles its own Escape key; Menu handles its own Escape + outside click.

  useEffect(() => {
    if (!mobileNavOpen || typeof window === "undefined" || !window.matchMedia) return undefined;

    const desktopQuery = window.matchMedia("(min-width: 769px)");
    const closeAtDesktop = (event) => {
      if (event.matches) setMobileNavOpen(false);
    };

    if (desktopQuery.matches) {
      setMobileNavOpen(false);
      return undefined;
    }

    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener("change", closeAtDesktop);
      return () => desktopQuery.removeEventListener("change", closeAtDesktop);
    }

    desktopQuery.addListener(closeAtDesktop);
    return () => desktopQuery.removeListener(closeAtDesktop);
  }, [mobileNavOpen]);

  return (
    <>
      <header
        className={["a1-top-header", className].filter(Boolean).join(" ")}
      >
        <button
          type="button"
          className="a1-top-header__hamburger"
          aria-label="Open navigation menu"
          aria-expanded={mobileNavOpen}
          onClick={() => setMobileNavOpen(true)}
        >
          <Icon name="menu" aria-hidden="true" />
        </button>

        {(logo ?? logoText) && (
          <a href={logoHref} className="a1-top-header__logo">
            {logo ?? logoText}
          </a>
        )}

        {navItems.length > 0 && (
          <nav className="a1-top-header__nav" aria-label="Main navigation">
            <ul className="a1-top-header__nav-list" role="list">
              {navItems.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  openId={openSubmenu}
                  onOpen={setOpenSubmenu}
                />
              ))}
            </ul>
          </nav>
        )}

        <div className="a1-top-header__end">
          {actions.map((action) => (
            <ActionMenu
              key={action.id}
              action={action}
              isOpen={openAction === action.id}
              onToggle={() =>
                setOpenAction(openAction === action.id ? null : action.id)
              }
            />
          ))}
          {endSlot}
          {loginButton && (
            <div className="a1-top-header__login">
              <Button
                variant="primary"
                size="sm"
                onClick={loginButton.onClick}
              >
                {loginButton.label ?? "Log in"}
              </Button>
            </div>
          )}
        </div>
      </header>

      {mobileNavOpen && (
        <MobileDrawer
          navItems={navItems}
          onClose={() => setMobileNavOpen(false)}
        />
      )}
    </>
  );
}
