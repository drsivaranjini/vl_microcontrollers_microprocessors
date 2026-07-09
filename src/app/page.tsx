import Hero from '@/components/Hero';
import Overview from '@/components/Overview';
import Faculty from '@/components/Faculty';
import ExperimentsGrid from '@/components/ExperimentsGrid';
import Curriculum from '@/components/Curriculum';
import References from '@/components/References';

export default function Home() {
  return (
    <>
      <Hero />
      <Overview />
      <Faculty />
      <ExperimentsGrid />
      <Curriculum />
      <References />
    </>
  );
}
