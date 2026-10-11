'use client';

/**
 * The room calendar (FullCalendar, free plugins): all rooms in one week view, coloured by room;
 * events in different rooms at the same time sit side by side. Day and month views too. Used by
 * the admin (/admin/teremnaptar) and the student area (/fiokom/terem) with different permissions —
 * the props say what is allowed, the server checks it again.
 */
import type {
  CalendarApi,
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  EventDropArg,
  EventSourceFuncArg,
} from '@fullcalendar/core';
import type { DropArg, EventResizeDoneArg } from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { ScheduleEvent } from '@/lib/rooms/server';
import s from './calendar.module.css';
import { baseOptions, type CalRoom, eventLabel, toCalendarEvent } from './calendar-core';

export type RoomCalendarProps = {
  theme: 'site' | 'admin';
  rooms: CalRoom[];
  load: (from: string, to: string) => Promise<ScheduleEvent[] | null>;
  /** Change it to reload (after a save). */
  version?: number;
  /** Month view too (admin). */
  month?: boolean;
  /** Drag and resize events (admin). */
  editable?: boolean;
  /** Drag across free time to create. */
  selectable?: boolean;
  /** Students may not select in the past. */
  futureOnly?: boolean;
  /** Accept dragged unplaced sessions (admin). */
  droppable?: boolean;
  onSelect?: (s: { start: Date; end: Date }) => void;
  onEventClick?: (e: ScheduleEvent) => void;
  onEventChange?: (e: ScheduleEvent, change: { start: Date; end: Date }, revert: () => void) => void;
  onDrop?: (d: { sessionId: number; start: Date }) => void;
  ownLabel?: string;
  /**
   * Keep the dragged range highlighted while a form next to the calendar is open: clicks inside
   * elements matching this selector don't clear it. Change `clearSelection` to clear it.
   */
  keepSelectionIn?: string;
  clearSelection?: number;
};

export default function RoomCalendar(props: RoomCalendarProps) {
  const { theme, rooms, version = 0 } = props;
  const ref = useRef<FullCalendar>(null);
  const [error, setError] = useState('');
  // the latest props for FullCalendar's callbacks, so its options stay the same between renders
  const latest = useRef(props);
  latest.current = props;

  const roomColors = useMemo(() => new Map(rooms.map((r) => [r.id, r.color ?? '#0f5f63'])), [rooms]);
  const roomNames = useMemo(() => new Map(rooms.map((r) => [r.id, r.name])), [rooms]);

  // reload after a save
  useEffect(() => {
    if (version) (ref.current?.getApi() as CalendarApi | undefined)?.refetchEvents();
  }, [version]);
  useEffect(() => {
    if (props.clearSelection) (ref.current?.getApi() as CalendarApi | undefined)?.unselect();
  }, [props.clearSelection]);

  const options = useMemo(() => {
    const phone = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
    const changed = (info: EventDropArg | EventResizeDoneArg) => {
      const { start, end } = info.event;
      if (!start || !end) return info.revert();
      latest.current.onEventChange?.(info.event.extendedProps.event as ScheduleEvent, { start, end }, info.revert);
    };
    return {
      ...baseOptions,
      initialView: phone ? 'timeGridDay' : 'timeGridWeek',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: props.month ? 'timeGridDay,timeGridWeek,dayGridMonth' : 'timeGridDay,timeGridWeek',
      },
      height: '78vh',
      slotEventOverlap: false,
      editable: Boolean(props.editable),
      selectable: Boolean(props.selectable),
      selectMirror: true,
      unselectAuto: true,
      unselectCancel: props.keepSelectionIn,
      droppable: Boolean(props.droppable),
      selectAllow: props.futureOnly ? (span: { start: Date }) => span.start >= new Date() : undefined,
      events: (
        info: EventSourceFuncArg,
        success: (e: ReturnType<typeof toCalendarEvent>[]) => void,
        failure: (e: Error) => void,
      ) => {
        latest.current
          .load(info.start.toISOString(), info.end.toISOString())
          .then((data) => {
            if (data === null) {
              setError('A teremnaptár nem érhető el.');
              return success([]);
            }
            setError('');
            success(
              data.map((e) => toCalendarEvent(e, { colorByRoom: roomColors, editable: Boolean(props.editable) })),
            );
          })
          .catch((err: Error) => {
            setError('Nem sikerült betölteni a naptárat.');
            failure(err);
          });
      },
      eventContent: (arg: EventContentArg) => {
        const e = arg.event.extendedProps.event as ScheduleEvent | undefined;
        // the preview of something being dragged in (an unplaced session) has no schedule data
        if (!e) return <div className={s.eventTitle}>{arg.event.title}</div>;
        const label = eventLabel(e, latest.current.ownLabel);
        const where = e.roomIds
          .map((id) => roomNames.get(id))
          .filter(Boolean)
          .join(', ');
        return (
          <div>
            <div className={s.eventTitle}>{label.title}</div>
            <div className={s.eventMeta}>{[arg.timeText, where, label.meta].filter(Boolean).join(' · ')}</div>
          </div>
        );
      },
      select: (info: DateSelectArg) => {
        latest.current.onSelect?.({ start: info.start, end: info.end });
        if (!latest.current.keepSelectionIn) info.view.calendar.unselect();
      },
      eventClick: (info: EventClickArg) => {
        info.jsEvent.preventDefault();
        latest.current.onEventClick?.(info.event.extendedProps.event as ScheduleEvent);
      },
      eventDrop: changed,
      eventResize: changed,
      drop: (info: DropArg) => {
        const sessionId = Number(info.draggedEl.dataset.sessionId);
        if (sessionId) latest.current.onDrop?.({ sessionId, start: info.date });
      },
    };
  }, [
    props.editable,
    props.selectable,
    props.futureOnly,
    props.droppable,
    props.month,
    props.keepSelectionIn,
    roomColors,
    roomNames,
  ]);

  return (
    <div className={`${s.root} ${theme === 'admin' ? s.admin : s.site}`}>
      {error && <p className={s.error}>{error}</p>}
      <FullCalendar ref={ref} {...options} />
      <div className={s.legend}>
        {rooms.map((r) => (
          <span key={r.id}>
            <span className={s.dot} style={{ background: r.color }} />
            {r.name}
          </span>
        ))}
      </div>
    </div>
  );
}
