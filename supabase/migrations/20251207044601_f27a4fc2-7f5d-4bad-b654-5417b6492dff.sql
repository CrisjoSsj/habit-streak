-- Table for habits with all configuration options
CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'smile',
  color TEXT DEFAULT '#3B82F6',
  habit_type TEXT NOT NULL DEFAULT 'check' CHECK (habit_type IN ('check', 'count', 'timer')),
  goal_count INTEGER DEFAULT 1,
  goal_minutes INTEGER DEFAULT 10,
  time_of_day TEXT DEFAULT 'anytime' CHECK (time_of_day IN ('anytime', 'morning', 'afternoon', 'night')),
  repeat_type TEXT DEFAULT 'daily' CHECK (repeat_type IN ('daily', 'specific_days', 'x_per_week', 'x_per_month', 'x_per_year')),
  repeat_days TEXT[] DEFAULT ARRAY['mon','tue','wed','thu','fri','sat','sun'],
  repeat_count INTEGER DEFAULT 7,
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_time TIME,
  incentive_text TEXT,
  end_type TEXT DEFAULT 'never' CHECK (end_type IN ('never', 'date', 'days')),
  end_date DATE,
  end_days INTEGER,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for daily habit completions
CREATE TABLE public.habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_completed BOOLEAN DEFAULT false,
  count_progress INTEGER DEFAULT 0,
  timer_seconds INTEGER DEFAULT 0,
  is_rest_day BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(habit_id, completion_date)
);

-- Table for achievements/medals
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_level INTEGER NOT NULL DEFAULT 1,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_type, achievement_level)
);

-- Table for global reminders
CREATE TABLE public.global_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('global', 'morning', 'afternoon', 'night')),
  enabled BOOLEAN DEFAULT true,
  reminder_time TIME NOT NULL,
  repeat_days TEXT[] DEFAULT ARRAY['mon','tue','wed','thu','fri','sat','sun'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for time periods configuration
CREATE TABLE public.time_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('morning', 'afternoon', 'night', 'end_of_day')),
  start_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_type)
);

-- Enable RLS
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_periods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for habits
CREATE POLICY "Users can view own habits" ON public.habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own habits" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON public.habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON public.habits FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for habit_completions
CREATE POLICY "Users can view own completions" ON public.habit_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own completions" ON public.habit_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own completions" ON public.habit_completions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own completions" ON public.habit_completions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for achievements
CREATE POLICY "Users can view own achievements" ON public.achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own achievements" ON public.achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for global_reminders
CREATE POLICY "Users can view own reminders" ON public.global_reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own reminders" ON public.global_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reminders" ON public.global_reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reminders" ON public.global_reminders FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for time_periods
CREATE POLICY "Users can view own time_periods" ON public.time_periods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own time_periods" ON public.time_periods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own time_periods" ON public.time_periods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own time_periods" ON public.time_periods FOR DELETE USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all habits" ON public.habits FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all completions" ON public.habit_completions FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all achievements" ON public.achievements FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON public.habits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_habit_completions_updated_at BEFORE UPDATE ON public.habit_completions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_global_reminders_updated_at BEFORE UPDATE ON public.global_reminders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();