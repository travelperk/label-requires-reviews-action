import {
  Rule,
  IssuesListLabelsOnIssueParams,
  PullsListReviewsParams
} from '../src/types'
import {
    getRulesForLabels,
    getMaxReviewNumber,
    getCurrentReviewCount,
    findRepositoryInformation
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
        listReviews: jest.fn()
    },
    paginate: jest.fn().mockImplementation((method, params) => method(params))
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
    const log = { info: jest.fn() } as any
    const exit = { neutral: jest.fn() } as any

    it('should return repository information for a valid PR event', () => {
        const path = require.resolve('./fixtures/pr_event.json')
        const result = findRepositoryInformation(path, log, exit)
        expect(result).toStrictEqual({
            issue_number: 123,
            owner: 'test-owner',
            repo: 'test-repo'
        })
        expect(log.info).toHaveBeenCalledWith('Checking labels for PR#123')
    })

    it('should call exit.neutral if PR number is missing', () => {
        const path = require.resolve('./fixtures/push_event.json')
        findRepositoryInformation(path, log, exit)
        expect(exit.neutral).toHaveBeenCalledWith(
            'Action not triggered by a PullRequest review action. PR ID is missing'
        )
    })
})

describe('getCurrentReviewCount', () => {
  it('should return the number of approved reviews handling overrides and dismissals',
      async () => {
          (client.pulls.listReviews as jest.Mock).mockResolvedValue([
                {state: "CHANGES_REQUESTED", user: {id: 1}},
                {state: "APPROVED", user: {id: 1}}, // User 1: APPROVED
                {state: "PENDING", user: {id: 2}},   // User 2: PENDING (ignored)
                {state: "APPROVED", user: {id: 3}},  // User 3: APPROVED
                {state: "APPROVED", user: {id: 4}},
                {state: "CHANGES_REQUESTED", user: {id: 4}}, // User 4: CHANGES_REQUESTED
                {state: "APPROVED", user: {id: 5}},
                {state: "DISMISSED", user: {id: 5}},         // User 5: DISMISSED
          ]);
          expect(await getCurrentReviewCount(LIST_REVIEWS_PARAMS, client)).toStrictEqual(2)
      }
  )

  it('should not count bot reviews', async () => {
      (client.pulls.listReviews as jest.Mock).mockResolvedValue([
          {state: "APPROVED", user: {id: 1, type: "User"}},
          {state: "APPROVED", user: {id: 2, type: "Bot"}},
      ]);
      expect(await getCurrentReviewCount(LIST_REVIEWS_PARAMS, client)).toStrictEqual(1)
  })

  it('should return 0 if there are no reviews', async () => {
      (client.pulls.listReviews as jest.Mock).mockResolvedValue([]);
      expect(await getCurrentReviewCount(LIST_REVIEWS_PARAMS, client)).toStrictEqual(0)
  })

  it('should ignore COMMENTED reviews', async () => {
      (client.pulls.listReviews as jest.Mock).mockResolvedValue([
          {state: "COMMENTED", user: {id: 1}},
          {state: "APPROVED", user: {id: 2}},
      ]);
      expect(await getCurrentReviewCount(LIST_REVIEWS_PARAMS, client)).toStrictEqual(1)
  })

  it('should handle pagination by aggregating reviews across "pages"', async () => {
      // Create a list of 150 reviews to ensure we exceed the default page size (30)
      const manyReviews = []
      // Add 120 "COMMENTED" reviews
      for (let i = 0; i < 120; i++) {
          manyReviews.push({state: "COMMENTED", user: {id: i + 100}})
      }
      // Add one approval that would be on "Page 1" (if per_page was 100)
      manyReviews.push({state: "APPROVED", user: {id: 1}})
      // Add one approval that would be on "Page 2"
      manyReviews.push({state: "APPROVED", user: {id: 2}});

      (client.pulls.listReviews as jest.Mock).mockResolvedValue(manyReviews);

      const count = await getCurrentReviewCount(LIST_REVIEWS_PARAMS, client)

      expect(count).toStrictEqual(2)
      // Verify paginate was called with per_page: 100
      expect(client.paginate).toHaveBeenCalledWith(
          client.pulls.listReviews,
          expect.objectContaining({ per_page: 100 })
      )
  })
})
