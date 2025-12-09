import { ConditionalRules, Operator } from '../types';

function evaluateCondition(
  questionKey: string,
  operator: Operator,
  expectedValue: any,
  answersSoFar: Record<string, any>
): boolean {
  const actualValue = answersSoFar[questionKey];

  if (actualValue === undefined || actualValue === null) {
    return false;
  }

  switch (operator) {
    case 'equals':
      if (Array.isArray(actualValue)) {
        return actualValue.includes(expectedValue);
      }
      return actualValue === expectedValue;

    case 'notEquals':
      if (Array.isArray(actualValue)) {
        return !actualValue.includes(expectedValue);
      }
      return actualValue !== expectedValue;

    case 'contains':
      if (typeof actualValue === 'string') {
        return actualValue.toLowerCase().includes(String(expectedValue).toLowerCase());
      }
      if (Array.isArray(actualValue)) {
        return actualValue.some(val =>
          String(val).toLowerCase().includes(String(expectedValue).toLowerCase())
        );
      }
      return false;

    default:
      return false;
  }
}

export function shouldShowQuestion(
  rules: ConditionalRules | null | undefined,
  answersSoFar: Record<string, any>
): boolean {
  if (!rules || !rules.conditions || rules.conditions.length === 0) {
    return true;
  }

  const results = rules.conditions.map(condition =>
    evaluateCondition(
      condition.questionKey,
      condition.operator,
      condition.value,
      answersSoFar
    )
  );

  if (rules.logic === 'AND') {
    return results.every(result => result === true);
  } else {
    return results.some(result => result === true);
  }
}
