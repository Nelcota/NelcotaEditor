import CircleAlertIcon from "~icons/lucide/circle-alert";
import InfoIcon from "~icons/lucide/info";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "#/shared/ui/cn";
import type { IconComponent } from "#/shared/ui/icon-component";

type AlertTone = "danger" | "info";

interface AlertToneStyle {
    icon: IconComponent;
    role: "alert" | "status";
    className: string;
    iconClassName: string;
}

// The text stays ink: red or blue text on a 10% tint of itself reads under 4.5:1.
const TONE_STYLES: Record<AlertTone, AlertToneStyle> = {
    danger: {
        icon: CircleAlertIcon,
        role: "alert",
        className: "border-destructive/40 bg-destructive/10",
        iconClassName: "text-destructive",
    },
    info: {
        icon: InfoIcon,
        role: "status",
        className: "border-primary/40 bg-primary/10",
        iconClassName: "text-primary-ink",
    },
};

interface AlertProps extends Omit<ComponentProps<"div">, "title"> {
    /** Red for a problem, blue for something to know. Defaults to red. */
    tone?: AlertTone;
    /** Short bold line before the text, such as "Espaço quase cheio". */
    title?: ReactNode;
    /** Replaces the tone's icon. */
    icon?: IconComponent;
    /** A button or link at the end, such as "Tentar de novo". */
    action?: ReactNode;
}

/** A boxed notice: icon, optional title, the text and an optional action. */
export function Alert({
    tone = "danger",
    title,
    icon,
    action,
    className,
    children,
    ...props
}: AlertProps): ReactNode {
    const style = TONE_STYLES[tone];
    const Icon = icon ?? style.icon;

    return (
        <div
            role={style.role}
            data-slot="alert"
            data-tone={tone}
            className={cn(
                "flex flex-wrap items-start gap-x-3 gap-y-2 rounded-xl border px-3 py-2.5 text-sm text-foreground",
                style.className,
                className,
            )}
            {...props}
        >
            <Icon
                className={cn("mt-0.5 size-5 shrink-0", style.iconClassName)}
                aria-hidden="true"
            />
            <div className="grid min-w-0 flex-[1_1_14rem] gap-0.5 [overflow-wrap:anywhere]">
                {title !== undefined && <p className="font-semibold">{title}</p>}
                <div>{children}</div>
            </div>
            {action !== undefined && <div className="ms-8 shrink-0 sm:ms-0">{action}</div>}
        </div>
    );
}
