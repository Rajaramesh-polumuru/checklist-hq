-- =====================================================
-- FINAL TEMPLATES - Part 4
-- =====================================================

-- Template 13: Personal Finance Monthly Review
SELECT create_template(
  'Personal Finance Monthly Review',
  'Monthly checklist for managing personal finances and budgeting',
  '{
    "version": "1.0",
    "items": {
      "1": {"id": "1", "text": "Income Review", "parent": null, "order": 0, "type": "header"},
      "2": {"id": "2", "text": "Record all income sources", "parent": "1", "order": 0},
      "3": {"id": "3", "text": "Verify paychecks deposited correctly", "parent": "1", "order": 1},
      "4": {"id": "4", "text": "Track any side income/freelance", "parent": "1", "order": 2},
      "5": {"id": "5", "text": "Note investment dividends/interest", "parent": "1", "order": 3},
      "6": {"id": "6", "text": "Expense Tracking", "parent": null, "order": 1, "type": "header"},
      "7": {"id": "7", "text": "Review all credit card statements", "parent": "6", "order": 0},
      "8": {"id": "8", "text": "Categorize all expenses", "parent": "6", "order": 1},
      "9": {"id": "9", "text": "Identify unnecessary spending", "parent": "6", "order": 2},
      "10": {"id": "10", "text": "Compare spending vs budget", "parent": "6", "order": 3},
      "11": {"id": "11", "text": "Check for fraudulent charges", "parent": "6", "order": 4},
      "12": {"id": "12", "text": "Bills & Payments", "parent": null, "order": 2, "type": "header"},
      "13": {"id": "13", "text": "Rent/mortgage paid", "parent": "12", "order": 0},
      "14": {"id": "14", "text": "Utilities paid (electric, gas, water)", "parent": "12", "order": 1},
      "15": {"id": "15", "text": "Insurance premiums paid", "parent": "12", "order": 2},
      "16": {"id": "16", "text": "Subscriptions reviewed", "parent": "12", "order": 3},
      "17": {"id": "17", "text": "Credit card paid (preferably in full)", "parent": "12", "order": 4},
      "18": {"id": "18", "text": "Savings & Investments", "parent": null, "order": 3, "type": "header"},
      "19": {"id": "19", "text": "Emergency fund contribution", "parent": "18", "order": 0},
      "20": {"id": "20", "text": "Retirement account contribution (401k/IRA)", "parent": "18", "order": 1},
      "21": {"id": "21", "text": "Review investment performance", "parent": "18", "order": 2},
      "22": {"id": "22", "text": "Rebalance portfolio if needed", "parent": "18", "order": 3},
      "23": {"id": "23", "text": "Other savings goals (vacation, house)", "parent": "18", "order": 4},
      "24": {"id": "24", "text": "Debt Management", "parent": null, "order": 4, "type": "header"},
      "25": {"id": "25", "text": "Review total debt balance", "parent": "24", "order": 0},
      "26": {"id": "26", "text": "Make extra debt payments if possible", "parent": "24", "order": 1},
      "27": {"id": "27", "text": "Check interest rates for refinancing", "parent": "24", "order": 2},
      "28": {"id": "28", "text": "Next Month Planning", "parent": null, "order": 5, "type": "header"},
      "29": {"id": "29", "text": "Set budget for next month", "parent": "28", "order": 0},
      "30": {"id": "30", "text": "Note upcoming large expenses", "parent": "28", "order": 1},
      "31": {"id": "31", "text": "Update financial goals", "parent": "28", "order": 2},
      "32": {"id": "32", "text": "Check credit score", "parent": "28", "order": 3}
    }
  }'::jsonb,
  ARRAY['finance', 'habits', 'productivity']
);

