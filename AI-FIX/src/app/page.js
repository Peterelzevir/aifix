import Hero from '@/components/homepage/Hero';
import Features from '@/components/homepage/Features';
import CallToAction from '@/components/homepage/CallToAction';

export default function HomePage() {
  return (
    <div className="dark:bg-black bg-white">
      <Hero />
      <Features />
      <CallToAction />
    </div>
  );
}