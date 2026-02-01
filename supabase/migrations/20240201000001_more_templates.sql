-- =====================================================
-- MORE TEMPLATES - Part 2
-- =====================================================

-- Template 3: Product Launch Checklist
SELECT create_template(
  'Product Launch Checklist',
  'Complete checklist for launching a new product or feature',
  '{
    "version": "1.0",
    "items": {
      "1": {"id": "1", "text": "Pre-Launch Preparation", "parent": null, "order": 0, "type": "header"},
      "2": {"id": "2", "text": "Product requirements documented and approved", "parent": "1", "order": 0},
      "3": {"id": "3", "text": "User research and validation completed", "parent": "1", "order": 1},
      "4": {"id": "4", "text": "Competitive analysis documented", "parent": "1", "order": 2},
      "5": {"id": "5", "text": "Success metrics defined (KPIs)", "parent": "1", "order": 3},
      "6": {"id": "6", "text": "Development & QA", "parent": null, "order": 1, "type": "header"},
      "7": {"id": "7", "text": "Feature development complete", "parent": "6", "order": 0},
      "8": {"id": "8", "text": "QA testing passed", "parent": "6", "order": 1},
      "9": {"id": "9", "text": "Performance testing completed", "parent": "6", "order": 2},
      "10": {"id": "10", "text": "Accessibility audit passed", "parent": "6", "order": 3},
      "11": {"id": "11", "text": "Security review completed", "parent": "6", "order": 4},
      "12": {"id": "12", "text": "Marketing & Communications", "parent": null, "order": 2, "type": "header"},
      "13": {"id": "13", "text": "Marketing materials created", "parent": "12", "order": 0},
      "14": {"id": "14", "text": "Press release drafted", "parent": "12", "order": 1},
      "15": {"id": "15", "text": "Social media posts scheduled", "parent": "12", "order": 2},
      "16": {"id": "16", "text": "Email announcements prepared", "parent": "12", "order": 3},
      "17": {"id": "17", "text": "Landing page live", "parent": "12", "order": 4},
      "18": {"id": "18", "text": "Support & Documentation", "parent": null, "order": 3, "type": "header"},
      "19": {"id": "19", "text": "Help documentation written", "parent": "18", "order": 0},
      "20": {"id": "20", "text": "Support team trained", "parent": "18", "order": 1},
      "21": {"id": "21", "text": "FAQ updated", "parent": "18", "order": 2},
      "22": {"id": "22", "text": "Launch Day", "parent": null, "order": 4, "type": "header"},
      "23": {"id": "23", "text": "Final go/no-go decision made", "parent": "22", "order": 0},
      "24": {"id": "24", "text": "Feature flag enabled", "parent": "22", "order": 1},
      "25": {"id": "25", "text": "Announcement published", "parent": "22", "order": 2},
      "26": {"id": "26", "text": "Monitor metrics and feedback", "parent": "22", "order": 3}
    }
  }'::jsonb,
  ARRAY['product-management', 'marketing', 'startup']
);

-- Template 4: Marketing Campaign Checklist
SELECT create_template(
  'Marketing Campaign Checklist',
  'End-to-end checklist for planning and executing marketing campaigns',
  '{
    "version": "1.0",
    "items": {
      "1": {"id": "1", "text": "Strategy & Planning", "parent": null, "order": 0, "type": "header"},
      "2": {"id": "2", "text": "Define campaign objectives and goals", "parent": "1", "order": 0},
      "3": {"id": "3", "text": "Identify target audience and personas", "parent": "1", "order": 1},
      "4": {"id": "4", "text": "Set budget and allocate resources", "parent": "1", "order": 2},
      "5": {"id": "5", "text": "Choose marketing channels", "parent": "1", "order": 3},
      "6": {"id": "6", "text": "Create campaign timeline", "parent": "1", "order": 4},
      "7": {"id": "7", "text": "Content Creation", "parent": null, "order": 1, "type": "header"},
      "8": {"id": "8", "text": "Develop key messaging", "parent": "7", "order": 0},
      "9": {"id": "9", "text": "Create visual assets (images, videos)", "parent": "7", "order": 1},
      "10": {"id": "10", "text": "Write copy for all channels", "parent": "7", "order": 2},
      "11": {"id": "11", "text": "Design landing pages", "parent": "7", "order": 3},
      "12": {"id": "12", "text": "Create email sequences", "parent": "7", "order": 4},
      "13": {"id": "13", "text": "Technical Setup", "parent": null, "order": 2, "type": "header"},
      "14": {"id": "14", "text": "Set up tracking pixels and UTM parameters", "parent": "13", "order": 0},
      "15": {"id": "15", "text": "Configure analytics dashboard", "parent": "13", "order": 1},
      "16": {"id": "16", "text": "Test all links and forms", "parent": "13", "order": 2},
      "17": {"id": "17", "text": "Set up A/B tests", "parent": "13", "order": 3},
      "18": {"id": "18", "text": "Launch & Monitor", "parent": null, "order": 3, "type": "header"},
      "19": {"id": "19", "text": "Launch campaign across channels", "parent": "18", "order": 0},
      "20": {"id": "20", "text": "Monitor performance daily", "parent": "18", "order": 1},
      "21": {"id": "21", "text": "Respond to engagement", "parent": "18", "order": 2},
      "22": {"id": "22", "text": "Optimize based on data", "parent": "18", "order": 3},
      "23": {"id": "23", "text": "Post-Campaign", "parent": null, "order": 4, "type": "header"},
      "24": {"id": "24", "text": "Compile performance report", "parent": "23", "order": 0},
      "25": {"id": "25", "text": "Document learnings", "parent": "23", "order": 1},
      "26": {"id": "26", "text": "Share results with stakeholders", "parent": "23", "order": 2}
    }
  }'::jsonb,
  ARRAY['marketing', 'project-management']
);