-- Template 14: New Employee Onboarding
SELECT create_template(
  'New Employee Onboarding',
  'Complete onboarding checklist for new team members',
  '{
    "version": "1.0",
    "items": {
      "1": {"id": "1", "text": "Before First Day", "parent": null, "order": 0, "type": "header"},
      "2": {"id": "2", "text": "Send welcome email with first day details", "parent": "1", "order": 0},
      "3": {"id": "3", "text": "Prepare workstation/laptop", "parent": "1", "order": 1},
      "4": {"id": "4", "text": "Create company email account", "parent": "1", "order": 2},
      "5": {"id": "5", "text": "Set up necessary software accounts", "parent": "1", "order": 3},
      "6": {"id": "6", "text": "Prepare onboarding materials", "parent": "1", "order": 4},
      "7": {"id": "7", "text": "Notify team of new hire start date", "parent": "1", "order": 5},
      "8": {"id": "8", "text": "First Day", "parent": null, "order": 1, "type": "header"},
      "9": {"id": "9", "text": "Greet and give office tour", "parent": "8", "order": 0},
      "10": {"id": "10", "text": "Introduce to team members", "parent": "8", "order": 1},
      "11": {"id": "11", "text": "Review company policies and handbook", "parent": "8", "order": 2},
      "12": {"id": "12", "text": "Complete HR paperwork", "parent": "8", "order": 3},
      "13": {"id": "13", "text": "Set up computer and accounts", "parent": "8", "order": 4},
      "14": {"id": "14", "text": "Assign buddy/mentor", "parent": "8", "order": 5},
      "15": {"id": "15", "text": "First Week", "parent": null, "order": 2, "type": "header"},
      "16": {"id": "16", "text": "Schedule 1:1 with manager", "parent": "15", "order": 0},
      "17": {"id": "17", "text": "Review role expectations and goals", "parent": "15", "order": 1},
      "18": {"id": "18", "text": "Access granted to all needed systems", "parent": "15", "order": 2},
      "19": {"id": "19", "text": "Complete required training modules", "parent": "15", "order": 3},
      "20": {"id": "20", "text": "Attend team meetings", "parent": "15", "order": 4},
      "21": {"id": "21", "text": "Start first small project/task", "parent": "15", "order": 5},
      "22": {"id": "22", "text": "First Month", "parent": null, "order": 3, "type": "header"},
      "23": {"id": "23", "text": "30-day check-in meeting", "parent": "22", "order": 0},
      "24": {"id": "24", "text": "All training completed", "parent": "22", "order": 1},
      "25": {"id": "25", "text": "Working independently on tasks", "parent": "22", "order": 2},
      "26": {"id": "26", "text": "Feedback session with manager", "parent": "22", "order": 3},
      "27": {"id": "27", "text": "90-Day Goals", "parent": null, "order": 4, "type": "header"},
      "28": {"id": "28", "text": "90-day review scheduled", "parent": "27", "order": 0},
      "29": {"id": "29", "text": "Contributing meaningfully to projects", "parent": "27", "order": 1},
      "30": {"id": "30", "text": "Relationships built with key stakeholders", "parent": "27", "order": 2},
      "31": {"id": "31", "text": "Performance goals set for next quarter", "parent": "27", "order": 3}
    }
  }'::jsonb,
  ARRAY['onboarding', 'project-management']
);

