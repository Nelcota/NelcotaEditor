/**
 * A row of the sidebar: 44px tall, 15px labels, the 22px blue icon on the leading side. The current section, and the
 * section a deeper page belongs to (data-parent), get the blue tint and blue text.
 */
export const SIDEBAR_ITEM_CLASS =
    "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[0.9375rem] font-medium text-foreground outline-none transition-[color,background-color,scale] hover:bg-foreground/5 focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-[0.99] aria-[current=page]:bg-primary/12 aria-[current=page]:text-primary-ink data-[parent=true]:bg-primary/12 data-[parent=true]:text-primary-ink [&>svg]:size-[1.375rem] [&>svg]:shrink-0 [&>svg]:text-primary-ink";
