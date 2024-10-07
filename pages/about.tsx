import Layout from 'components/Layout'
import Image from 'next/image'

export default function About() {
  return (
    <Layout>
      <div className="min-w-[360px] w-[45vw]">
        <h2 className="text-3xl mb-2 mt-6">I fight people</h2>
        <p className="ml-2">
          (
          <a
            href="https://www.youtube.com/watch?v=4qdaVwwz1bw"
            target="_blank"
            rel="noopener noreferrer">
            Poorly
          </a>{' '}
          and{' '}
          <a href="https://smoothcomp.com/en/profile/335420">
            as often as I can.
          </a>
          )
        </p>
        <h2 className="text-3xl mb-2 mt-6">
          I like to model & print myself little useful objects:
        </h2>
        <ul>
          <li>
            <Image
              src="/bracket-render.png"
              width={250}
              height={250}
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
              alt="suppressor wrench"
            />
            <a
              href="/Rugged-Suppressors-Fixed-Mount-Wrench.3mf"
              download="/Rugged-Suppressors-Fixed-Mount-Wrench.3mf">
              Wrench for Rugged Suppressors Obsidian9 fixed mount (and possibly
              .45 ACP trilug?)
            </a>
          </li>
          <li>
            <Image
              src="/rugged-suppressors-endcap-wrench.PNG"
              width={250}
              height={250}
              alt="suppressor wrench"
            />
            <a
              href="/Rugged Suppressors Obsidian 9 Endcap Wrench.3mf"
              download="/Rugged Suppressors Obsidian 9 Endcap Wrench.3mf">
              Wrench for Rugged Suppressors Obsidian9 endcap
            </a>
          </li>
        </ul>
      </div>
    </Layout>
  )
}
