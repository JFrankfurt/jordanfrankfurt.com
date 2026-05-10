import Layout from 'components/Layout'
import Image from 'next/image'
import Link from 'next/link'

export default function About() {
  return (
    <Layout>
      <div className="w-[45vw] min-w-[360px]">
        <p className="mt-6">
          I&rsquo;m Jordan Frankfurt, a software engineer in Austin. I build web
          products, crypto and payment infrastructure, small physical tools, and
          occasionally over-serious systems for training, family life, and
          personal sovereignty.
        </p>
        <p className="mt-3">
          This site is mostly a notebook: projects, experiments, fitness
          targets, technical writing, and things I wanted badly enough to make
          myself.
        </p>
        <p className="mt-3">
          The recurring theme is agency. I like systems that make people harder
          to coerce, harder to confuse, and more capable of acting directly:
          private keys, strong bodies, useful tools, legible finances, good
          local infrastructure, and children who can do hard things.
        </p>

        <h2 className="mb-2 mt-8 text-3xl">I build software</h2>
        <p className="ml-2">
          Mostly web applications, crypto infrastructure, and tools that make
          vague economic and social coordination problems more explicit. Themes
          I keep coming back to:
        </p>
        <ul className="ml-6 mt-2 list-disc">
          <li>stablecoins and consumer crypto</li>
          <li>local-first and self-hosted infrastructure</li>
          <li>financial products that make informal arrangements legible</li>
          <li>
            tools that turn messy real-world processes into usable interfaces
          </li>
        </ul>

        <h2 className="mb-2 mt-8 text-3xl">I train</h2>
        <p className="ml-2">
          Targets and current numbers live on the{' '}
          <Link href="/goals">goals page</Link>.
        </p>

        <h2 className="mb-2 mt-8 text-3xl">I fight people</h2>
        <p className="ml-2">
          (
          <a
            href="https://www.youtube.com/watch?v=4qdaVwwz1bw"
            target="_blank"
            rel="noopener noreferrer"
          >
            Poorly
          </a>{' '}
          and{' '}
          <a href="https://smoothcomp.com/en/profile/335420">
            as often as I can.
          </a>
          )
        </p>
        <p className="ml-2">
          (I{' '}
          <a href="https://drive.google.com/file/d/1el63gWTYQisPg4Z2cZhlfeA-EN2VqWm6/view">
            win
          </a>{' '}
          <a href="https://drive.google.com/file/d/1ooUTblxyUWsqIpikD4urVHZW0LFC92ZD/view?usp=sharing">
            occasionally
          </a>
          .)
        </p>

        <h2 className="mb-2 mt-8 text-3xl">I make useful physical objects</h2>
        <ul>
          <li>
            <Image
              src="/bracket-render.png"
              width={250}
              height={250}
              style={{ width: 'auto', height: 'auto' }}
              alt="wall hanger render"
            />
            <a href="/painting-hanger.3mf" download="/painting-hanger.3mf">
              Heavy-duty wall hanger
            </a>
          </li>
          <li>
            <Image
              src="/sharkbite-vinyl-fitting_render.png"
              width={250}
              height={250}
              style={{ width: 'auto', height: 'auto' }}
              alt="sharkbite fitting render"
            />
            <a href="/sharkbite-fitting.3mf" download="/sharkbite-fitting.3mf">
              Sharkbite fitting (to attach an orange juice bottle to vinyl
              tubing)
            </a>
          </li>
          <li>
            <Image
              src="/rugged-suppressors-fixed-mount-wrench.png"
              width={250}
              height={250}
              style={{ width: 'auto', height: 'auto' }}
              alt="suppressor wrench"
            />
            <a
              href="/Rugged-Suppressors-Fixed-Mount-Wrench.3mf"
              download="/Rugged-Suppressors-Fixed-Mount-Wrench.3mf"
            >
              Wrench for Rugged Suppressors Obsidian9 fixed mount (and possibly
              .45 ACP trilug?)
            </a>
          </li>
          <li>
            <Image
              src="/rugged-suppressors-endcap-wrench.PNG"
              width={250}
              height={250}
              style={{ width: 'auto', height: 'auto' }}
              alt="suppressor wrench"
            />
            <a
              href="/Rugged Suppressors Obsidian 9 Endcap Wrench.3mf"
              download="/Rugged Suppressors Obsidian 9 Endcap Wrench.3mf"
            >
              Wrench for Rugged Suppressors Obsidian9 endcap
            </a>
          </li>
        </ul>
      </div>
    </Layout>
  )
}