-- Template 15: API Design Review
SELECT create_template(
  'API Design Review Checklist',
  'Best practices checklist for RESTful API design',
  '{
    "version": "1.0",
    "items": {
      "1": {"id": "1", "text": "URL Design", "parent": null, "order": 0, "type": "header"},
      "2": {"id": "2", "text": "Use nouns, not verbs in URLs", "parent": "1", "order": 0},
      "3": {"id": "3", "text": "Use plural nouns for collections", "parent": "1", "order": 1},
      "4": {"id": "4", "text": "Use kebab-case for multi-word resources", "parent": "1", "order": 2},
      "5": {"id": "5", "text": "Hierarchical URLs reflect relationships", "parent": "1", "order": 3},
      "6": {"id": "6", "text": "Query params for filtering/sorting", "parent": "1", "order": 4},
      "7": {"id": "7", "text": "HTTP Methods", "parent": null, "order": 1, "type": "header"},
      "8": {"id": "8", "text": "GET for reading (no side effects)", "parent": "7", "order": 0},
      "9": {"id": "9", "text": "POST for creating resources", "parent": "7", "order": 1},
      "10": {"id": "10", "text": "PUT/PATCH for updates", "parent": "7", "order": 2},
      "11": {"id": "11", "text": "DELETE for removal", "parent": "7", "order": 3},
      "12": {"id": "12", "text": "Idempotency considered", "parent": "7", "order": 4},
      "13": {"id": "13", "text": "Response Design", "parent": null, "order": 2, "type": "header"},
      "14": {"id": "14", "text": "Consistent response structure", "parent": "13", "order": 0},
      "15": {"id": "15", "text": "Proper HTTP status codes", "parent": "13", "order": 1},
      "16": {"id": "16", "text": "Pagination for list endpoints", "parent": "13", "order": 2},
      "17": {"id": "17", "text": "Error responses include helpful messages", "parent": "13", "order": 3},
      "18": {"id": "18", "text": "Timestamps in ISO 8601 format", "parent": "13", "order": 4},
      "19": {"id": "19", "text": "Security", "parent": null, "order": 3, "type": "header"},
      "20": {"id": "20", "text": "Authentication required (JWT/OAuth)", "parent": "19", "order": 0},
      "21": {"id": "21", "text": "Authorization checks in place", "parent": "19", "order": 1},
      "22": {"id": "22", "text": "Rate limiting configured", "parent": "19", "order": 2},
      "23": {"id": "23", "text": "Input validation on all endpoints", "parent": "19", "order": 3},
      "24": {"id": "24", "text": "HTTPS only", "parent": "19", "order": 4},
      "25": {"id": "25", "text": "CORS configured correctly", "parent": "19", "order": 5},
      "26": {"id": "26", "text": "Documentation", "parent": null, "order": 4, "type": "header"},
      "27": {"id": "27", "text": "OpenAPI/Swagger spec created", "parent": "26", "order": 0},
      "28": {"id": "28", "text": "All endpoints documented", "parent": "26", "order": 1},
      "29": {"id": "29", "text": "Request/response examples provided", "parent": "26", "order": 2},
      "30": {"id": "30", "text": "Error codes documented", "parent": "26", "order": 3},
      "31": {"id": "31", "text": "Versioning strategy documented", "parent": "26", "order": 4}
    }
  }'::jsonb,
  ARRAY['api-development', 'software-engineering', 'code-review']
);

