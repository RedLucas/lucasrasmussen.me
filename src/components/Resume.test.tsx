import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import Resume from './Resume';
import resume from '../data/resume.json';

describe('Resume', () => {
  it('renders the person’s name and label from resume.json', () => {
    render(<Resume />);
    expect(screen.getByRole('heading', { level: 1, name: resume.basics.name })).toBeInTheDocument();
    expect(screen.getByText(resume.basics.label)).toBeInTheDocument();
  });

  it('labels the article with an accessible name including the person’s name', () => {
    render(<Resume />);
    expect(
      screen.getByRole('article', { name: `Résumé — ${resume.basics.name}` }),
    ).toBeInTheDocument();
  });

  it('renders one heading per work entry', () => {
    render(<Resume />);
    for (const job of resume.work) {
      expect(screen.getByRole('heading', { level: 3, name: job.position })).toBeInTheDocument();
    }
  });

  it('renders "Present" for a role with no end date', () => {
    const current = resume.work.find((job) => !job.endDate);
    if (!current) return; // nothing to assert if every role in the data has ended
    render(<Resume />);
    const heading = screen.getByRole('heading', { level: 3, name: current.position });
    expect(heading.closest('article')).toHaveTextContent('Present');
  });

  it('renders every education entry', () => {
    render(<Resume />);
    for (const school of resume.education) {
      expect(
        screen.getByRole('heading', { level: 3, name: school.institution }),
      ).toBeInTheDocument();
    }
  });

  it('renders every language with its fluency', () => {
    render(<Resume />);
    for (const entry of resume.languages) {
      expect(screen.getByText(entry.language)).toBeInTheDocument();
      expect(screen.getByText(entry.fluency)).toBeInTheDocument();
    }
  });

  it('renders every conference from meta.conferences', () => {
    render(<Resume />);
    // Conference names repeat across years (e.g. "DrupalCon" 2017 and 2018),
    // so this is scoped to the Conferences section's own list items rather
    // than asserting unique text matches across the whole document.
    const heading = screen.getByRole('heading', { name: 'Conferences' });
    const list = heading.nextElementSibling as HTMLElement | null;
    if (!list) throw new Error('expected a conferences list after the heading');
    expect(within(list).getAllByRole('listitem')).toHaveLength(resume.meta.conferences.length);
  });

  it('forwards the ref to the focusable article root', () => {
    const captured: { current: HTMLElement | null } = { current: null };
    render(
      <Resume
        ref={(el) => {
          captured.current = el;
        }}
      />,
    );
    expect(captured.current).not.toBeNull();
    expect(captured.current).toHaveAttribute('tabindex', '0');
    expect(captured.current?.tagName).toBe('ARTICLE');
  });
});
