-- =====================================================
-- LIFESTYLE TEMPLATES - Part 3
-- =====================================================

-- Template 8: Restaurant Opening Checklist
SELECT create_template(
  'Restaurant Daily Opening Checklist',
  'Complete checklist for opening a restaurant each day',
  '{
    "version": "1.0",
    "items": {
      "1": {"id": "1", "text": "Kitchen Preparation", "parent": null, "order": 0, "type": "header"},
      "2": {"id": "2", "text": "Check all refrigeration temperatures", "parent": "1", "order": 0},
      "3": {"id": "3", "text": "Inspect food quality and freshness", "parent": "1", "order": 1},
      "4": {"id": "4", "text": "Prep stations set up and stocked", "parent": "1", "order": 2},
      "5": {"id": "5", "text": "Check inventory levels", "parent": "1", "order": 3},
      "6": {"id": "6", "text": "Review daily specials with chef", "parent": "1", "order": 4},
      "7": {"id": "7", "text": "Test all cooking equipment", "parent": "1", "order": 5},
      "8": {"id": "8", "text": "Front of House", "parent": null, "order": 1, "type": "header"},
      "9": {"id": "9", "text": "Tables cleaned and set", "parent": "8", "order": 0},
      "10": {"id": "10", "text": "Menus clean and updated", "parent": "8", "order": 1},
      "11": {"id": "11", "text": "Floors swept and mopped", "parent": "8", "order": 2},
      "12": {"id": "12", "text": "Windows and mirrors clean", "parent": "8", "order": 3},
      "13": {"id": "13", "text": "Restrooms cleaned and stocked", "parent": "8", "order": 4},
      "14": {"id": "14", "text": "Ambiance set (lighting, music, temperature)", "parent": "8", "order": 5},
      "15": {"id": "15", "text": "Bar & Beverages", "parent": null, "order": 2, "type": "header"},
      "16": {"id": "16", "text": "Bar area cleaned and organized", "parent": "15", "order": 0},
      "17": {"id": "17", "text": "Ice machine checked", "parent": "15", "order": 1},
      "18": {"id": "18", "text": "Glassware polished and stocked", "parent": "15", "order": 2},
      "19": {"id": "19", "text": "Beverage inventory checked", "parent": "15", "order": 3},
      "20": {"id": "20", "text": "Staff & Operations", "parent": null, "order": 3, "type": "header"},
      "21": {"id": "21", "text": "Staff arrived and in uniform", "parent": "20", "order": 0},
      "22": {"id": "22", "text": "Pre-shift meeting conducted", "parent": "20", "order": 1},
      "23": {"id": "23", "text": "Review reservations for the day", "parent": "20", "order": 2},
      "24": {"id": "24", "text": "Cash registers/POS system ready", "parent": "20", "order": 3},
      "25": {"id": "25", "text": "Safety & Compliance", "parent": null, "order": 4, "type": "header"},
      "26": {"id": "26", "text": "Fire exits clear", "parent": "25", "order": 0},
      "27": {"id": "27", "text": "First aid kit accessible", "parent": "25", "order": 1},
      "28": {"id": "28", "text": "Sanitizer stations filled", "parent": "25", "order": 2},
      "29": {"id": "29", "text": "Health inspection certificate visible", "parent": "25", "order": 3}
    }
  }'::jsonb,
  ARRAY['restaurant', 'cooking', 'hygiene']
);

