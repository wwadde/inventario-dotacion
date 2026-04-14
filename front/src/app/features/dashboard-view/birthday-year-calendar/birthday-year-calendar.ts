import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Employee } from '../../../core/dotacion.models';

type BirthdayEntry = {
  day: number;
  employeeId: string;
  employeeName: string;
};

type CalendarCell = {
  day: number | null;
  birthdays: BirthdayEntry[];
};

type MonthCalendar = {
  monthNumber: number;
  monthLabel: string;
  birthdayCount: number;
  entries: BirthdayEntry[];
  cells: CalendarCell[];
};

@Component({
  selector: 'app-birthday-year-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './birthday-year-calendar.html',
})
export class BirthdayYearCalendar {
  employees = input.required<Employee[]>();

  readonly weekdayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  readonly monthCalendars = computed(() => {
    const birthdayIndex = this.buildBirthdayIndex();
    const year = new Date().getFullYear();

    return this.monthLabels.map((monthLabel, monthIndex) => {
      const monthNumber = monthIndex + 1;
      const daysInMonth = new Date(year, monthNumber, 0).getDate();
      const firstDayWeekJs = new Date(year, monthIndex, 1).getDay();
      const firstDayWeek = firstDayWeekJs === 0 ? 7 : firstDayWeekJs;
      const entries = (birthdayIndex.get(monthNumber) ?? []).slice().sort((a, b) => a.day - b.day);

      const leadingPlaceholders = Array.from({ length: firstDayWeek - 1 }, () => ({
        day: null,
        birthdays: [],
      } satisfies CalendarCell));

      const dayCells = Array.from({ length: daysInMonth }, (_, dayIndex) => {
        const day = dayIndex + 1;
        const birthdays = entries.filter((entry) => entry.day === day);
        return {
          day,
          birthdays,
        } satisfies CalendarCell;
      });

      return {
        monthNumber,
        monthLabel,
        birthdayCount: entries.length,
        entries,
        cells: [...leadingPlaceholders, ...dayCells],
      } satisfies MonthCalendar;
    });
  });

  private readonly monthLabels = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  private buildBirthdayIndex(): Map<number, BirthdayEntry[]> {
    const index = new Map<number, BirthdayEntry[]>();

    for (const employee of this.employees()) {
      if (!employee.active || !employee.birthDate) {
        continue;
      }

      const parsed = this.parseBirthDate(employee.birthDate);
      if (!parsed) {
        continue;
      }

      const current = index.get(parsed.month) ?? [];
      current.push({
        day: parsed.day,
        employeeId: employee.id,
        employeeName: employee.fullName,
      });
      index.set(parsed.month, current);
    }

    return index;
  }

  private parseBirthDate(rawDate: string): { month: number; day: number } | null {
    const parts = rawDate.split('-');
    if (parts.length !== 3) {
      return null;
    }

    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (!Number.isInteger(month) || !Number.isInteger(day) || month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    return { month, day };
  }
}