-- Template 16: Home Moving Checklist
SELECT create_template(
  'Home Moving Checklist',
  'Complete checklist for moving to a new home',
  '{
    "version": "1.0",
    "items": {
      "1": {"id": "1", "text": "8 Weeks Before", "parent": null, "order": 0, "type": "header"},
      "2": {"id": "2", "text": "Create moving budget", "parent": "1", "order": 0},
      "3": {"id": "3", "text": "Research and book moving company", "parent": "1", "order": 1},
      "4": {"id": "4", "text": "Start decluttering (donate/sell items)", "parent": "1", "order": 2},
      "5": {"id": "5", "text": "Gather important documents", "parent": "1", "order": 3},
      "6": {"id": "6", "text": "4 Weeks Before", "parent": null, "order": 1, "type": "header"},
      "7": {"id": "7", "text": "Notify landlord (if renting)", "parent": "6", "order": 0},
      "8": {"id": "8", "text": "Change address with post office", "parent": "6", "order": 1},
      "9": {"id": "9", "text": "Update address for bank/credit cards", "parent": "6", "order": 2},
      "10": {"id": "10", "text": "Transfer utilities", "parent": "6", "order": 3},
      "11": {"id": "11", "text": "Start packing non-essentials", "parent": "6", "order": 4},
      "12": {"id": "12", "text": "2 Weeks Before", "parent": null, "order": 2, "type": "header"},
      "13": {"id": "13", "text": "Confirm moving company details", "parent": "12", "order": 0},
      "14": {"id": "14", "text": "Pack room by room", "parent": "12", "order": 1},
      "15": {"id": "15", "text": "Label all boxes clearly", "parent": "12", "order": 2},
      "16": {"id": "16", "text": "Arrange childcare/pet care for moving day", "parent": "12", "order": 3},
      "17": {"id": "17", "text": "1 Week Before", "parent": null, "order": 3, "type": "header"},
      "18": {"id": "18", "text": "Pack essentials box (toiletries, chargers)", "parent": "17", "order": 0},
      "19": {"id": "19", "text": "Defrost freezer", "parent": "17", "order": 1},
      "20": {"id": "20", "text": "Confirm new home is ready", "parent": "17", "order": 2},
      "21": {"id": "21", "text": "Back up computer files", "parent": "17", "order": 3},
      "22": {"id": "22", "text": "Moving Day", "parent": null, "order": 4, "type": "header"},
      "23": {"id": "23", "text": "Do final walkthrough of old home", "parent": "22", "order": 0},
      "24": {"id": "24", "text": "Check all rooms, closets, cabinets", "parent": "22", "order": 1},
      "25": {"id": "25", "text": "Take meter readings", "parent": "22", "order": 2},
      "26": {"id": "26", "text": "Return keys to landlord", "parent": "22", "order": 3},
      "27": {"id": "27", "text": "Supervise loading/unloading", "parent": "22", "order": 4},
      "28": {"id": "28", "text": "After Move", "parent": null, "order": 5, "type": "header"},
      "29": {"id": "29", "text": "Update driver''s license", "parent": "28", "order": 0},
      "30": {"id": "30", "text": "Register to vote at new address", "parent": "28", "order": 1},
      "31": {"id": "31", "text": "Update employer with new address", "parent": "28", "order": 2},
      "32": {"id": "32", "text": "Meet neighbors", "parent": "28", "order": 3}
    }
  }'::jsonb,
  ARRAY['home', 'planning']
);

-- Template 17: Security Audit Checklist
SELECT create_template(
  'Security Audit Checklist',
  'Comprehensive security review checklist for web applications',
  '{
    "version": "1.0",
    "items": {
      "1": {"id": "1", "text": "Authentication", "parent": null, "order": 0, "type": "header"},
      "2": {"id": "2", "text": "Strong password policy enforced", "parent": "1", "order": 0},
      "3": {"id": "3", "text": "MFA available and encouraged", "parent": "1", "order": 1},
      "4": {"id": "4", "text": "Account lockout after failed attempts", "parent": "1", "order": 2},
      "5": {"id": "5", "text": "Secure password reset flow", "parent": "1", "order": 3},
      "6": {"id": "6", "text": "Session tokens are secure (HttpOnly, Secure)", "parent": "1", "order": 4},
      "7": {"id": "7", "text": "Session timeout implemented", "parent": "1", "order": 5},
      "8": {"id": "8", "text": "Data Protection", "parent": null, "order": 1, "type": "header"},
      "9": {"id": "9", "text": "All data encrypted in transit (HTTPS)", "parent": "8", "order": 0},
      "10": {"id": "10", "text": "Sensitive data encrypted at rest", "parent": "8", "order": 1},
      "11": {"id": "11", "text": "PII handling compliant with regulations", "parent": "8", "order": 2},
      "12": {"id": "12", "text": "Database backups encrypted", "parent": "8", "order": 3},
      "13": {"id": "13", "text": "No sensitive data in logs", "parent": "8", "order": 4},
      "14": {"id": "14", "text": "Input Validation", "parent": null, "order": 2, "type": "header"},
      "15": {"id": "15", "text": "All inputs validated server-side", "parent": "14", "order": 0},
      "16": {"id": "16", "text": "SQL injection prevention", "parent": "14", "order": 1},
      "17": {"id": "17", "text": "XSS prevention (output encoding)", "parent": "14", "order": 2},
      "18": {"id": "18", "text": "CSRF tokens implemented", "parent": "14", "order": 3},
      "19": {"id": "19", "text": "File upload validation", "parent": "14", "order": 4},
      "20": {"id": "20", "text": "Infrastructure", "parent": null, "order": 3, "type": "header"},
      "21": {"id": "21", "text": "Firewall rules configured", "parent": "20", "order": 0},
      "22": {"id": "22", "text": "Unnecessary ports closed", "parent": "20", "order": 1},
      "23": {"id": "23", "text": "Security patches up to date", "parent": "20", "order": 2},
      "24": {"id": "24", "text": "Dependencies scanned for vulnerabilities", "parent": "20", "order": 3},
      "25": {"id": "25", "text": "Error messages don''t leak info", "parent": "20", "order": 4},
      "26": {"id": "26", "text": "Monitoring & Response", "parent": null, "order": 4, "type": "header"},
      "27": {"id": "27", "text": "Security logging enabled", "parent": "26", "order": 0},
      "28": {"id": "28", "text": "Alerting for suspicious activity", "parent": "26", "order": 1},
      "29": {"id": "29", "text": "Incident response plan documented", "parent": "26", "order": 2},
      "30": {"id": "30", "text": "Regular security assessments scheduled", "parent": "26", "order": 3}
    }
  }'::jsonb,
  ARRAY['security', 'software-engineering', 'devops']
);

