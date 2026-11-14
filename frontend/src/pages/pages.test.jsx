import { describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderApp } from '../test/render.jsx';
import { buildSeed } from '../api/mock/data.js';

describe('mock seed', () => {
  it('has 24 students', () => {
    expect(buildSeed().students).toHaveLength(24);
  });
});

describe('Today', () => {
  it('shows all 24 students on a school day', async () => {
    renderApp('/?date=2026-11-16');
    expect(await screen.findAllByTestId('student-row')).toHaveLength(24);
  });

  it('filters and checks a student in', async () => {
    renderApp('/?date=2026-11-16');
    await screen.findAllByTestId('student-row');

    fireEvent.click(screen.getByRole('button', { name: /^Present$/ }));
    expect(screen.queryAllByTestId('student-row')).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: /^All \(/ }));
    const card = screen.getByRole('listitem', { name: 'Haruto Sato' });
    fireEvent.click(within(card).getByRole('button', { name: /Check in/ }));

    await waitFor(() => expect(within(card).getByText('Present')).toBeInTheDocument());
    expect(within(card).getByRole('link', { name: /Open daily log/ })).toBeInTheDocument();
  });

  it('marks students without a plan as day off', async () => {
    renderApp('/?date=2026-11-16');
    const card = await screen.findByRole('listitem', { name: 'Hina Watanabe' });
    expect(within(card).getByText('Day off')).toBeInTheDocument();
  });
});

describe('Daily log', () => {
  it('hides the bowel condition at 0 and shows the fever warning at 37.5', async () => {
    renderApp('/students/1/log/2026-11-16');
    await screen.findByRole('heading', { name: /Haruto Sato/ });

    expect(screen.queryByRole('group', { name: /Condition/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Increase count/ }));
    expect(screen.getByRole('group', { name: /Condition/ })).toBeInTheDocument();

    const temp = screen.getByLabelText(/Temperature °C/);
    fireEvent.change(temp, { target: { value: '37.4' } });
    expect(screen.queryByText(/Fever 37.5°C or above/)).not.toBeInTheDocument();
    fireEvent.change(temp, { target: { value: '37.5' } });
    expect(screen.getByText(/Fever 37.5°C or above/)).toBeInTheDocument();
  });

  it('updates the balance live and warns below zero', async () => {
    renderApp('/students/1/log/2026-11-16');
    await screen.findByRole('heading', { name: /Haruto Sato/ });
    fireEvent.change(screen.getByLabelText(/Snack \(¥\)/), { target: { value: '5000' } });
    expect(screen.getByText(/Balance below zero/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save log/ })).toBeEnabled();
  });
});

describe('Monthly plan', () => {
  it('fills all weekdays and clears', async () => {
    renderApp('/plan?student=2&month=2026-12');
    await screen.findByRole('button', { name: /All weekdays/ });
    fireEvent.click(screen.getByRole('button', { name: /Clear/ }));
    expect(screen.getByTestId('planned-count')).toHaveTextContent('0 days planned');
    fireEvent.click(screen.getByRole('button', { name: /All weekdays/ }));
    expect(screen.getByTestId('planned-count')).toHaveTextContent('23 days planned');
  });
});

describe('Language toggle', () => {
  it('shows one language at a time and switches', async () => {
    renderApp('/?date=2026-11-16');
    await screen.findAllByTestId('student-row');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^Attendance$/);
    expect(screen.queryByText('出欠')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '日本語' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^出欠$/);
    expect(screen.getByText('2026年11月16日(月)')).toBeInTheDocument();
    expect(screen.queryByText(/Check in/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getAllByRole('button', { name: 'Check in' }).length).toBeGreaterThan(0);
  });
});

describe('Reports', () => {
  it('previews the monthly summary and switches to a week', async () => {
    renderApp('/reports?type=month&at=2026-11-01');
    expect(await screen.findByText('Haruto Sato')).toBeInTheDocument();
    expect(screen.getByTestId('period-label')).toHaveTextContent('November 2026');
    expect(screen.getByRole('columnheader', { name: 'Snack left' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export to Excel' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Week' }));
    await waitFor(() => expect(screen.getByTestId('period-label')).toHaveTextContent('26 Oct (Mon) – 1 Nov (Sun)'));
    expect(screen.queryByRole('columnheader', { name: 'Snack left' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next period' }));
    await waitFor(() => expect(screen.getByTestId('period-label')).toHaveTextContent('2 Nov (Mon) – 8 Nov (Sun)'));
  });
});

describe('Menu', () => {
  it('opens and closes the phone menu drawer', async () => {
    renderApp('/?date=2026-11-16');
    await screen.findAllByTestId('student-row');
    expect(screen.getAllByRole('navigation', { name: 'Main' })).toHaveLength(1); // sidebar only
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getAllByRole('navigation', { name: 'Main' })).toHaveLength(2); // + drawer
    fireEvent.click(screen.getAllByRole('button', { name: 'Close menu' })[1]);
    expect(screen.getAllByRole('navigation', { name: 'Main' })).toHaveLength(1);
  });
});
