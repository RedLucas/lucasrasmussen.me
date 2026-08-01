import type { ReactNode, Ref } from 'react';
import resumeData from '../data/resume.json';
import styles from './Resume.module.scss';

// A minimal, hand-written shape covering only the JSON Resume fields this
// component actually reads — resume.json itself is inferred structurally by
// TS (via resolveJsonModule), but a heterogeneous array like `skills` (some
// entries have `keywords`, others `level`) infers as a union that's awkward
// to consume directly, so the import is asserted against this contract
// instead.
interface WorkEntry {
  name: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  highlights?: string[];
  keywords?: string[];
}

interface EducationEntry {
  institution: string;
  location?: string;
  area?: string;
  studyType: string;
  startDate: string;
  endDate?: string;
}

interface Skill {
  name: string;
  keywords?: string[];
  level?: string;
}

interface LanguageEntry {
  language: string;
  fluency: string;
}

interface Conference {
  name: string;
  year: string;
  location: string;
}

interface ResumeData {
  basics: {
    name: string;
    label: string;
    summary: string;
    location: { city?: string; region?: string };
  };
  work: WorkEntry[];
  education: EducationEntry[];
  skills: Skill[];
  languages: LanguageEntry[];
  meta: { conferences: Conference[] };
}

const resume = resumeData as ResumeData;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// JSON Resume dates are ISO-ish (YYYY or YYYY-MM); an absent end date means
// the role is current.
function formatDate(value: string | undefined): string {
  if (!value) return 'Present';
  const [year, month] = value.split('-');
  return month ? `${MONTHS[Number(month) - 1]} ${year}` : (year ?? '');
}

function Chips({ items }: { items: string[] }) {
  return (
    <ul className={styles.chips}>
      {items.map((item) => (
        <li key={item} className={styles.chip}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.eyebrow}>{label}</h2>
      {children}
    </section>
  );
}

interface EntryProps {
  title: string;
  dates: string;
  subtitle: string;
  detail?: string | undefined;
  children?: ReactNode;
}

function Entry({ title, dates, subtitle, detail, children }: EntryProps) {
  return (
    <article className={styles.entry}>
      <div className={styles.entryHead}>
        <h3 className={styles.role}>{title}</h3>
        <span className={styles.dates}>{dates}</span>
      </div>
      <p className={styles.org}>
        {subtitle}
        {detail && <span className={styles.orgDetail}>{detail}</span>}
      </p>
      {children}
    </article>
  );
}

export default function Resume({ ref }: { ref?: Ref<HTMLElement> }) {
  const { basics, work, education, skills, languages, meta } = resume;
  const { city, region } = basics.location;
  // JSON Resume has no conferences section and closes the root to unknown
  // keys, so `meta` is the spec's sanctioned place for it.
  const conferences = meta.conferences;

  const skillGroups = skills.filter(
    (skill): skill is Skill & { keywords: string[] } => (skill.keywords?.length ?? 0) > 0,
  );
  const skillNotes = skills.filter((skill) => skill.level);

  return (
    <article ref={ref} className={styles.paper} tabIndex={0} aria-label={`Résumé — ${basics.name}`}>
      <div className={styles.sheet}>
        <header className={styles.header}>
          <h1 className={styles.name}>{basics.name}</h1>
          <p className={styles.label}>{basics.label}</p>
          <p className={styles.meta}>{[city, region].filter(Boolean).join(', ')}</p>
        </header>

        <div className={styles.columns}>
          <div className={styles.main}>
            <Section label="Summary">
              <p className={styles.summary}>{basics.summary}</p>
            </Section>

            <Section label="Experience">
              <div className={styles.entries}>
                {work.map((job) => (
                  <Entry
                    key={`${job.name}-${job.startDate}`}
                    title={job.position}
                    dates={`${formatDate(job.startDate)} – ${formatDate(job.endDate)}`}
                    subtitle={job.name}
                    detail={job.location}
                  >
                    {job.highlights && job.highlights.length > 0 && (
                      <ul className={styles.highlights}>
                        {job.highlights.map((highlight) => (
                          <li key={highlight}>{highlight}</li>
                        ))}
                      </ul>
                    )}
                    {job.keywords && job.keywords.length > 0 && <Chips items={job.keywords} />}
                  </Entry>
                ))}
              </div>
            </Section>
          </div>

          <aside className={styles.aside}>
            <Section label="Skills">
              <div className={styles.skillGroups}>
                {skillGroups.map((group) => (
                  <div key={group.name} className={styles.skillGroup}>
                    <h3 className={styles.skillName}>{group.name}</h3>
                    <Chips items={group.keywords} />
                  </div>
                ))}
              </div>
              {skillNotes.length > 0 && (
                <dl className={styles.notes}>
                  {skillNotes.map((note) => (
                    <div key={note.name} className={styles.note}>
                      <dt className={styles.noteTerm}>{note.name}</dt>
                      <dd className={styles.noteDesc}>{note.level}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </Section>

            <Section label="Education">
              <div className={styles.entries}>
                {education.map((school) => (
                  <Entry
                    key={school.institution}
                    title={school.institution}
                    dates={`${formatDate(school.startDate)} – ${formatDate(school.endDate)}`}
                    subtitle={school.studyType}
                    detail={school.area}
                  />
                ))}
              </div>
            </Section>

            <Section label="Languages">
              <dl className={styles.notes}>
                {languages.map((entry) => (
                  <div key={entry.language} className={styles.note}>
                    <dt className={styles.noteTerm}>{entry.language}</dt>
                    <dd className={styles.noteDesc}>{entry.fluency}</dd>
                  </div>
                ))}
              </dl>
            </Section>

            <Section label="Conferences">
              <ul className={styles.conferences}>
                {conferences.map((conference) => (
                  <li key={`${conference.name}-${conference.year}`}>
                    <span className={styles.conferenceName}>{conference.name}</span>
                    <span className={styles.dates}>{conference.year}</span>
                    <span className={styles.conferencePlace}>{conference.location}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </aside>
        </div>
      </div>
    </article>
  );
}
