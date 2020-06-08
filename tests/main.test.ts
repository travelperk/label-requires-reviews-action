import {
  IssuesListLabelsOnIssueParams,
  PullsListReviewsParams
} from '@octokit/rest'
import { Rule } from '../src/types'
import {
    getRulesForLabels,
    getMaxReviewNumber,
    getCurrentReviewCount
} from '../src/main'

const MIGRATION_RULE: Rule = { label: "migration", reviews: 2 }
const TYPESCRIPT_RULE: Rule = { label: "typescript", reviews: 6 }
const LIST_LABELS_PARAMS: IssuesListLabelsOnIssueParams = {
    owner: 'travelperk',
    issue_number: 1,
    repo: 'repository'
}

const LIST_REVIEWS_PARAMS: PullsListReviewsParams = {
    owner: 'travelperk',
    pull_number: 1,
    repo: 'repository'
}

const client = {
    issues : {
        listLabelsOnIssue: jest.fn().mockResolvedValue({
            data: [
                {name: "migration"}
            ]
        })
    },
    pulls : {
        listReviews: jest.fn().mockResolvedValue({
            data: [
                {state: "APPROVED"},
                {state: "PENDING"},
                {state: "APPROVED"},
            ]
        })
    },
}

describe('getRulesForLabels', () => {
  it('should return empty array if no matching rule',
      async () => expect(await getRulesForLabels(LIST_LABELS_PARAMS, client, [TYPESCRIPT_RULE])).toStrictEqual([])
  )

  it('should get the matching rules for the Pull Request labels',
      async () => expect(
          await getRulesForLabels(LIST_LABELS_PARAMS, client, [TYPESCRIPT_RULE, MIGRATION_RULE])
      ).toStrictEqual([MIGRATION_RULE])
  )
})

describe('getMaxReviewNumber', () => {
  it('should return 0 reviews for an empty array',
      () => expect(getMaxReviewNumber([])).toStrictEqual(0)
  )

  it('should return the highest review number from a set of rules',
      () => expect(getMaxReviewNumber([TYPESCRIPT_RULE, MIGRATION_RULE])).toStrictEqual(6)
  )
})

describe('findRepositoryInformation', () => {
    //TODO: This tests are still missing
})

describe('getCurrentReviewCount', () => {
  it('should return the number of approved reviews',
      async () => expect(await getCurrentReviewCount(LIST_REVIEWS_PARAMS, client)).toStrictEqual(2)
  )
})