-- Template 9: Recipe Preparation Checklist
SELECT create_template(
  'Recipe Preparation Checklist',
  'Mise en place checklist template for cooking any recipe',
  '{
    "version": "1.0",
    "items": {
      "1": {"id": "1", "text": "Before You Start", "parent": null, "order": 0, "type": "header"},
      "2": {"id": "2", "text": "Read entire recipe thoroughly", "parent": "1", "order": 0},
      "3": {"id": "3", "text": "Check you have all ingredients", "parent": "1", "order": 1},
      "4": {"id": "4", "text": "Note cooking times and temperatures", "parent": "1", "order": 2},
      "5": {"id": "5", "text": "Clear and clean workspace", "parent": "1", "order": 3},
      "6": {"id": "6", "text": "Equipment Prep", "parent": null, "order": 1, "type": "header"},
      "7": {"id": "7", "text": "Gather all required tools and equipment", "parent": "6", "order": 0},
      "8": {"id": "8", "text": "Preheat oven (if needed)", "parent": "6", "order": 1},
      "9": {"id": "9", "text": "Prepare baking pans/sheets", "parent": "6", "order": 2},
      "10": {"id": "10", "text": "Set up mixing bowls", "parent": "6", "order": 3},
      "11": {"id": "11", "text": "Sharpen knives if needed", "parent": "6", "order": 4},
      "12": {"id": "12", "text": "Ingredient Prep (Mise en Place)", "parent": null, "order": 2, "type": "header"},
      "13": {"id": "13", "text": "Measure all dry ingredients", "parent": "12", "order": 0},
      "14": {"id": "14", "text": "Measure all wet ingredients", "parent": "12", "order": 1},
      "15": {"id": "15", "text": "Chop/dice vegetables", "parent": "12", "order": 2},
      "16": {"id": "16", "text": "Prepare proteins (trim, season, temper)", "parent": "12", "order": 3},
      "17": {"id": "17", "text": "Bring refrigerated items to room temp if needed", "parent": "12", "order": 4},
      "18": {"id": "18", "text": "Toast/prepare spices", "parent": "12", "order": 5},
      "19": {"id": "19", "text": "During Cooking", "parent": null, "order": 3, "type": "header"},
      "20": {"id": "20", "text": "Set timers for each step", "parent": "19", "order": 0},
      "21": {"id": "21", "text": "Taste and adjust seasoning", "parent": "19", "order": 1},
      "22": {"id": "22", "text": "Clean as you go", "parent": "19", "order": 2},
      "23": {"id": "23", "text": "Check internal temperatures (if applicable)", "parent": "19", "order": 3},
      "24": {"id": "24", "text": "Final Steps", "parent": null, "order": 4, "type": "header"},
      "25": {"id": "25", "text": "Rest meat before cutting (if applicable)", "parent": "24", "order": 0},
      "26": {"id": "26", "text": "Plate and garnish", "parent": "24", "order": 1},
      "27": {"id": "27", "text": "Serve at proper temperature", "parent": "24", "order": 2}
    }
  }'::jsonb,
  ARRAY['cooking', 'home']
);

-- Template 10: Complete Gym Workout Checklist
SELECT create_template(
  'Complete Gym Workout Checklist',
  'Full-body workout routine with warm-up, exercises, and cool-down',
  '{
    "version": "1.0",
    "items": {
      "1": {"id": "1", "text": "Pre-Workout", "parent": null, "order": 0, "type": "header"},
      "2": {"id": "2", "text": "Eat light meal 1-2 hours before", "parent": "1", "order": 0},
      "3": {"id": "3", "text": "Stay hydrated throughout the day", "parent": "1", "order": 1},
      "4": {"id": "4", "text": "Pack gym bag (towel, water, headphones)", "parent": "1", "order": 2},
      "5": {"id": "5", "text": "Wear appropriate workout clothes", "parent": "1", "order": 3},
      "6": {"id": "6", "text": "Warm-Up (10 min)", "parent": null, "order": 1, "type": "header"},
      "7": {"id": "7", "text": "5 min cardio (treadmill/bike)", "parent": "6", "order": 0},
      "8": {"id": "8", "text": "Arm circles (30 sec each direction)", "parent": "6", "order": 1},
      "9": {"id": "9", "text": "Leg swings (10 each leg)", "parent": "6", "order": 2},
      "10": {"id": "10", "text": "Hip circles (10 each direction)", "parent": "6", "order": 3},
      "11": {"id": "11", "text": "Bodyweight squats (10 reps)", "parent": "6", "order": 4},
      "12": {"id": "12", "text": "Upper Body", "parent": null, "order": 2, "type": "header"},
      "13": {"id": "13", "text": "Bench Press (3x10)", "parent": "12", "order": 0},
      "14": {"id": "14", "text": "Dumbbell Rows (3x10 each arm)", "parent": "12", "order": 1},
      "15": {"id": "15", "text": "Overhead Press (3x10)", "parent": "12", "order": 2},
      "16": {"id": "16", "text": "Lat Pulldowns (3x10)", "parent": "12", "order": 3},
      "17": {"id": "17", "text": "Bicep Curls (3x12)", "parent": "12", "order": 4},
      "18": {"id": "18", "text": "Tricep Dips (3x12)", "parent": "12", "order": 5},
      "19": {"id": "19", "text": "Lower Body", "parent": null, "order": 3, "type": "header"},
      "20": {"id": "20", "text": "Squats (3x10)", "parent": "19", "order": 0},
      "21": {"id": "21", "text": "Romanian Deadlifts (3x10)", "parent": "19", "order": 1},
      "22": {"id": "22", "text": "Leg Press (3x12)", "parent": "19", "order": 2},
      "23": {"id": "23", "text": "Lunges (3x10 each leg)", "parent": "19", "order": 3},
      "24": {"id": "24", "text": "Calf Raises (3x15)", "parent": "19", "order": 4},
      "25": {"id": "25", "text": "Core", "parent": null, "order": 4, "type": "header"},
      "26": {"id": "26", "text": "Plank (3x30 sec)", "parent": "25", "order": 0},
      "27": {"id": "27", "text": "Russian Twists (3x20)", "parent": "25", "order": 1},
      "28": {"id": "28", "text": "Leg Raises (3x12)", "parent": "25", "order": 2},
      "29": {"id": "29", "text": "Cool-Down (10 min)", "parent": null, "order": 5, "type": "header"},
      "30": {"id": "30", "text": "5 min light cardio", "parent": "29", "order": 0},
      "31": {"id": "31", "text": "Hamstring stretch (30 sec each)", "parent": "29", "order": 1},
      "32": {"id": "32", "text": "Quad stretch (30 sec each)", "parent": "29", "order": 2},
      "33": {"id": "33", "text": "Chest stretch (30 sec)", "parent": "29", "order": 3},
      "34": {"id": "34", "text": "Shoulder stretch (30 sec each)", "parent": "29", "order": 4},
      "35": {"id": "35", "text": "Log workout in fitness app", "parent": "29", "order": 5}
    }
  }'::jsonb,
  ARRAY['fitness', 'habits', 'hygiene']
);

