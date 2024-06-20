import Layout from 'components/Layout'

export default function About() {
  return (
    <Layout>
      <div className="min-w-[360px] w-[45vw]">
        <h1>About me</h1>
        <p>
          I fight people (
          <a
            href="https://www.youtube.com/watch?v=4qdaVwwz1bw"
            target="_blank"
            rel="noopener noreferrer"
          >
            poorly
          </a>
          ) as often as I can.
        </p>
      </div>
    </Layout>
  )
}