-- Template 18: Meeting Facilitation
SELECT create_template(
  'Meeting Facilitation Checklist',
  'Run effective and productive meetings',
  '{
    "version": "1.0",
    "items": {
      "1": {"id": "1", "text": "Before the Meeting", "parent": null, "order": 0, "type": "header"},
      "2": {"id": "2", "text": "Define clear meeting objective", "parent": "1", "order": 0},
      "3": {"id": "3", "text": "Create and share agenda in advance", "parent": "1", "order": 1},
      "4": {"id": "4", "text": "Invite only necessary participants", "parent": "1", "order": 2},
      "5": {"id": "5", "text": "Send pre-read materials if needed", "parent": "1", "order": 3},
      "6": {"id": "6", "text": "Book appropriate room/setup video call", "parent": "1", "order": 4},
      "7": {"id": "7", "text": "Test technology (screen share, mic)", "parent": "1", "order": 5},
      "8": {"id": "8", "text": "Starting the Meeting", "parent": null, "order": 1, "type": "header"},
      "9": {"id": "9", "text": "Start on time", "parent": "8", "order": 0},
      "10": {"id": "10", "text": "State meeting purpose and desired outcome", "parent": "8", "order": 1},
      "11": {"id": "11", "text": "Review agenda and time allocation", "parent": "8", "order": 2},
      "12": {"id": "12", "text": "Assign note-taker", "parent": "8", "order": 3},
      "13": {"id": "13", "text": "Set ground rules if needed", "parent": "8", "order": 4},
      "14": {"id": "14", "text": "During the Meeting", "parent": null, "order": 2, "type": "header"},
      "15": {"id": "15", "text": "Keep discussion on track", "parent": "14", "order": 0},
      "16": {"id": "16", "text": "Ensure all voices are heard", "parent": "14", "order": 1},
      "17": {"id": "17", "text": "Manage time for each agenda item", "parent": "14", "order": 2},
      "18": {"id": "18", "text": "Park off-topic items for later", "parent": "14", "order": 3},
      "19": {"id": "19", "text": "Summarize decisions as they''re made", "parent": "14", "order": 4},
      "20": {"id": "20", "text": "Closing the Meeting", "parent": null, "order": 3, "type": "header"},
      "21": {"id": "21", "text": "Recap decisions and action items", "parent": "20", "order": 0},
      "22": {"id": "22", "text": "Assign owners and deadlines", "parent": "20", "order": 1},
      "23": {"id": "23", "text": "Confirm next steps", "parent": "20", "order": 2},
      "24": {"id": "24", "text": "End on time", "parent": "20", "order": 3},
      "25": {"id": "25", "text": "After the Meeting", "parent": null, "order": 4, "type": "header"},
      "26": {"id": "26", "text": "Send meeting notes within 24 hours", "parent": "25", "order": 0},
      "27": {"id": "27", "text": "Follow up on action items", "parent": "25", "order": 1},
      "28": {"id": "28", "text": "Schedule follow-up if needed", "parent": "25", "order": 2}
    }
  }'::jsonb,
  ARRAY['project-management', 'productivity']
);

