import {InterpolationRegexp} from './constants';

// TODO: Look for a way to not need the 'this' keyword in the DOM maybe?
export function evaluateDOMExpression(
  expression: string,
  context?: any
): unknown {
  // I probably need to sanitize this
  let needsToReturn = expression.indexOf('return') === -1;
  return new Function(`
    ${needsToReturn ? 'return' : ''} ${expression};
    `).apply(context);
}

export function recurseElementNodes(
  element: HTMLElement,
  callback: (element: HTMLElement) => void,
  ignoreSelf?: boolean
): any {
  const root = element;
  const children = root.childNodes;
  if (!ignoreSelf) {
    callback(root);
  }
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    recurseElementNodes(child as HTMLElement, callback);
  }
}

export function interpolateText(text: string, context: any) {
  let matches = text.matchAll(InterpolationRegexp);
  let current = matches.next();
  let interpolated = text;
  while (!current.done) {
    let primitiveValue = String(
      evaluateDOMExpression(current.value[1], context)
    );
    interpolated = interpolated.replace(current.value[0], primitiveValue);
    current = matches.next();
  }
  return interpolated;
}

/**
 * PLEASE READ THIS
 * Safari doesn't support regex lookbehind/lookahead and i am not an expert
 * on regex to figure out how to properly match only for uses of a variable, for now this will do,
 * if you ever modify this, just make sure to RUN THE TESTS in utils.test.ts and keep all known
 * scenarios passing.
 * 
 * I see 3 options that should get rid of this function
 * 
 * .- Figure out a regex that works on safari to find and replace all uses of the variable with the array
 * pointing at its index
 * 
 * .- Get rid of the concept of find-and-replace when we need for a 'local' variable and implement a way
 * to actually store the local values for all nested children of HTMLBindHandlers that can potentially
 * generate 'local' variables
 * 
 * .- Attempt to use WebAssembly for string processing related tasks, including this one (even if we figure out
 * the regex thing or the local variable, this is a potential good idea)
 */
const operators = ['-', '+', '*', '/'];
const invalidBehindVariable = [']', '.'];
const validBehindVariable = [' ', '\n', '', '"', "'", ...operators];
const validAheadVariable = [' ', '', '[', '(', '.', ...operators];
export function findAndReplaceVariable(
  text: string,
  find: string,
  replace: string
): string {
  // Regex to find all instances of the word
  let regex = new RegExp(`\\b${find}\\b`, 'g');
  let matches = [...text.matchAll(regex)];
  let result = text;
  let replaceAtIndexes: number[] = [];
  // Iterate over the matches
  matches.forEach(match => {
    let textStartIndex = match.index || 0;
    let textEndIndex = textStartIndex + find.length;
    let charBehind = (textStartIndex >= 1 && text[textStartIndex - 1]) || '';
    let charAhead = text[textEndIndex] || '';

    // Manual look behind and ahead for valid characters that determine this is in fact
    // the variable we are looking for
    let validCharBehind =
      invalidBehindVariable.indexOf(charBehind) === -1 &&
      validBehindVariable.indexOf(charBehind) > -1;
    let validAheadChar = 
      validAheadVariable.indexOf(charAhead) > -1;

    // We count the single and double quotes behind the match to make sure this
    // match is not within quotes
    let numberOfSingleQuotes = 0;
    let numberOfDoubleQuotes = 0;
    let currentIteration = textStartIndex;
    while (currentIteration >= 0) {
      if (text[currentIteration] === '"') numberOfDoubleQuotes++;
      if (text[currentIteration] === "'") numberOfSingleQuotes++;
      currentIteration--;
    }

    // Final check of all the processing we did before
    if (validCharBehind && validAheadChar && numberOfSingleQuotes % 2 === 0 && numberOfDoubleQuotes % 2 === 0) {
      replaceAtIndexes.unshift(textStartIndex);
    }
  });

  // Iterate backwards to avoid messing with the indexes we found
  replaceAtIndexes.forEach((index) => {
    result = `${result.substring(0, index)}${replace}${result.substring(index + find.length, result.length)}`;
  });

  return result;
}