-- Template 11: AI Prompt Engineering Checklist
SELECT create_template(
  'AI Prompt Engineering Checklist',
  'Best practices for crafting effective AI prompts',
  '{
    "version": "1.0",
    "items": {
      "1": {"id": "1", "text": "Define Your Goal", "parent": null, "order": 0, "type": "header"},
      "2": {"id": "2", "text": "Clearly identify desired output type", "parent": "1", "order": 0},
      "3": {"id": "3", "text": "Determine success criteria", "parent": "1", "order": 1},
      "4": {"id": "4", "text": "Consider edge cases and constraints", "parent": "1", "order": 2},
      "5": {"id": "5", "text": "Structure Your Prompt", "parent": null, "order": 1, "type": "header"},
      "6": {"id": "6", "text": "Set context/role (You are a...)", "parent": "5", "order": 0},
      "7": {"id": "7", "text": "Provide clear instructions", "parent": "5", "order": 1},
      "8": {"id": "8", "text": "Include relevant examples (few-shot)", "parent": "5", "order": 2},
      "9": {"id": "9", "text": "Specify output format (JSON, markdown, etc.)", "parent": "5", "order": 3},
      "10": {"id": "10", "text": "Add constraints and boundaries", "parent": "5", "order": 4},
      "11": {"id": "11", "text": "Optimize for Quality", "parent": null, "order": 2, "type": "header"},
      "12": {"id": "12", "text": "Use specific, unambiguous language", "parent": "11", "order": 0},
      "13": {"id": "13", "text": "Break complex tasks into steps", "parent": "11", "order": 1},
      "14": {"id": "14", "text": "Ask for reasoning (chain of thought)", "parent": "11", "order": 2},
      "15": {"id": "15", "text": "Request self-verification", "parent": "11", "order": 3},
      "16": {"id": "16", "text": "Common Techniques", "parent": null, "order": 3, "type": "header"},
      "17": {"id": "17", "text": "Zero-shot: Direct instruction", "parent": "16", "order": 0},
      "18": {"id": "18", "text": "Few-shot: Provide examples", "parent": "16", "order": 1},
      "19": {"id": "19", "text": "Chain-of-thought: Step-by-step reasoning", "parent": "16", "order": 2},
      "20": {"id": "20", "text": "Self-consistency: Multiple attempts", "parent": "16", "order": 3},
      "21": {"id": "21", "text": "Iteration & Testing", "parent": null, "order": 4, "type": "header"},
      "22": {"id": "22", "text": "Test with multiple inputs", "parent": "21", "order": 0},
      "23": {"id": "23", "text": "Evaluate outputs against criteria", "parent": "21", "order": 1},
      "24": {"id": "24", "text": "Refine prompt based on failures", "parent": "21", "order": 2},
      "25": {"id": "25", "text": "Document successful prompts", "parent": "21", "order": 3},
      "26": {"id": "26", "text": "A/B test variations", "parent": "21", "order": 4},
      "27": {"id": "27", "text": "Safety & Ethics", "parent": null, "order": 5, "type": "header"},
      "28": {"id": "28", "text": "Include safety guardrails", "parent": "27", "order": 0},
      "29": {"id": "29", "text": "Test for bias in outputs", "parent": "27", "order": 1},
      "30": {"id": "30", "text": "Verify factual accuracy", "parent": "27", "order": 2},
      "31": {"id": "31", "text": "Consider privacy implications", "parent": "27", "order": 3}
    }
  }'::jsonb,
  ARRAY['ai-prompting', 'software-engineering', 'productivity']
);

