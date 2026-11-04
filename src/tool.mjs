// The one tool of this server: who5_score.
// It takes five WHO-5 answers (each 0 to 5) and returns the score from 0 to 100
// and a band. No model, no network, no storage: same input, same output.
// The item wording lives in https://github.com/liaizhan/ladder-who5.

const MULTIPLIER = 4;
const LOW_MAX = 28;
const REDUCED_MAX = 50;

export const TOOL = {
  name: 'who5_score',
  title: 'WHO-5 well-being score',
  description:
    'Scores the WHO-5 Well-Being Index. Use it when the user has answered the five WHO-5 items ' +
    'about the last two weeks and wants their score. Pass exactly five integers from 0 (at no time) ' +
    'to 5 (all of the time), in item order. Returns the score from 0 to 100 and a band: low (28 or less), ' +
    'reduced (29 to 50) or normal. The score is not a diagnosis. Do not use it for symptoms, illnesses or medication.',
  inputSchema: {
    type: 'object',
    properties: {
      answers: {
        type: 'array',
        description: 'Five WHO-5 answers in item order, each an integer from 0 to 5.',
        items: { type: 'integer', minimum: 0, maximum: 5 },
        minItems: 5,
        maxItems: 5,
      },
    },
    required: ['answers'],
    additionalProperties: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      score: { type: 'integer', minimum: 0, maximum: 100 },
      band: { type: 'string', enum: ['low', 'reduced', 'normal'] },
      message: { type: 'string' },
    },
    required: ['score', 'band', 'message'],
  },
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true },
};

const MESSAGES = {
  low: 'The score is very low. It is worth talking to a doctor or someone you trust soon. If you feel unsafe, call your local emergency number.',
  reduced: 'The score is reduced. It may help to look at sleep, rest and support over the next two weeks, and to repeat the check.',
  normal: 'The score is in the usual range.',
};

export class InvalidAnswers extends Error {}

export function scoreWho5(args) {
  const answers = args?.answers;
  if (!Array.isArray(answers) || answers.length !== 5) {
    throw new InvalidAnswers('who5_score needs exactly 5 answers.');
  }
  if (!answers.every((a) => Number.isInteger(a) && a >= 0 && a <= 5)) {
    throw new InvalidAnswers('Each answer must be an integer from 0 to 5.');
  }
  const score = answers.reduce((sum, a) => sum + a, 0) * MULTIPLIER;
  const band = score <= LOW_MAX ? 'low' : score <= REDUCED_MAX ? 'reduced' : 'normal';
  return { score, band, message: MESSAGES[band] };
}
