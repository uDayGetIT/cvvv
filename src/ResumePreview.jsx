const ResumePreview = ({ data }) => {
  return (
    <div
      id="resume-preview"
      contentEditable
      suppressContentEditableWarning
      style={containerStyle}
    >
      <h1 style={nameStyle}>{data.name}</h1>
      <p style={contactStyle}>
        {data.contact.email} | {data.contact.phone} | {data.contact.linkedin} | {data.contact.github}
      </p>

      <Section title="Summary"><p>{data.summary}</p></Section>

      <Section title="Skills">
        <ul>{data.skills.map((s, i) => <li key={i}>{s}</li>)}</ul>
      </Section>

      <Section title="Experience">
        {data.experience.map((job, i) => (
          <div key={i} style={entryStyle}>
            <div style={titleRow}>
              <strong>{job.title}, {job.company}</strong>
              <span>{job.startDate} – {job.endDate}</span>
            </div>
            <em>{job.location}</em>
            <ul>{job.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
          </div>
        ))}
      </Section>

      <Section title="Education">
        {data.education.map((edu, i) => (
          <div key={i} style={entryStyle}>
            <div style={titleRow}>
              <strong>{edu.institution}</strong>
              <span>{edu.startDate} – {edu.endDate}</span>
            </div>
            <em>{edu.degree}, {edu.location}</em>
          </div>
        ))}
      </Section>

      <Section title="Projects">
        {data.projects.map((proj, i) => (
          <div key={i} style={entryStyle}>
            <strong>{proj.title}</strong> – <em>{proj.technologies}</em>
            <ul>{proj.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
          </div>
        ))}
      </Section>
    </div>
  )
}

const Section = ({ title, children }) => (
  <div style={{ marginBottom: '20px' }}>
    <h2 style={sectionHeader}>{title}</h2>
    {children}
  </div>
)

const containerStyle = {
  fontFamily: 'Inter, sans-serif',
  padding: '40px',
  maxWidth: '800px',
  backgroundColor: '#fff',
  margin: '20px auto',
  boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  fontSize: '14px'
}

const nameStyle = { fontSize: '26px', margin: 0 }
const contactStyle = { marginBottom: '20px', color: '#555' }
const sectionHeader = {
  fontSize: '16px',
  borderBottom: '1px solid #ddd',
  marginBottom: '8px',
  textTransform: 'uppercase',
  fontWeight: 'bold'
}
const titleRow = {
  display: 'flex',
  justifyContent: 'space-between',
  fontWeight: 'bold',
  marginTop: '8px'
}
const entryStyle = { marginBottom: '12px' }

export default ResumePreview
