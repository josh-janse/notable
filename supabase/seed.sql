-- seed data for notable process note-taking app
-- this file provides sample data for development and testing

-- insert sample note templates
-- soap note template (widely used in healthcare/counseling)
insert into note_templates (name, description, structure, is_active)
values (
  'SOAP Note',
  'Widely used format for healthcare and counseling session notes',
  '{
    "headers": [
      {
        "level": 1,
        "text": "Session Note",
        "locked": true
      }
    ],
    "prompting_questions": [
      "What brought the client to today''s session? What concerns or topics did they want to discuss?",
      "What was the client''s mood and affect during the session? Were there any notable behaviors or physical presentations?",
      "How is the client progressing toward their treatment goals? What patterns or themes emerged?",
      "What interventions or techniques were used during the session? What are the next steps?",
      "Are there any safety concerns, follow-up actions, or homework assignments for the client?"
    ],
    "sections": [
      {
        "title": "Subjective",
        "placeholder": "Client''s reported feelings, concerns, and experiences during the session",
        "required": true,
        "locked": false
      },
      {
        "title": "Objective",
        "placeholder": "Observable behaviors, mood, appearance, and clinical observations",
        "required": true,
        "locked": false
      },
      {
        "title": "Assessment",
        "placeholder": "Clinical impression, diagnosis considerations, and evaluation of progress",
        "required": true,
        "locked": false
      },
      {
        "title": "Plan",
        "placeholder": "Treatment plan, interventions, homework assignments, and next steps",
        "required": true,
        "locked": false
      }
    ]
  }'::jsonb,
  true
)
on conflict (name) do nothing;

-- progress note template (standard for ongoing treatment documentation)
insert into note_templates (name, description, structure, is_active)
values (
  'Progress Note',
  'Standard format for ongoing treatment documentation',
  '{
    "headers": [
      {
        "level": 1,
        "text": "Progress Note",
        "locked": true
      }
    ],
    "prompting_questions": [
      "What were the main topics or themes discussed in today''s session?",
      "How is the client progressing toward their established treatment goals?",
      "What therapeutic interventions or techniques were used during this session?",
      "How did the client respond to the interventions? What was their level of engagement?",
      "What are the next steps? Are there any homework assignments or follow-up items?"
    ],
    "sections": [
      {
        "title": "Session Summary",
        "placeholder": "Brief overview of today''s session and key topics discussed",
        "required": true,
        "locked": false
      },
      {
        "title": "Progress Toward Goals",
        "placeholder": "Client''s progress on treatment goals and achievements",
        "required": true,
        "locked": false
      },
      {
        "title": "Interventions Used",
        "placeholder": "Therapeutic techniques and interventions applied during session",
        "required": true,
        "locked": false
      },
      {
        "title": "Client Response",
        "placeholder": "Client''s engagement and response to treatment interventions",
        "required": false,
        "locked": false
      },
      {
        "title": "Plan & Follow-Up",
        "placeholder": "Next steps, recommendations, and homework assignments",
        "required": true,
        "locked": false
      }
    ]
  }'::jsonb,
  true
)
on conflict (name) do nothing;

-- initial consultation note template (first session documentation)
insert into note_templates (name, description, structure, is_active)
values (
  'Initial Consultation',
  'Comprehensive first session documentation and assessment',
  '{
    "headers": [
      {
        "level": 1,
        "text": "Initial Consultation",
        "locked": true
      }
    ],
    "prompting_questions": [
      "What are the primary concerns that brought the client to seek services at this time?",
      "What relevant background information did the client share about their history (personal, family, medical, or prior treatment)?",
      "How is the client currently functioning in key life areas such as work, relationships, and daily activities?",
      "What goals does the client hope to achieve through treatment? What are their expectations?",
      "What treatment approach would you recommend? What are the next steps in the treatment plan?"
    ],
    "sections": [
      {
        "title": "Presenting Concern",
        "placeholder": "Primary concerns and reasons for seeking services",
        "required": true,
        "locked": false
      },
      {
        "title": "Background Information",
        "placeholder": "Relevant personal, family, medical, and treatment history",
        "required": true,
        "locked": false
      },
      {
        "title": "Current Functioning",
        "placeholder": "Client''s current status across life domains (work, relationships, daily functioning)",
        "required": true,
        "locked": false
      },
      {
        "title": "Goals & Expectations",
        "placeholder": "Client''s treatment goals and desired outcomes",
        "required": true,
        "locked": false
      },
      {
        "title": "Recommendations",
        "placeholder": "Proposed treatment approach and recommendations",
        "required": true,
        "locked": false
      }
    ]
  }'::jsonb,
  true
)
on conflict (name) do nothing;

-- simplified phq-9 assessment template (depression screening)
insert into assessment_templates (name, category, description, questions, scoring_rules, is_active)
values (
  'PHQ-9 (Simplified)',
  'mental_health',
  'Patient Health Questionnaire-9 - Simplified version for depression screening',
  '{
    "questions": [
      {
        "id": "q1",
        "text": "Little interest or pleasure in doing things",
        "type": "scale",
        "options": [
          {"value": 0, "label": "Not at all"},
          {"value": 1, "label": "Several days"},
          {"value": 2, "label": "More than half the days"},
          {"value": 3, "label": "Nearly every day"}
        ]
      },
      {
        "id": "q2",
        "text": "Feeling down, depressed, or hopeless",
        "type": "scale",
        "options": [
          {"value": 0, "label": "Not at all"},
          {"value": 1, "label": "Several days"},
          {"value": 2, "label": "More than half the days"},
          {"value": 3, "label": "Nearly every day"}
        ]
      },
      {
        "id": "q3",
        "text": "Trouble falling or staying asleep, or sleeping too much",
        "type": "scale",
        "options": [
          {"value": 0, "label": "Not at all"},
          {"value": 1, "label": "Several days"},
          {"value": 2, "label": "More than half the days"},
          {"value": 3, "label": "Nearly every day"}
        ]
      }
    ]
  }'::jsonb,
  '{
    "total_possible": 9,
    "interpretation": {
      "0-2": "Minimal depression",
      "3-5": "Mild depression",
      "6-9": "Moderate depression"
    }
  }'::jsonb,
  true
)
on conflict (name) do nothing;