-- Template 5: WHO Surgical Safety Checklist
SELECT create_template(
  'Surgical Safety Checklist (WHO)',
  'World Health Organization surgical safety checklist for operating room procedures',
  '{
    "version": "1.0",
    "items": {
      "1": {"id": "1", "text": "SIGN IN (Before Induction)", "parent": null, "order": 0, "type": "header"},
      "2": {"id": "2", "text": "Patient has confirmed identity, site, procedure, consent", "parent": "1", "order": 0},
      "3": {"id": "3", "text": "Site marked/not applicable", "parent": "1", "order": 1},
      "4": {"id": "4", "text": "Anesthesia safety check completed", "parent": "1", "order": 2},
      "5": {"id": "5", "text": "Pulse oximeter on patient and functioning", "parent": "1", "order": 3},
      "6": {"id": "6", "text": "Known allergy? (documented)", "parent": "1", "order": 4},
      "7": {"id": "7", "text": "Difficult airway/aspiration risk assessed", "parent": "1", "order": 5},
      "8": {"id": "8", "text": "Risk of blood loss >500ml assessed, IV access adequate", "parent": "1", "order": 6},
      "9": {"id": "9", "text": "TIME OUT (Before Skin Incision)", "parent": null, "order": 1, "type": "header"},
      "10": {"id": "10", "text": "All team members introduced by name and role", "parent": "9", "order": 0},
      "11": {"id": "11", "text": "Surgeon, anesthesia, nurse verbally confirm patient, site, procedure", "parent": "9", "order": 1},
      "12": {"id": "12", "text": "Anticipated critical events reviewed", "parent": "9", "order": 2},
      "13": {"id": "13", "text": "Surgeon: Critical steps, operative duration, blood loss", "parent": "12", "order": 0},
      "14": {"id": "14", "text": "Anesthesia: Patient-specific concerns", "parent": "12", "order": 1},
      "15": {"id": "15", "text": "Nursing: Sterility confirmed, equipment issues", "parent": "12", "order": 2},
      "16": {"id": "16", "text": "Antibiotic prophylaxis given within 60 minutes", "parent": "9", "order": 3},
      "17": {"id": "17", "text": "Essential imaging displayed", "parent": "9", "order": 4},
      "18": {"id": "18", "text": "SIGN OUT (Before Patient Leaves OR)", "parent": null, "order": 2, "type": "header"},
      "19": {"id": "19", "text": "Nurse verbally confirms procedure recorded", "parent": "18", "order": 0},
      "20": {"id": "20", "text": "Instrument, sponge, needle counts correct", "parent": "18", "order": 1},
      "21": {"id": "21", "text": "Specimen labeled correctly", "parent": "18", "order": 2},
      "22": {"id": "22", "text": "Equipment problems addressed", "parent": "18", "order": 3},
      "23": {"id": "23", "text": "Key concerns for recovery reviewed", "parent": "18", "order": 4}
    }
  }'::jsonb,
  ARRAY['surgery', 'medical', 'emergency']
);