-- Template 19: Weekly Mental Health Check-in
SELECT create_template(
  'Weekly Mental Health Check-in',
  'Self-care checklist for maintaining mental wellness',
  '{
    "version": "1.0",
    "items": {
      "1": {"id": "1", "text": "Physical Wellness", "parent": null, "order": 0, "type": "header"},
      "2": {"id": "2", "text": "Got 7-9 hours sleep most nights", "parent": "1", "order": 0},
      "3": {"id": "3", "text": "Exercised at least 3 times", "parent": "1", "order": 1},
      "4": {"id": "4", "text": "Ate nutritious meals", "parent": "1", "order": 2},
      "5": {"id": "5", "text": "Stayed hydrated", "parent": "1", "order": 3},
      "6": {"id": "6", "text": "Spent time outdoors", "parent": "1", "order": 4},
      "7": {"id": "7", "text": "Emotional Check-in", "parent": null, "order": 1, "type": "header"},
      "8": {"id": "8", "text": "Identified and named emotions felt", "parent": "7", "order": 0},
      "9": {"id": "9", "text": "Practiced self-compassion", "parent": "7", "order": 1},
      "10": {"id": "10", "text": "Set healthy boundaries", "parent": "7", "order": 2},
      "11": {"id": "11", "text": "Expressed feelings to someone trusted", "parent": "7", "order": 3},
      "12": {"id": "12", "text": "Social Connection", "parent": null, "order": 2, "type": "header"},
      "13": {"id": "13", "text": "Had meaningful conversation with friend/family", "parent": "12", "order": 0},
      "14": {"id": "14", "text": "Reached out to someone I care about", "parent": "12", "order": 1},
      "15": {"id": "15", "text": "Participated in social activity", "parent": "12", "order": 2},
      "16": {"id": "16", "text": "Limited toxic interactions", "parent": "12", "order": 3},
      "17": {"id": "17", "text": "Stress Management", "parent": null, "order": 3, "type": "header"},
      "18": {"id": "18", "text": "Practiced meditation/mindfulness", "parent": "17", "order": 0},
      "19": {"id": "19", "text": "Did breathing exercises when stressed", "parent": "17", "order": 1},
      "20": {"id": "20", "text": "Took breaks during work", "parent": "17", "order": 2},
      "21": {"id": "21", "text": "Did an activity just for fun", "parent": "17", "order": 3},
      "22": {"id": "22", "text": "Reflection", "parent": null, "order": 4, "type": "header"},
      "23": {"id": "23", "text": "What went well this week?", "parent": "22", "order": 0},
      "24": {"id": "24", "text": "What was challenging?", "parent": "22", "order": 1},
      "25": {"id": "25", "text": "What do I need more of?", "parent": "22", "order": 2},
      "26": {"id": "26", "text": "What am I grateful for?", "parent": "22", "order": 3},
      "27": {"id": "27", "text": "Professional Help", "parent": null, "order": 5, "type": "header"},
      "28": {"id": "28", "text": "Therapy appointment scheduled (if applicable)", "parent": "27", "order": 0},
      "29": {"id": "29", "text": "Medications taken as prescribed", "parent": "27", "order": 1}
    }
  }'::jsonb,
  ARRAY['mental-health', 'habits', 'hygiene']
);

