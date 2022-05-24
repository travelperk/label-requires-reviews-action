import {
  getRulesForLabels,
  getMaxReviewNumber,
  getCurrentReviewCount,
  findRepositoryInformation,
} from './main'
import { Toolkit, ToolkitOptions } from 'actions-toolkit'
import { GitHub } from 'actions-toolkit/lib/github'
import {
  Rule,
  IssuesListLabelsOnIssueParams,
  PullsListReviewsParams,
} from './types'

const args: ToolkitOptions = {
  event: [
    'pull_request_review.submitted',
    'pull_request_review.edited',
    'pull_request_review.dismissed',
    'pull_request.synchronize',
  ],
  secrets: ['GITHUB_TOKEN'],
}

Toolkit.run(async (toolkit: Toolkit) => {
  toolkit.log.info('Running Action')
  const configPath: string =
    process.env.CONFIG_PATH ?? '.github/label-requires-reviews.yml'
  const rules: Rule[] = toolkit.config(configPath)
  toolkit.log.info('Configured rules: ', rules)

  // Get the repository information
  if (!process.env.GITHUB_EVENT_PATH) {
    toolkit.exit.failure('Process env GITHUB_EVENT_PATH is undefined')
  }
  const {
    owner,
    issue_number,
    repo,
  }: IssuesListLabelsOnIssueParams = findRepositoryInformation(
    process.env.GITHUB_EVENT_PATH,
    toolkit.log,
    toolkit.exit
  )
  const client: GitHub = toolkit.github

  // Get the list of configuration rules for the labels on the issue
  const matchingRules: Rule[] = await getRulesForLabels(
    { owner, issue_number, repo },
    client,
    rules
  )
  toolkit.log.info('Matching rules: ', matchingRules)

  // Get the required number of required reviews from the rules
  const requiredReviews: number = getMaxReviewNumber(matchingRules)

  // Get the actual number of reviews from the issue
  const reviewCount: number = await getCurrentReviewCount(
    { owner, pull_number: issue_number, repo } as PullsListReviewsParams,
    client
  )
  if (reviewCount < requiredReviews) {
    toolkit.exit.failure(
      `Labels require ${requiredReviews} reviews but the PR only has ${reviewCount}`
    )
  }
  toolkit.exit.success(
    `Labels require ${requiredReviews} the PR has ${reviewCount}`
  )
}, args)
