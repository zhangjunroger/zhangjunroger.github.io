import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/hero/HeroSection';
import StatsGrid from '@/components/stats/StatsGrid';
import HighlightsGrid from '@/components/highlights/HighlightsGrid';
import SyllabusAccordion from '@/components/syllabus/SyllabusAccordion';
import AITutorPanel from '@/components/ai-tutor/AITutorPanel';
import SimCardGrid from '@/components/simulation/SimCardGrid';
import ResourceSlider from '@/components/resources/ResourceSlider';
import TeacherCards from '@/components/team/TeacherCards';
import Leaderboard from '@/components/team/Leaderboard';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 relative">
      <Header />
      <main>
        <HeroSection />
        <StatsGrid />
        <HighlightsGrid />
        <SyllabusAccordion />
        <AITutorPanel />
        <SimCardGrid />
        <ResourceSlider />
        <TeacherCards />
        <Leaderboard />
      </main>
      <Footer />
    </div>
  );
}
