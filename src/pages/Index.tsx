import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Footer } from "@/components/Footer";
import { Logo } from "@/components/layout/Logo";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Target, 
  BarChart3, 
  Bell, 
  Trophy, 
  Calendar,
  CheckCircle,
  TrendingUp,
  Users,
  Zap,
  Award,
  Clock,
  BookOpen,
  Flame
} from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Target,
      title: t("featureHabitTracking"),
      description: t("featureHabitTrackingDesc"),
    },
    {
      icon: BarChart3,
      title: t("featureStats"),
      description: t("featureStatsDesc"),
    },
    {
      icon: Trophy,
      title: t("featureAchievements"),
      description: t("featureAchievementsDesc"),
    },
    {
      icon: Bell,
      title: t("featureReminders"),
      description: t("featureRemindersDesc"),
    },
    {
      icon: Calendar,
      title: t("featureHistory"),
      description: t("featureHistoryDesc"),
    },
    {
      icon: TrendingUp,
      title: t("featureStreaks"),
      description: t("featureStreaksDesc"),
    },
  ];

  const benefits = [
    {
      icon: CheckCircle,
      title: t("benefitEasy"),
      description: t("benefitEasyDesc"),
    },
    {
      icon: Zap,
      title: t("benefitFast"),
      description: t("benefitFastDesc"),
    },
    {
      icon: Award,
      title: t("benefitMotivation"),
      description: t("benefitMotivationDesc"),
    },
    {
      icon: Users,
      title: t("benefitMultiplatform"),
      description: t("benefitMultiplatformDesc"),
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: t("step1Title"),
      description: t("step1Desc"),
      icon: Target,
    },
    {
      step: "2",
      title: t("step2Title"),
      description: t("step2Desc"),
      icon: CheckCircle,
    },
    {
      step: "3",
      title: t("step3Title"),
      description: t("step3Desc"),
      icon: BarChart3,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-accent/10">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur sticky top-0 z-50 shadow-sm">
        <div className="container flex items-center justify-between py-4">
          {/* Logo a la izquierda */}
          <div className="flex items-center">
            <Logo size="md" showTagline={false} />
          </div>

          {/* Navegación central */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link 
              to="/" 
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              {t("navHome")}
            </Link>
            <a 
              href="#features" 
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById('features');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="text-foreground hover:text-primary transition-colors font-medium cursor-pointer"
            >
              {t("navFeatures")}
            </a>
            <Link 
              to="/about" 
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              {t("navAbout")}
            </Link>
          </nav>

          {/* Botones y controles a la derecha */}
          <div className="flex items-center gap-3">
            {/* Iconos de utilidad */}
            <div className="hidden md:flex items-center gap-2">
              <LanguageToggle />
              <ModeToggle />
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" asChild className="hidden sm:inline-flex">
                <Link to="/auth">{t("login")}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth">{t("registerTab")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container flex-1 py-12">
        {/* Hero Section */}
        <section className="mb-16 text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              {t("heroTitle")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t("heroSubtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button size="lg" asChild>
              <Link to="/auth">{t("getStarted")}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="#features">{t("learnMore")}</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="mb-16 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold">{t("features")}</h2>
            <p className="text-muted-foreground">
              {t("featuresSubtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works-heading" className="mb-16 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold">{t("howItWorks")}</h2>
            <p className="text-muted-foreground">{t("howItWorksDesc")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {howItWorks.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                        {step.step}
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl">{step.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {step.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mb-16 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold">{t("benefits")}</h2>
            <p className="text-muted-foreground">
              {t("benefitsSubtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{benefit.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {benefit.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Stats Section */}
        <section className="mb-16">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
                <div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <p className="text-xl md:text-2xl font-bold">100%</p>
                  <p className="text-xs md:text-sm text-muted-foreground">{t("statsFree")}</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Target className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <p className="text-xl md:text-2xl font-bold">∞</p>
                  <p className="text-xs md:text-sm text-muted-foreground">{t("statsUnlimited")}</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Trophy className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <p className="text-xl md:text-2xl font-bold">+10</p>
                  <p className="text-xs md:text-sm text-muted-foreground">{t("statsAchievements")}</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Clock className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <p className="text-xl md:text-2xl font-bold">24/7</p>
                  <p className="text-xs md:text-sm text-muted-foreground">{t("statsAvailable")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="mb-16 text-center">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
            <CardContent className="p-12">
              <div className="space-y-6 max-w-2xl mx-auto">
                <div className="flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-foreground/20">
                    <Flame className="h-10 w-10 text-primary-foreground" />
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">
                  {t("ctaReady")}
                </h2>
                <p className="text-lg opacity-90">
                  {t("ctaJoin")}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                  <Button size="lg" variant="secondary" asChild>
                    <Link to="/auth">{t("getStarted")}</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
