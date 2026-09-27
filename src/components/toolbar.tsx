import { ArrowDownAZ, ArrowUpDown, CalendarDays, CircleDot, Clock, Columns3, Flag, Folder, List, Tag as TagIcon, User, UserX, X } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { PRIORITIES, PRIORITY_META, SORT_LABELS, STATUS_META, STATUSES } from "@/lib/tasks";
import type { Layout, Person, Priority, Project, ProjectFilter, SortKey, Status, Tag } from "@/lib/types";
import { Avatar, StatusIcon } from "./badges";
import { Select, type SelectOption } from "./select";

export const ProjectSwatch = ({ color }: { color: string }) => (
  <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: color }} aria-hidden />
);

export const TagDot = ({ color }: { color: string }) => (
  <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
);

export const PriorityIcon = ({ priority }: { priority: Priority }) => (
  <Flag className="size-3.5" style={{ color: PRIORITY_META[priority].color, fill: PRIORITY_META[priority].color }} aria-hidden />
);

export const PersonIcon = ({ person }: { person: Person }) => (
  <Avatar person={person} className="size-4 text-[7px] ring-0" />
);

const SORT_ICONS: Record<SortKey, ReactNode> = {
  due: <CalendarDays className="size-3.5" />,
  priority: <Flag className="size-3.5" />,
  created: <Clock className="size-3.5" />,
  title: <ArrowDownAZ className="size-3.5" />,
};

interface ToolbarProps {
  projects: Project[];
  people: Person[];
  tags: Tag[];
  assigneeId: string;
  tagId: string;
  layout: Layout;
  onAssignee: (value: string) => void;
  onTag: (value: string) => void;
  onLayout: (value: Layout) => void;
  projectFilter: ProjectFilter;
  priority: Priority | "all";
  status: Status | "all";
  sort: SortKey;
  lockStatus: boolean;
  onProject: (value: ProjectFilter) => void;
  onPriority: (value: Priority | "all") => void;
  onStatus: (value: Status | "all") => void;
  onSort: (value: SortKey) => void;
  onClear: () => void;
}

export function Toolbar(props: ToolbarProps) {
  const filterCount = [
    props.projectFilter !== "all",
    props.priority !== "all",
    props.status !== "all",
    props.assigneeId !== "all",
    props.tagId !== "all",
  ].filter(Boolean).length;

  const projectOptions: SelectOption[] = [
    { value: "all", label: "All projects", icon: <Folder className="size-3.5" /> },
    ...props.projects.map((p) => ({ value: p.id, label: p.name, icon: <ProjectSwatch color={p.color} /> })),
    { value: "none", label: "No project", icon: <span className="size-2.5 rounded-[3px] border border-dashed border-fg-faint" />, separated: true },
  ];

  const priorityOptions: SelectOption<Priority | "all">[] = [
    { value: "all", label: "Any priority", icon: <Flag className="size-3.5" /> },
    ...PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].label, icon: <PriorityIcon priority={p} /> })),
  ];

  const statusOptions: SelectOption<Status | "all">[] = [
    { value: "all", label: "Any status", icon: <CircleDot className="size-3.5" /> },
    ...STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label, icon: <StatusIcon status={s} /> })),
  ];

  const assigneeOptions: SelectOption[] = [
    { value: "all", label: "Anyone", icon: <User className="size-3.5" /> },
    ...props.people.map((p) => ({ value: p.id, label: p.name, icon: <PersonIcon person={p} /> })),
    { value: "none", label: "Unassigned", icon: <UserX className="size-3.5" />, separated: true },
  ];

  const tagOptions: SelectOption[] = [
    { value: "all", label: "Any tag", icon: <TagIcon className="size-3.5" /> },
    ...props.tags.map((t) => ({ value: t.id, label: t.name, icon: <TagDot color={t.color} /> })),
  ];

  const sortOptions: SelectOption<SortKey>[] = (Object.keys(SORT_LABELS) as SortKey[]).map((key) => ({
    value: key,
    label: SORT_LABELS[key],
    icon: SORT_ICONS[key],
  }));

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Select
        variant="pill"
        label="Project"
        placeholder="Project"
        icon={<Folder className="size-3.5" />}
        value={props.projectFilter}
        options={projectOptions}
        onChange={props.onProject}
        active={props.projectFilter !== "all"}
        onClear={() => props.onProject("all")}
      />
      <Select
        variant="pill"
        label="Priority"
        placeholder="Priority"
        icon={<Flag className="size-3.5" />}
        value={props.priority}
        options={priorityOptions}
        onChange={props.onPriority}
        active={props.priority !== "all"}
        onClear={() => props.onPriority("all")}
      />
      {!props.lockStatus && (
        <Select
          variant="pill"
          label="Status"
          placeholder="Status"
          icon={<CircleDot className="size-3.5" />}
          value={props.status}
          options={statusOptions}
          onChange={props.onStatus}
          active={props.status !== "all"}
          onClear={() => props.onStatus("all")}
        />
      )}
      <Select
        variant="pill"
        label="Assignee"
        placeholder="Assignee"
        icon={<User className="size-3.5" />}
        value={props.assigneeId}
        options={assigneeOptions}
        onChange={props.onAssignee}
        active={props.assigneeId !== "all"}
        onClear={() => props.onAssignee("all")}
      />
      {props.tags.length > 0 && (
        <Select
          variant="pill"
          label="Tag"
          placeholder="Tag"
          icon={<TagIcon className="size-3.5" />}
          value={props.tagId}
          options={tagOptions}
          onChange={props.onTag}
          active={props.tagId !== "all"}
          onClear={() => props.onTag("all")}
        />
      )}

      {filterCount > 1 && (
        <motion.button
          type="button"
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={props.onClear}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm text-fg-muted hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <X className="size-3.5" aria-hidden /> Clear all
        </motion.button>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <LayoutToggle layout={props.layout} onChange={props.onLayout} />
        <Select
          variant="pill"
          label="Sort by"
          align="end"
          fixedIcon
          icon={<ArrowUpDown className="size-3.5" />}
          value={props.sort}
          options={sortOptions}
          onChange={props.onSort}
        />
      </div>
    </div>
  );
}

function LayoutToggle({ layout, onChange }: { layout: Layout; onChange: (value: Layout) => void }) {
  const options: { id: Layout; label: string; icon: typeof List }[] = [
    { id: "list", label: "List", icon: List },
    { id: "board", label: "Board", icon: Columns3 },
  ];
  return (
    <div role="radiogroup" aria-label="Layout" data-tour="layout" className="inline-flex h-8 rounded-lg border border-line bg-bg p-0.5">
      {options.map(({ id, label, icon: Icon }) => {
        const active = layout === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${label} view`}
            onClick={() => onChange(id)}
            title={`${label} view (B)`}
            className={cn(
              "relative isolate inline-flex items-center gap-1.5 rounded-md px-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
              active ? "text-fg" : "text-fg-muted hover:text-fg",
            )}
          >
            {active && (
              <motion.span
                layoutId="layout-toggle"
                className="absolute inset-0 -z-10 rounded-md bg-muted"
                transition={{ type: "spring", stiffness: 520, damping: 38 }}
              />
            )}
            <Icon className="size-3.5" aria-hidden />
            <span className="hidden lg:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
