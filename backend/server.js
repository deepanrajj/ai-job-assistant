import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const ANALYZE_JOB_SCHEMA = {
  name: 'job_analysis',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      summary: { type: 'string' },
      requiredSkills: {
        type: 'array',
        items: { type: 'string' }
      },
      niceToHaveSkills: {
        type: 'array',
        items: { type: 'string' }
      },
      seniority: {
        type: 'string',
        enum: ['Junior', 'Mid', 'Senior', 'Lead', 'Unknown']
      },
      prepTasks: {
        type: 'array',
        items: { type: 'string' }
      }
    },
    required: [
      'summary',
      'requiredSkills',
      'niceToHaveSkills',
      'seniority',
      'prepTasks'
    ]
  },
  strict: true
};

const ASK_JOB_SCHEMA = {
  name: 'job_answer',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      answer: { type: 'string' }
    },
    required: ['answer']
  },
  strict: true
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/test', async (req, res) => {
  const response = await client.responses.create({
    model: 'gpt-5.4',
    input: 'Say hello'
  });

  res.json({ output: response.output_text });
});

app.post('/api/ai/analyze-job', async (req, res) => {
  try {
    const { description } = req.body ?? {};

    if (
      !description ||
      typeof description !== 'string' ||
      !description.trim()
    ) {
      return res.status(400).json({
        error: 'A non-empty job description is required.'
      });
    }

    const response = await client.responses.create({
      model: 'gpt-5.4',
      input: [
        {
          role: 'developer',
          content: [
            {
              type: 'input_text',
              text:
                'You analyze software engineering job descriptions. ' +
                'Extract concise, UI-friendly information. ' +
                'Do not invent skills that are not clearly supported by the text.'
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                'Analyze this job description and return structured data.\n\n' +
                description
            }
          ]
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: ANALYZE_JOB_SCHEMA.name,
          schema: ANALYZE_JOB_SCHEMA.schema,
          strict: ANALYZE_JOB_SCHEMA.strict
        }
      }
    });

    const parsed = JSON.parse(response.output_text);
    return res.json(parsed);
  } catch (error) {
    console.error('analyze-job error:', error);

    return res.status(500).json({
      error: 'Failed to analyze the job description.'
    });
  }
});

app.post('/api/ai/ask-job', async (req, res) => {
  try {
    const { description, question } = req.body ?? {};

    if (
      !description ||
      typeof description !== 'string' ||
      !description.trim()
    ) {
      return res.status(400).json({
        error: 'A non-empty job description is required.'
      });
    }

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        error: 'A non-empty question is required.'
      });
    }

    const response = await client.responses.create({
      model: 'gpt-5.4',
      input: [
        {
          role: 'developer',
          content: [
            {
              type: 'input_text',
              text:
                'Answer only from the provided job description. ' +
                'If the answer is not supported by the description, say that clearly.'
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                `Job description:\n${description}\n\n` +
                `Question:\n${question}`
            }
          ]
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: ASK_JOB_SCHEMA.name,
          schema: ASK_JOB_SCHEMA.schema,
          strict: ASK_JOB_SCHEMA.strict
        }
      }
    });

    const parsed = JSON.parse(response.output_text);
    return res.json(parsed);
  } catch (error) {
    console.error('ask-job error:', error);

    return res.status(500).json({
      error: 'Failed to answer the question.'
    });
  }
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