-- Template 12: Daily Habit Tracker
SELECT create_template(
  'Daily Habit Tracker',
  'Template for tracking essential daily habits for success',
  '{
    "version": "1.0",
    "items": {
      "1": {"id": "1", "text": "Morning Habits", "parent": null, "order": 0, "type": "header"},
      "2": {"id": "2", "text": "Wake up at planned time", "parent": "1", "order": 0},
      "3": {"id": "3", "text": "Make bed", "parent": "1", "order": 1},
      "4": {"id": "4", "text": "Drink glass of water", "parent": "1", "order": 2},
      "5": {"id": "5", "text": "Morning meditation (10 min)", "parent": "1", "order": 3},
      "6": {"id": "6", "text": "Exercise/stretch", "parent": "1", "order": 4},
      "7": {"id": "7", "text": "Healthy breakfast", "parent": "1", "order": 5},
      "8": {"id": "8", "text": "Review daily goals", "parent": "1", "order": 6},
      "9": {"id": "9", "text": "Work Habits", "parent": null, "order": 1, "type": "header"},
      "10": {"id": "10", "text": "Complete most important task first", "parent": "9", "order": 0},
      "11": {"id": "11", "text": "Take regular breaks (Pomodoro)", "parent": "9", "order": 1},
      "12": {"id": "12", "text": "Limit social media to scheduled times", "parent": "9", "order": 2},
      "13": {"id": "13", "text": "Check email only 2-3 times", "parent": "9", "order": 3},
      "14": {"id": "14", "text": "Learn something new (15 min)", "parent": "9", "order": 4},
      "15": {"id": "15", "text": "Health Habits", "parent": null, "order": 2, "type": "header"},
      "16": {"id": "16", "text": "Drink 8 glasses of water", "parent": "15", "order": 0},
      "17": {"id": "17", "text": "Take 10,000 steps", "parent": "15", "order": 1},
      "18": {"id": "18", "text": "Eat fruits/vegetables", "parent": "15", "order": 2},
      "19": {"id": "19", "text": "Avoid processed foods", "parent": "15", "order": 3},
      "20": {"id": "20", "text": "No screens 1 hour before bed", "parent": "15", "order": 4},
      "21": {"id": "21", "text": "Evening Habits", "parent": null, "order": 3, "type": "header"},
      "22": {"id": "22", "text": "Review what went well today", "parent": "21", "order": 0},
      "23": {"id": "23", "text": "Plan tomorrow''s priorities", "parent": "21", "order": 1},
      "24": {"id": "24", "text": "Tidy workspace", "parent": "21", "order": 2},
      "25": {"id": "25", "text": "Gratitude journaling (3 things)", "parent": "21", "order": 3},
      "26": {"id": "26", "text": "Read for 30 minutes", "parent": "21", "order": 4},
      "27": {"id": "27", "text": "Sleep by target time", "parent": "21", "order": 5},
      "28": {"id": "28", "text": "Weekly Review", "parent": null, "order": 4, "type": "header"},
      "29": {"id": "29", "text": "Review habit completion rate", "parent": "28", "order": 0},
      "30": {"id": "30", "text": "Identify challenges and blockers", "parent": "28", "order": 1},
      "31": {"id": "31", "text": "Adjust habits if needed", "parent": "28", "order": 2},
      "32": {"id": "32", "text": "Celebrate wins", "parent": "28", "order": 3}
    }
  }'::jsonb,
  ARRAY['habits', 'productivity', 'mental-health']
);
