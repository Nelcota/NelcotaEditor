import ListFilterIcon from "~icons/lucide/list-filter";
import { Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AdminTicketQueue } from "#/modules/admin/ui/components/admin-ticket-queue";
import {
    STAFF_TICKET_FILTERS,
    STAFF_TICKET_FILTER_LABELS,
} from "#/modules/support/model/staff-ticket-filter";
import type { StaffTicketFilter } from "#/modules/support/model/staff-ticket-filter";
import { ToolbarSelect } from "#/shared/ui/toolbar-select";
import { useTrackPromise } from "#/shared/ui/use-track-promise";

const FILTER_OPTIONS = STAFF_TICKET_FILTERS.map((value) => ({
    value,
    label: STAFF_TICKET_FILTER_LABELS[value],
}));

interface AdminSupportScreenProps {
    filter: StaffTicketFilter;
    onFilterChange: (filter: StaffTicketFilter) => Promise<void>;
}

/** The queue on the leading side and the open ticket beside it; stacked on narrow screens. */
export function AdminSupportScreen({ filter, onFilterChange }: AdminSupportScreenProps): ReactNode {
    const track = useTrackPromise();

    return (
        <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
                <ToolbarSelect
                    label="Filtrar tickets por situação"
                    icon={ListFilterIcon}
                    value={filter}
                    options={FILTER_OPTIONS}
                    onValueChange={(next) => track(onFilterChange(next))}
                />
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
                <AdminTicketQueue filter={filter} />
                <Outlet />
            </div>
        </div>
    );
}
