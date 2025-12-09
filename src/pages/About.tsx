import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Footer } from "@/components/Footer";
import { Logo } from "@/components/layout/Logo";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Target, 
  Users,
  Zap,
  Heart,
  ArrowLeft,
  CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  const { t } = useLanguage();

  const values = [
    {
      icon: Target,
      title: t("valueGoals"),
      description: t("valueGoalsDesc"),
    },
    {
      icon: Zap,
      title: t("valueSimplicity"),
      description: t("valueSimplicityDesc"),
    },
    {
      icon: Heart,
      title: t("valueWellbeing"),
      description: t("valueWellbeingDesc"),
    },
    {
      icon: Users,
      title: t("valueCommunity"),
      description: t("valueCommunityDesc"),
    },
  ];

  const features = [
    t("aboutFeature1"),
    t("aboutFeature2"),
    t("aboutFeature3"),
    t("aboutFeature4"),
    t("aboutFeature5"),
    t("aboutFeature6"),
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
              href="/#features" 
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              {t("navFeatures")}
            </a>
            <Link 
              to="/about" 
              className="text-primary font-medium"
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
          <div className="flex justify-center mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {t("backToHome")}
              </Link>
            </Button>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              {t("aboutTitle")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t("aboutSubtitle")}
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="mb-16">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-8 md:p-12">
              <div className="max-w-3xl mx-auto space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
                  {t("ourMission")}
                </h2>
                <p className="text-lg text-muted-foreground text-center leading-relaxed">
                  {t("missionText1")}
                </p>
                <p className="text-lg text-muted-foreground text-center leading-relaxed">
                  {t("missionText2")}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Values Section */}
        <section className="mb-16 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold">{t("ourValues")}</h2>
            <p className="text-muted-foreground">
              {t("valuesSubtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow text-center">
                  <CardHeader>
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{value.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {value.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl md:text-4xl font-bold text-center">
                {t("whatWeOffer")}
              </CardTitle>
              <CardDescription className="text-center text-base">
                {t("whatWeOfferSubtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="mb-16 text-center">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
            <CardContent className="p-12">
              <div className="space-y-6 max-w-2xl mx-auto">
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

export default About;