-- Template 20: Event Planning Checklist
SELECT create_template(
  'Event Planning Checklist',
  'Comprehensive checklist for planning and executing events',
  '{
    "version": "1.0",
    "items": {
      "1": {"id": "1", "text": "Initial Planning (8+ weeks)", "parent": null, "order": 0, "type": "header"},
      "2": {"id": "2", "text": "Define event purpose and goals", "parent": "1", "order": 0},
      "3": {"id": "3", "text": "Set budget", "parent": "1", "order": 1},
      "4": {"id": "4", "text": "Choose date and time", "parent": "1", "order": 2},
      "5": {"id": "5", "text": "Estimate guest count", "parent": "1", "order": 3},
      "6": {"id": "6", "text": "Book venue", "parent": "1", "order": 4},
      "7": {"id": "7", "text": "Create event committee/team", "parent": "1", "order": 5},
      "8": {"id": "8", "text": "Logistics (4-8 weeks)", "parent": null, "order": 1, "type": "header"},
      "9": {"id": "9", "text": "Hire caterer", "parent": "8", "order": 0},
      "10": {"id": "10", "text": "Arrange entertainment/speakers", "parent": "8", "order": 1},
      "11": {"id": "11", "text": "Plan decorations", "parent": "8", "order": 2},
      "12": {"id": "12", "text": "Arrange A/V equipment", "parent": "8", "order": 3},
      "13": {"id": "13", "text": "Create run of show", "parent": "8", "order": 4},
      "14": {"id": "14", "text": "Invitations (4-6 weeks)", "parent": null, "order": 2, "type": "header"},
      "15": {"id": "15", "text": "Finalize guest list", "parent": "14", "order": 0},
      "16": {"id": "16", "text": "Design and send invitations", "parent": "14", "order": 1},
      "17": {"id": "17", "text": "Set up RSVP tracking", "parent": "14", "order": 2},
      "18": {"id": "18", "text": "Send reminders", "parent": "14", "order": 3},
      "19": {"id": "19", "text": "Final Week", "parent": null, "order": 3, "type": "header"},
      "20": {"id": "20", "text": "Confirm all vendors", "parent": "19", "order": 0},
      "21": {"id": "21", "text": "Final headcount to caterer", "parent": "19", "order": 1},
      "22": {"id": "22", "text": "Create seating chart (if needed)", "parent": "19", "order": 2},
      "23": {"id": "23", "text": "Prepare name tags/materials", "parent": "19", "order": 3},
      "24": {"id": "24", "text": "Brief event staff", "parent": "19", "order": 4},
      "25": {"id": "25", "text": "Event Day", "parent": null, "order": 4, "type": "header"},
      "26": {"id": "26", "text": "Arrive early for setup", "parent": "25", "order": 0},
      "27": {"id": "27", "text": "Test all A/V equipment", "parent": "25", "order": 1},
      "28": {"id": "28", "text": "Brief all team members", "parent": "25", "order": 2},
      "29": {"id": "29", "text": "Welcome guests", "parent": "25", "order": 3},
      "30": {"id": "30", "text": "Take photos/videos", "parent": "25", "order": 4},
      "31": {"id": "31", "text": "Post-Event", "parent": null, "order": 5, "type": "header"},
      "32": {"id": "32", "text": "Send thank you notes", "parent": "31", "order": 0},
      "33": {"id": "33", "text": "Pay vendors", "parent": "31", "order": 1},
      "34": {"id": "34", "text": "Review budget vs actuals", "parent": "31", "order": 2},
      "35": {"id": "35", "text": "Document lessons learned", "parent": "31", "order": 3}
    }
  }'::jsonb,
  ARRAY['events', 'project-management', 'planning']
);

-- =====================================================
-- CLEANUP: Drop the helper function (optional, can keep for future use)
-- =====================================================
-- DROP FUNCTION IF EXISTS create_template;
