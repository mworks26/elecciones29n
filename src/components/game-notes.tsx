import { useState, type ReactNode } from "react";
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GameMascot, TopicDrawing } from "@/components/game-art";
import { Grip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { transferBudgetNote } from "@/lib/game-budget";
import type { Answer } from "@/lib/affinity";

const tones = ["bg-highlight text-highlight-foreground", "bg-secondary text-secondary-foreground", "bg-accent/20 text-foreground"];

function PriorityNote({ id, label, index }: { id: string; label: string; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("min-w-0", isDragging && "opacity-30")}>
    <Button {...attributes} {...listeners} variant="ghost" aria-label={`Mover ${label}`} className={cn("h-16 w-full touch-none items-center justify-start gap-2 whitespace-normal cartoon-note rounded-lg border border-border px-3 py-2 text-left shadow-soft hover:ring-2 hover:ring-ring", tones[index % tones.length])}>
      <span className="font-serif text-lg tabular-nums">{index + 1}</span>
      <TopicDrawing label={label} /><span className="min-w-0 flex-1 break-words text-sm font-semibold leading-tight">{label}</span><Grip aria-hidden className="size-4 shrink-0 opacity-50" />
    </Button>
  </li>;
}

export function PriorityNotes({ order, label, onChange }: { order: string[]; label: (id: string) => string; onChange: (order: string[]) => void }) {
  const [active, setActive] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  function finish({ active: item, over }: DragEndEvent) {
    setActive(null);
    if (!over || item.id === over.id) return;
    const from = order.indexOf(String(item.id));
    const to = order.indexOf(String(over.id));
    if (from >= 0 && to >= 0) onChange(arrayMove(order, from, to));
  }
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={({ active: item }) => setActive(String(item.id))} onDragEnd={finish} onDragCancel={() => setActive(null)}>
    <SortableContext items={order} strategy={rectSortingStrategy}>
      <ol aria-label="Notas de prioridades" className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{order.map((id, index) => <PriorityNote key={id} id={id} label={label(id)} index={index} />)}</ol>
    </SortableContext>
    <DragOverlay>{active ? <div className="flex h-16 items-center gap-2 rounded-lg border border-ring bg-highlight px-3 text-sm font-semibold text-highlight-foreground shadow-soft"><TopicDrawing label={label(active)} />{label(active)}</div> : null}</DragOverlay>
  </DndContext>;
}

function ChipNote({ id, origin }: { id: string; origin: string }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({ id, data: { origin } });
  return <Button ref={setNodeRef} {...attributes} {...listeners} variant="secondary" aria-label={`Mover nota de 5 fichas${origin === "pool" ? " disponibles" : " asignadas"}`} className={cn("size-9 touch-none rounded-md bg-highlight p-0 text-highlight-foreground shadow-sm", isDragging && "opacity-25")}>5</Button>;
}

function ChipZone({ id, title, count, pool = false, index = 0 }: { id: string; title: string; count: number; pool?: boolean; index?: number }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <div ref={setNodeRef} aria-label={title} className={cn("min-w-0 rounded-lg border-2 border-dashed border-border p-4", pool ? "bg-muted" : tones[index % tones.length], isOver && "border-ring ring-2 ring-ring")}>
    <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2">{!pool && <TopicDrawing label={title} />}<h3 className="text-base font-semibold">{title}</h3></div><span className="font-semibold tabular-nums">{count * 5}</span></div>
    <div className="mt-3 flex min-h-10 flex-wrap gap-2">{Array.from({ length: count }, (_, n) => <ChipNote key={`${id}-${n}`} id={`${id}-${n}`} origin={id} />)}</div>
  </div>;
}

export function BudgetNotes({ order, chips, label, onChange }: { order: string[]; chips: Record<string, number>; label: (id: string) => string; onChange: (chips: Record<string, number>) => void }) {
  const [dragging, setDragging] = useState(false);
  const used = Object.values(chips).reduce((a, b) => a + b, 0);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }), useSensor(KeyboardSensor));
  function finish({ active, over }: DragEndEvent) {
    setDragging(false);
    const origin = active.data.current?.['origin'] as string | undefined;
    if (!origin || !over || origin === over.id) return;
    const target = String(over.id);
    if (target !== "pool" && !order.includes(target)) return;
    onChange(transferBudgetNote(chips, origin, target));
  }
  return <DndContext sensors={sensors} onDragStart={() => setDragging(true)} onDragEnd={finish} onDragCancel={() => setDragging(false)}>
    <div className="mt-5"><ChipZone id="pool" title="Fichas disponibles" count={Math.max(0, Math.floor((100 - used) / 5))} pool /></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">{order.map((id, index) => <ChipZone key={id} id={id} title={label(id)} count={Math.floor((chips[id] ?? 0) / 5)} index={index} />)}</div>
    <DragOverlay>{dragging ? <div className="flex size-9 items-center justify-center rounded-md bg-highlight font-semibold text-highlight-foreground shadow-soft">5</div> : null}</DragOverlay>
  </DndContext>;
}

const choices = [["agree", "De acuerdo"], ["partial", "En parte"], ["disagree", "En desacuerdo"], ["skip", "Paso"]] as const;
function MovableProposal({ children }: { children: ReactNode }) {
  const { setNodeRef, attributes, listeners, transform } = useDraggable({ id: "proposal" });
  return <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform) }} className="relative z-10 rounded-lg border-2 border-lilac bg-secondary p-6 shadow-soft">
    <Button {...attributes} {...listeners} variant="ghost" aria-label="Mover viñeta de propuesta" className="mb-4 h-8 w-full touch-none justify-end text-secondary-foreground"><Grip /></Button>
    <GameMascot kind={2} />
    {children}
  </div>;
}
function AnswerZone({ answer, label, onAnswer }: { answer: Answer; label: string; onAnswer: (answer: Answer) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: answer });
  return <div ref={setNodeRef}><Button onClick={() => onAnswer(answer)} variant="outline" className={cn("h-24 w-full whitespace-normal rounded-lg border-2 border-dashed bg-card text-foreground", isOver && "border-ring bg-highlight text-highlight-foreground ring-2 ring-ring")}>{label}</Button></div>;
}
export function ProposalNote({ children, onAnswer }: { children: ReactNode; onAnswer: (answer: Answer) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }), useSensor(KeyboardSensor));
  return <DndContext sensors={sensors} onDragEnd={({ over }) => {
    const choice = choices.find(([id]) => id === over?.id);
    if (choice) onAnswer(choice[0]);
  }}>
    <MovableProposal>{children}</MovableProposal>
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{choices.map(([answer, label]) => <AnswerZone key={answer} answer={answer} label={label} onAnswer={onAnswer} />)}</div>
  </DndContext>;
}