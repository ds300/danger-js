import { Violation, isInline } from "../dsl/Violation"

/**
 * The representation of what running a Dangerfile generates.
 *
 * In the future I'd like this to be cross process, so please
 * do not add functions, only data to this interface.
 */
export interface DangerResults {
  /**
   * Failed messages
   */
  fails: Violation[]

  /**
   * Messages for info
   */
  warnings: Violation[]

  /**
   * A set of messages to show inline
   */
  messages: Violation[]

  /**
   * Markdown messages to attach at the bottom of the comment
   */
  markdowns: Violation[]
}

export interface DangerRuntimeContainer extends DangerResults {
  /**
   * Asynchronous functions to be run after parsing
   */
  scheduled?: any[]
}

export interface DangerInlineResults {
  /**
   * Path to the file
   *
   * @type {string}
   */
  file: string

  /**
   * Line in the file
   *
   * @type {string}
   */

  line: number

  /**
   * Failed messages
   */
  fails: string[]

  /**
   * Messages for info
   */
  warnings: string[]

  /**
   * A set of messages to show inline
   */
  messages: string[]

  /**
   * Markdown messages to attach at the bottom of the comment
   */
  markdowns: string[]
}

export const emptyDangerResults = {
  fails: [],
  warnings: [],
  messages: [],
  markdowns: [],
}

export function inlineResults(results: DangerResults): DangerResults {
  return sortResults({
    fails: results.fails.filter(m => isInline(m)),
    warnings: results.warnings.filter(m => isInline(m)),
    messages: results.messages.filter(m => isInline(m)),
    markdowns: results.markdowns.filter(m => isInline(m)),
  })
}

export function regularResults(results: DangerResults): DangerResults {
  return sortResults({
    fails: results.fails.filter(m => !isInline(m)),
    warnings: results.warnings.filter(m => !isInline(m)),
    messages: results.messages.filter(m => !isInline(m)),
    markdowns: results.markdowns.filter(m => !isInline(m)),
  })
}

export function mergeResults(results1: DangerResults, results2: DangerResults): DangerResults {
  return sortResults({
    fails: results1.fails.concat(results2.fails),
    warnings: results1.warnings.concat(results2.warnings),
    messages: results1.messages.concat(results2.messages),
    markdowns: results1.markdowns.concat(results2.markdowns),
  })
}

export function sortResults(results: DangerResults): DangerResults {
  let sortByFile = (a: Violation, b: Violation): number => {
    if (a.file === undefined) {
      return -1
    }
    if (b.file === undefined) {
      return 1
    }

    if (a.file == b.file) {
      if (a.line == undefined) {
        return -1
      }
      if (b.line == undefined) {
        return 1
      }

      if (a.line < b.line) {
        return -1
      } else if (a.line > b.line) {
        return 1
      } else {
        return 0
      }
    }

    if (a.file < b.file) {
      return -1
    } else {
      return 1
    }
  }

  return {
    fails: results.fails.sort(sortByFile),
    warnings: results.warnings.sort(sortByFile),
    messages: results.messages.sort(sortByFile),
    markdowns: results.markdowns.sort(sortByFile),
  }
}

export function resultsIntoInlineResults(results: DangerResults): DangerInlineResults[] {
  let dangerInlineResults: DangerInlineResults[] = []

  let violationsIntoInlineResults = (kind: string) => {
    for (let violation of results[kind]) {
      if (violation.file && violation.line) {
        let findInlineResult = dangerInlineResults.find(r => r.file == violation.file && r.line == violation.line)
        if (findInlineResult) {
          findInlineResult[kind].push(violation.message)
        } else {
          let inlineResult = {
            file: violation.file,
            line: violation.line,
            fails: [],
            warnings: [],
            messages: [],
            markdowns: [],
          }
          inlineResult[kind].push(violation.message)
          dangerInlineResults.push(inlineResult)
        }
      }
    }
  }
  Object.keys(results).forEach(violationsIntoInlineResults)

  return dangerInlineResults
}

export function inlineResultsIntoResults(inlineResults: DangerInlineResults): DangerResults {
  let messageToViolation = (message: string): Violation => {
    return { message: message, file: inlineResults.file, line: inlineResults.line }
  }

  return {
    fails: inlineResults.fails.map(messageToViolation),
    warnings: inlineResults.warnings.map(messageToViolation),
    messages: inlineResults.messages.map(messageToViolation),
    markdowns: inlineResults.markdowns.map(messageToViolation),
  }
}