-- Template 6: Personal Hygiene Routine
SELECT create_template(
  'Daily Personal Hygiene Routine',
  'Comprehensive daily hygiene checklist for health and wellness',
  '{
    "version": "1.0",
    "items": {
      "1": {"id": "1", "text": "Morning Routine", "parent": null, "order": 0, "type": "header"},
      "2": {"id": "2", "text": "Wash hands upon waking", "parent": "1", "order": 0},
      "3": {"id": "3", "text": "Brush teeth for 2 minutes", "parent": "1", "order": 1},
      "4": {"id": "4", "text": "Floss teeth", "parent": "1", "order": 2},
      "5": {"id": "5", "text": "Use mouthwash", "parent": "1", "order": 3},
      "6": {"id": "6", "text": "Shower/bathe", "parent": "1", "order": 4},
      "7": {"id": "7", "text": "Wash hair (if scheduled)", "parent": "1", "order": 5},
      "8": {"id": "8", "text": "Apply deodorant", "parent": "1", "order": 6},
      "9": {"id": "9", "text": "Apply sunscreen", "parent": "1", "order": 7},
      "10": {"id": "10", "text": "Throughout the Day", "parent": null, "order": 1, "type": "header"},
      "11": {"id": "11", "text": "Wash hands before eating", "parent": "10", "order": 0},
      "12": {"id": "12", "text": "Wash hands after restroom", "parent": "10", "order": 1},
      "13": {"id": "13", "text": "Stay hydrated (8 glasses water)", "parent": "10", "order": 2},
      "14": {"id": "14", "text": "Brush teeth after lunch (if possible)", "parent": "10", "order": 3},
      "15": {"id": "15", "text": "Evening Routine", "parent": null, "order": 2, "type": "header"},
      "16": {"id": "16", "text": "Remove makeup (if applicable)", "parent": "15", "order": 0},
      "17": {"id": "17", "text": "Wash face", "parent": "15", "order": 1},
      "18": {"id": "18", "text": "Apply moisturizer", "parent": "15", "order": 2},
      "19": {"id": "19", "text": "Brush teeth for 2 minutes", "parent": "15", "order": 3},
      "20": {"id": "20", "text": "Floss teeth", "parent": "15", "order": 4},
      "21": {"id": "21", "text": "Weekly Tasks", "parent": null, "order": 3, "type": "header"},
      "22": {"id": "22", "text": "Trim nails", "parent": "21", "order": 0},
      "23": {"id": "23", "text": "Clean ears", "parent": "21", "order": 1},
      "24": {"id": "24", "text": "Exfoliate skin", "parent": "21", "order": 2},
      "25": {"id": "25", "text": "Deep condition hair", "parent": "21", "order": 3}
    }
  }'::jsonb,
  ARRAY['hygiene', 'habits', 'medical']
);

-- Template 7: International Travel Checklist
SELECT create_template(
  'International Travel Checklist',
  'Complete checklist for international travel preparation',
  '{
    "version": "1.0",
    "items": {
      "1": {"id": "1", "text": "Documents", "parent": null, "order": 0, "type": "header"},
      "2": {"id": "2", "text": "Passport valid for 6+ months", "parent": "1", "order": 0},
      "3": {"id": "3", "text": "Visa obtained (if required)", "parent": "1", "order": 1},
      "4": {"id": "4", "text": "Flight tickets/confirmations printed", "parent": "1", "order": 2},
      "5": {"id": "5", "text": "Hotel reservations confirmed", "parent": "1", "order": 3},
      "6": {"id": "6", "text": "Travel insurance purchased", "parent": "1", "order": 4},
      "7": {"id": "7", "text": "Copy of important docs (stored separately)", "parent": "1", "order": 5},
      "8": {"id": "8", "text": "International driving permit (if needed)", "parent": "1", "order": 6},
      "9": {"id": "9", "text": "Money & Cards", "parent": null, "order": 1, "type": "header"},
      "10": {"id": "10", "text": "Notify bank of travel dates", "parent": "9", "order": 0},
      "11": {"id": "11", "text": "Get local currency", "parent": "9", "order": 1},
      "12": {"id": "12", "text": "Credit cards with no foreign transaction fees", "parent": "9", "order": 2},
      "13": {"id": "13", "text": "Emergency cash backup", "parent": "9", "order": 3},
      "14": {"id": "14", "text": "Health", "parent": null, "order": 2, "type": "header"},
      "15": {"id": "15", "text": "Required vaccinations up to date", "parent": "14", "order": 0},
      "16": {"id": "16", "text": "Prescription medications (with documentation)", "parent": "14", "order": 1},
      "17": {"id": "17", "text": "First aid kit", "parent": "14", "order": 2},
      "18": {"id": "18", "text": "Hand sanitizer and masks", "parent": "14", "order": 3},
      "19": {"id": "19", "text": "Electronics", "parent": null, "order": 3, "type": "header"},
      "20": {"id": "20", "text": "Phone charger and adapter", "parent": "19", "order": 0},
      "21": {"id": "21", "text": "Universal power adapter", "parent": "19", "order": 1},
      "22": {"id": "22", "text": "Portable battery pack", "parent": "19", "order": 2},
      "23": {"id": "23", "text": "Download offline maps", "parent": "19", "order": 3},
      "24": {"id": "24", "text": "Packing", "parent": null, "order": 4, "type": "header"},
      "25": {"id": "25", "text": "Weather-appropriate clothing", "parent": "24", "order": 0},
      "26": {"id": "26", "text": "Comfortable walking shoes", "parent": "24", "order": 1},
      "27": {"id": "27", "text": "Toiletries in TSA-approved sizes", "parent": "24", "order": 2},
      "28": {"id": "28", "text": "Luggage tags with contact info", "parent": "24", "order": 3},
      "29": {"id": "29", "text": "Before Leaving", "parent": null, "order": 5, "type": "header"},
      "30": {"id": "30", "text": "Stop mail/newspaper delivery", "parent": "29", "order": 0},
      "31": {"id": "31", "text": "Arrange pet/plant care", "parent": "29", "order": 1},
      "32": {"id": "32", "text": "Set home security/lights on timers", "parent": "29", "order": 2},
      "33": {"id": "33", "text": "Share itinerary with emergency contact", "parent": "29", "order": 3}
    }
  }'::jsonb,
  ARRAY['travel', 'planning']
);
