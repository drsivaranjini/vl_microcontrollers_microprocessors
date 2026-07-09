import Hero from '@/components/Hero';
import Overview from '@/components/Overview';
import Faculty from '@/components/Faculty';
import ExperimentsGrid from '@/components/ExperimentsGrid';
import Curriculum from '@/components/Curriculum';
import References from '@/components/References';
import Reveal from '@/components/Reveal';

export default function Home() {
  return (
    <>
      <Hero />
      <Reveal>
        <Overview />
      </Reveal>
      <Reveal>
        <Faculty />
      </Reveal>
      <Reveal>
        <ExperimentsGrid />
      </Reveal>
      <Reveal>
        <Curriculum />
      </Reveal>
      <Reveal>
        <References />
      </Reveal>
    </>
  );
}
